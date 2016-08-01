import 'babel-polyfill';

import fs from 'fs';
import Express from 'express';
import helmet from 'helmet';
import path from 'path';
import cookie from 'react-cookie';
import React from 'react';
import ReactDOM from 'react-dom/server';

import { Provider } from 'react-redux';
import { match } from 'react-router';
import { ReduxAsyncConnect, loadOnServer } from 'redux-async-connect';
import { prefixMiddleWare } from 'core/middleware';

import WebpackIsomorphicTools from 'webpack-isomorphic-tools';
import WebpackIsomorphicToolsConfig from 'webpack-isomorphic-tools-config';
import ServerHtml from 'core/containers/ServerHtml';

import config from 'config';
import { convertBoolean } from 'core/utils';
import { setLang, setJWT } from 'core/actions';
import log from 'core/logger';
import { getDirection, isValidLang, langToLocale } from 'core/i18n/utils';
import I18nProvider from 'core/i18n/Provider';
import Jed from 'jed';


const env = config.util.getEnv('NODE_ENV');
const version = path.join(config.get('basePath'), 'version.json');
const isDeployed = config.get('isDeployed');
const isDevelopment = config.get('isDevelopment');

const errorString = 'Internal Server Error';
const appName = config.get('appName');

function logRequests(req, res, next) {
  const start = new Date();
  next();
  const finish = new Date();
  const elapsed = finish - start;
  log.info({ req, res, start, finish, elapsed });
}

function baseServer(routes, createStore, { appInstanceName = appName } = {}) {
  const app = new Express();
  app.disable('x-powered-by');

  app.use(logRequests);

  // Set HSTS, note: helmet uses ms not seconds.
  app.use(helmet.hsts({ maxAge: 31536000000, force: true }));

  // Sets X-Frame-Options
  app.use(helmet.frameguard(config.get('frameGuard')));

  // Sets x-content-type-options:"nosniff"
  app.use(helmet.noSniff());

  // Sets x-xss-protection:"1; mode=block"
  app.use(helmet.xssFilter());

  // CSP configuration.
  app.use(helmet.contentSecurityPolicy(config.get('CSP')));

  if (config.get('enableNodeStatics')) {
    app.use(Express.static(path.join(config.get('basePath'), 'dist')));
  }

  // Return version information as json
  app.get('/__version__', (req, res) => {
    fs.stat(version, (err) => {
      if (err) {
        res.sendStatus(415);
      } else {
        res.setHeader('Content-Type', 'application/json');
        fs.createReadStream(version).pipe(res);
      }
    });
  });

  // Return 200 for csp reports - this will need to be overridden when deployed.
  app.post('/__cspreport__', (req, res) => res.status(200).end('ok'));

  // Redirect from / for the search app it's a 302 to prevent caching.
  if (appInstanceName === 'search') {
    app.get('/', (req, res) => res.redirect(302, '/search'));
  }

  if (appInstanceName === 'disco' && isDevelopment) {
    app.get('/', (req, res) =>
      res.redirect(302, '/en-US/firefox/discovery/pane/48.0/Darwin/normal'));
  }

  // Handle application and lang redirections.
  if (config.get('enablePrefixMiddleware')) {
    app.use(prefixMiddleWare);
  }

  app.use((req, res) => {
    if (isDevelopment) {
      log.info('Clearing require cache for webpack isomorphic tools. [Development Mode]');

      // clear require() cache if in development mode
      webpackIsomorphicTools.refresh();
    }

    match({ routes, location: req.url }, (err, redirectLocation, renderProps) => {
      cookie.plugToRequest(req, res);

      if (err) {
        log.error({ err, req });
        return res.status(500).end(errorString);
      }

      if (!renderProps) {
        return res.status(404).end('Not found.');
      }

      const store = createStore();
      const token = cookie.load(config.get('cookieName'));
      if (token) {
        store.dispatch(setJWT(token));
      }
      // Get SRI for deployed services only.
      const sriData = (isDeployed) ? JSON.parse(
        fs.readFileSync(path.join(config.get('basePath'), 'dist/sri.json'))
      ) : {};

      // Check the lang supplied by res.locals.lang for validity
      // or fall-back to the default.
      const lang = isValidLang(res.locals.lang) ? res.locals.lang : config.get('defaultLang');
      const dir = getDirection(lang);
      const locale = langToLocale(lang);
      store.dispatch(setLang(lang));

      function hydrateOnClient(props = {}) {
        const pageProps = {
          appName: appInstanceName,
          assets: webpackIsomorphicTools.assets(),
          htmlLang: lang,
          htmlDir: dir,
          includeSri: isDeployed,
          sriData,
          store,
          trackingEnabled: convertBoolean(config.get('trackingEnabled')),
          ...props,
        };

        const HTML = ReactDOM.renderToString(
          <ServerHtml {...pageProps} />);
        res.send(`<!DOCTYPE html>\n${HTML}`);
      }

      // Set disableSSR to true to debug
      // client-side-only render.
      if (config.get('disableSSR') === true) {
        return Promise.resolve(hydrateOnClient());
      }

      return loadOnServer({ ...renderProps, store })
        .then(() => {
          // eslint-disable-next-line global-require
          let jedData = {};
          try {
            if (locale !== langToLocale(config.get('defaultLang'))) {
              // eslint-disable-next-line global-require
              jedData = require(`json!../../locale/${locale}/${appInstanceName}.json`);
            }
          } catch (e) {
            log.info(`Locale JSON not found or required for locale: "${locale}"`);
            log.info(`Falling back to default lang: "${config.get('defaultLang')}".`);
          }
          const i18n = new Jed(jedData);
          const InitialComponent = (
            <I18nProvider i18n={i18n}>
              <Provider store={store} key="provider">
                <ReduxAsyncConnect {...renderProps} />
              </Provider>
            </I18nProvider>
          );

          return hydrateOnClient({ component: InitialComponent });
        })
        .catch((error) => {
          log.error({ err: error });
          res.status(500).end(errorString);
        });
    });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    log.error({ err });
    res.status(500).end(errorString);
  });

  return app;
}

export function runServer({ listen = true, app = appName } = {}) {
  if (!app) {
    log.fatal(`Please specify a valid appName from ${config.get('validAppNames')}`);
    process.exit(1);
  }

  const port = config.get('serverPort');
  const host = config.get('serverHost');

  const isoMorphicServer = new WebpackIsomorphicTools(WebpackIsomorphicToolsConfig);
  return isoMorphicServer.development(isDevelopment)
    .server(config.get('basePath'))
    .then(() => {
      global.webpackIsomorphicTools = isoMorphicServer;
      // Webpack Isomorphic tools is ready
      // now fire up the actual server.
      return new Promise((resolve, reject) => {
        /* eslint-disable global-require */
        const routes = require(`${app}/routes`).default;
        const createStore = require(`${app}/store`).default;
        /* eslint-enable global-require */
        const server = baseServer(routes, createStore, { appInstanceName: app });
        if (listen === true) {
          server.listen(port, host, (err) => {
            if (err) {
              reject(err);
            }
            log.info(`🔥  Addons-frontend server is running [ENV:${env}] [APP:${app}] ` +
                     `[isDevelopment:${isDevelopment}] [isDeployed:${isDeployed}] ` +
                     `[apiHost:${config.get('apiHost')}] [apiPath:${config.get('apiPath')}]`);
            log.info(`👁  Open your browser at http://${host}:${port} to view it.`);
            resolve(server);
          });
        } else {
          resolve(server);
        }
      });
    })
    .catch((err) => {
      log.error({ err });
    });
}

export default baseServer;
