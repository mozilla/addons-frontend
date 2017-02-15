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
import NestedStatus from 'react-nested-status';
import { Provider } from 'react-redux';
import { match } from 'react-router';
import { ReduxAsyncConnect, loadOnServer } from 'redux-connect';
import { loadFail } from 'redux-connect/lib/store';
import WebpackIsomorphicTools from 'webpack-isomorphic-tools';

import { createApiError } from 'core/api';
import ServerHtml from 'core/containers/ServerHtml';
import { prefixMiddleWare, trailingSlashesMiddleware } from 'core/middleware';
import { convertBoolean } from 'core/utils';
import { setClientApp, setLang, setJwt } from 'core/actions';
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

function getNoScriptStyles({ appName }) {
  const cssPath = path.join(config.get('basePath'), `src/${appName}/noscript.css`);
  try {
    return fs.readFileSync(cssPath);
  } catch (e) {
    if (e.code !== 'ENOENT') {
      log.info(`noscript styles could not be parsed from ${cssPath}`);
    } else {
      log.debug(`noscript styles not found at ${cssPath}`);
    }
  }
  return undefined;
}

const appName = config.get('appName');

function getPageProps({ noScriptStyles = '', store, req, res }) {
  // Get SRI for deployed services only.
  const sriData = (isDeployed) ? JSON.parse(
    fs.readFileSync(path.join(config.get('basePath'), 'dist/sri.json'))
  ) : {};

  // Check the lang supplied by res.locals.lang for validity
  // or fall-back to the default.
  const lang = isValidLang(res.locals.lang) ?
    res.locals.lang : config.get('defaultLang');
  const dir = getDirection(lang);
  store.dispatch(setLang(lang));
  if (res.locals.clientApp) {
    store.dispatch(setClientApp(res.locals.clientApp));
  } else if (req && req.url) {
    log.warn(`No clientApp for this URL: ${req.url}`);
  } else {
    log.warn('No clientApp (error)');
  }

  return {
    appName,
    assets: webpackIsomorphicTools.assets(),
    htmlLang: lang,
    htmlDir: dir,
    includeSri: isDeployed,
    noScriptStyles,
    sriData,
    store,
    trackingEnabled: convertBoolean(config.get('trackingEnabled')),
  };
}

function showErrorPage({ createStore, error = {}, req, res, status }) {
  const store = createStore();
  const pageProps = getPageProps({ store, req, res });

  const apiError = createApiError({ response: { status } });
  store.dispatch(loadFail('ServerBase', { ...apiError, ...error }));

  const HTML = ReactDOM.renderToString(
    <ServerHtml {...pageProps} />);
  const httpStatus = NestedStatus.rewind();
  return res.status(status || httpStatus)
    .send(`<!DOCTYPE html>\n${HTML}`)
    .end();
}

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
  if (csp) {
    if (noScriptStyles) {
      const hash = crypto.createHash('sha256').update(noScriptStyles).digest('base64');
      const cspValue = `'sha256-${hash}'`;
      if (!csp.directives.styleSrc.includes(cspValue)) {
        csp.directives.styleSrc.push(cspValue);
      }
    }
    app.use(helmet.contentSecurityPolicy(csp));
  } else {
    log.warn('CSP has been disabled from the config');
  }

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

  // Add trailing slashes to URLs
  if (config.get('enableTrailingSlashesMiddleware')) {
    app.use(trailingSlashesMiddleware);
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

      const store = createStore();
      const token = cookie.load(config.get('cookieName'));
      if (token) {
        store.dispatch(setJwt(token));
      }

      // github.com/mozilla/addons-frontend/pull/1685#discussion_r99705186
      if (err) {
        return showErrorPage({ createStore, status: 500, req, res });
      }

      if (!renderProps) {
        return showErrorPage({ createStore, status: 404, req, res });
      }

      const pageProps = getPageProps({ noScriptStyles, store, req, res });
      const { htmlLang } = pageProps;
      const locale = langToLocale(htmlLang);

      function hydrateOnClient(props = {}) {
        const HTML = ReactDOM.renderToString(
          <ServerHtml {...pageProps} {...props} />);
        const httpStatus = NestedStatus.rewind();
        res.status(httpStatus).send(`<!DOCTYPE html>\n${HTML}`);
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
          const i18n = makeI18n(i18nData, htmlLang);

          const InitialComponent = (
            <I18nProvider i18n={i18n}>
              <Provider store={store} key="provider">
                <ReduxAsyncConnect {...renderProps} />
              </Provider>
            </I18nProvider>
          );

          const errorPage = store.getState().errorPage;
          if (errorPage && errorPage.hasError) {
            return showErrorPage({
              createStore,
              error: errorPage.error,
              req,
              res,
              status: errorPage.statusCode,
            });
          }

          return hydrateOnClient({ component: InitialComponent });
        })
        .catch((error) => {
          log.error({ err: error });
          return showErrorPage({ createStore, error, status: 500, req, res });
        });
    });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    log.error({ err: error });
    return showErrorPage({ createStore, error, status: 500, req, res });
  });

  return app;
}

export function runServer({
  listen = true, app = appName, exitProcess = true,
} = {}) {
  const port = config.get('serverPort');
  const host = config.get('serverHost');

  const isoMorphicServer = new WebpackIsomorphicTools(
    WebpackIsomorphicToolsConfig);

  return new Promise((resolve) => {
    if (!app) {
      throw new Error(
        `Please specify a valid appName from ${config.get('validAppNames')}`);
    }
    resolve();
  })
    .then(() => isoMorphicServer.server(config.get('basePath')))
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
              return reject(err);
            }
            log.info(oneLine`🔥  Addons-frontend server is running [ENV:${env}]
              [APP:${app}] [isDevelopment:${isDevelopment}
              [isDeployed:${isDeployed}] [apiHost:${config.get('apiHost')}]
              [apiPath:${config.get('apiPath')}]`);
            log.info(
              `👁  Open your browser at http://${host}:${port} to view it.`);
            return resolve(server);
          });
        } else {
          resolve(server);
        }
      });
    })
    .catch((err) => {
      log.error({ err });
      if (exitProcess) {
        process.exit(1);
      } else {
        throw err;
      }
    });
}

export default baseServer;
