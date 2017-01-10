import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

import 'babel-polyfill';
import { oneLine } from 'common-tags';
import config from 'config';
import Express from 'express';
import helmet from 'helmet';
import cookie from 'react-cookie';
import React from 'react';
import ReactDOM from 'react-dom/server';
import { Provider } from 'react-redux';
import { match } from 'react-router';
import { ReduxAsyncConnect, loadOnServer } from 'redux-connect';
import WebpackIsomorphicTools from 'webpack-isomorphic-tools';

import ServerHtml from 'core/containers/ServerHtml';
import { prefixMiddleWare } from 'core/middleware';
import { convertBoolean } from 'core/utils';
import { setClientApp, setLang, setJWT } from 'core/actions';
import log from 'core/logger';
import {
  getDirection,
  isValidLang,
  langToLocale,
  makeI18n,
} from 'core/i18n/utils';
import I18nProvider from 'core/i18n/Provider';

import WebpackIsomorphicToolsConfig from './webpack-isomorphic-tools-config';


const env = config.util.getEnv('NODE_ENV');
const version = path.join(config.get('basePath'), 'version.json');
const isDeployed = config.get('isDeployed');
const isDevelopment = config.get('isDevelopment');

const errorPageText = {
  401: 'Unauthorized',
  404: 'Not Found',
  500: 'Internal Server Error',
};

function getNoScriptStyles({ appName }) {
  const cssPath = path.join(config.get('basePath'), `src/${appName}/noscript.css`);
  try {
    return fs.readFileSync(cssPath);
  } catch (e) {
    if (e.code !== 'ENOENT') {
      log.info(`noscript styles could not be parsed from ${cssPath}`);
    }
  }
  return undefined;
}

function showErrorPage(res, status) {
  const _status = status.toString();
  if (Object.keys(errorPageText).includes(_status)) {
    return res.status(_status).end(errorPageText[_status]);
  }
  return res.status('500').end(errorPageText['500']);
}

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

  // Set HTTP Strict Transport Security headers
  app.use(helmet.hsts({
    force: true,
    includeSubDomains: false,
    maxAge: 31536000, // seconds
  }));

  // Sets X-Frame-Options
  app.use(helmet.frameguard(config.get('frameGuard')));

  // Sets x-content-type-options:"nosniff"
  app.use(helmet.noSniff());

  // Sets x-xss-protection:"1; mode=block"
  app.use(helmet.xssFilter());

  // CSP configuration.
  const csp = config.get('CSP');
  const noScriptStyles = getNoScriptStyles({ appName: appInstanceName });
  if (noScriptStyles) {
    const hash = crypto.createHash('sha256').update(noScriptStyles).digest('base64');
    const cspValue = `'sha256-${hash}'`;
    if (!csp.directives.styleSrc.includes(cspValue)) {
      csp.directives.styleSrc.push(cspValue);
    }
  }
  app.use(helmet.contentSecurityPolicy(csp));

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
      log.info(oneLine`Clearing require cache for webpack isomorphic tools.
        [Development Mode]`);

      // clear require() cache if in development mode
      webpackIsomorphicTools.refresh();
    }

    match({ location: req.url, routes }, (
      err, redirectLocation, renderProps
    ) => {
      cookie.plugToRequest(req, res);

      if (err) {
        log.error({ err, req });
        return showErrorPage(res, 500);
      }

      if (!renderProps) {
        return showErrorPage(res, 404);
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
      const lang = isValidLang(res.locals.lang) ?
        res.locals.lang : config.get('defaultLang');
      const dir = getDirection(lang);
      const locale = langToLocale(lang);
      store.dispatch(setLang(lang));
      if (res.locals.clientApp) {
        store.dispatch(setClientApp(res.locals.clientApp));
      } else {
        log.warn(`No clientApp for this URL: ${req.url}`);
      }

      function hydrateOnClient(props = {}) {
        const pageProps = {
          appName: appInstanceName,
          assets: webpackIsomorphicTools.assets(),
          htmlLang: lang,
          htmlDir: dir,
          includeSri: isDeployed,
          noScriptStyles,
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
          let i18nData = {};
          try {
            if (locale !== langToLocale(config.get('defaultLang'))) {
              // eslint-disable-next-line global-require, import/no-dynamic-require
              i18nData = require(
                `../../locale/${locale}/${appInstanceName}.js`);
            }
          } catch (e) {
            log.info(
              `Locale JSON not found or required for locale: "${locale}"`);
            log.info(
              `Falling back to default lang: "${config.get('defaultLang')}".`);
          }
          const i18n = makeI18n(i18nData);

          const InitialComponent = (
            <I18nProvider i18n={i18n}>
              <Provider store={store} key="provider">
                <ReduxAsyncConnect {...renderProps} />
              </Provider>
            </I18nProvider>
          );

          const asyncConnectLoadState = store.getState().reduxAsyncConnect.loadState || {};

          // Create a list of any apiErrors detected.
          const apiErrors = Object.keys(asyncConnectLoadState)
            .map((item) => asyncConnectLoadState[item].error)
            .filter((item) => item);

          if (apiErrors.length === 1) {
            // If we have a single API error reflect that in the page's response.
            const apiStatus = apiErrors[0].response.status;
            return showErrorPage(res, apiStatus);
          } else if (apiErrors.length > 1) {
            // Otherwise we have multiple api errors it should be logged
            // and throw a 500.
            log.error(apiErrors);
            return showErrorPage(res, 500);
          }

          return hydrateOnClient({ component: InitialComponent });
        })
        .catch((error) => {
          log.error({ err: error });
          return showErrorPage(res, 500);
        });
    });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    log.error({ err });
    return showErrorPage(res, 500);
  });

  return app;
}

export function runServer({ listen = true, app = appName } = {}) {
  if (!app) {
    log.fatal(
      `Please specify a valid appName from ${config.get('validAppNames')}`);
    process.exit(1);
  }

  const port = config.get('serverPort');
  const host = config.get('serverHost');

  const isoMorphicServer = new WebpackIsomorphicTools(
    WebpackIsomorphicToolsConfig);
  return isoMorphicServer
    .server(config.get('basePath'))
    .then(() => {
      global.webpackIsomorphicTools = isoMorphicServer;
      // Webpack Isomorphic tools is ready
      // now fire up the actual server.
      return new Promise((resolve, reject) => {
        /* eslint-disable global-require, import/no-dynamic-require */
        const routes = require(`${app}/routes`).default;
        const createStore = require(`${app}/store`).default;
        /* eslint-enable global-require, import/no-dynamic-require */
        const server = baseServer(
          routes, createStore, { appInstanceName: app });
        if (listen === true) {
          server.listen(port, host, (err) => {
            if (err) {
              reject(err);
            }
            log.info(oneLine`🔥  Addons-frontend server is running [ENV:${env}]
              [APP:${app}] [isDevelopment:${isDevelopment}
              [isDeployed:${isDeployed}] [apiHost:${config.get('apiHost')}]
              [apiPath:${config.get('apiPath')}]`);
            log.info(
              `👁  Open your browser at http://${host}:${port} to view it.`);
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
