import fs from 'fs';
import path from 'path';
import https from 'https';

import 'core/polyfill';
import { oneLine } from 'common-tags';
import defaultConfig from 'config';
import Express from 'express';
import helmet from 'helmet';
import { createMemoryHistory } from 'history';
import Raven from 'raven';
import cookie from 'react-cookie';
import * as React from 'react';
import ReactDOM from 'react-dom/server';
import NestedStatus from 'react-nested-status';
import { END } from 'redux-saga';
import WebpackIsomorphicTools from 'webpack-isomorphic-tools';

import log from 'core/logger';
import { createApiError } from 'core/api';
import Root from 'core/components/Root';
import ServerHtml from 'core/components/ServerHtml';
import * as middleware from 'core/middleware';
import { loadErrorPage } from 'core/reducers/errorPage';
import { dismissSurvey } from 'core/reducers/survey';
import { addQueryParamsToHistory, convertBoolean } from 'core/utils';
import {
  setAuthToken,
  setClientApp,
  setLang,
  setUserAgent,
} from 'core/actions';
import {
  getDirection,
  isValidLang,
  langToLocale,
  makeI18n,
} from 'core/i18n/utils';

import WebpackIsomorphicToolsConfig from './webpack-isomorphic-tools-config';

export const createHistory = ({ req }) => {
  return addQueryParamsToHistory({
    history: createMemoryHistory({ initialEntries: [req.url] }),
  });
};

export function getPageProps({ noScriptStyles = '', store, req, res, config }) {
  const appName = config.get('appName');
  const isDeployed = config.get('isDeployed');

  // Get SRI for deployed services only.
  const sriData = isDeployed
    ? JSON.parse(
        fs.readFileSync(path.join(config.get('basePath'), 'dist/sri.json')),
      )
    : {};

  // Check the lang supplied by res.locals.lang for validity
  // or fall-back to the default.
  const lang = isValidLang(res.locals.lang)
    ? res.locals.lang
    : config.get('defaultLang');
  const dir = getDirection(lang);
  store.dispatch(setLang(lang));
  if (res.locals.clientApp) {
    store.dispatch(setClientApp(res.locals.clientApp));
  } else if (req && req.url) {
    log.warn(`No clientApp for this URL: ${req.url}`);
  } else {
    log.warn('No clientApp (error)');
  }
  if (res.locals.userAgent) {
    store.dispatch(setUserAgent(res.locals.userAgent));
  } else {
    log.info('No userAgent found in request headers.');
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
    // A DNT header set to "1" means Do Not Track
    trackingEnabled:
      convertBoolean(config.get('trackingEnabled')) &&
      req.header('dnt') !== '1',
  };
}

function renderHTML({ props = {}, pageProps }) {
  return ReactDOM.renderToString(<ServerHtml {...pageProps} {...props} />);
}

function showErrorPage({ createStore, error = {}, req, res, status, config }) {
  const { store } = createStore({ history: createHistory({ req }) });
  const pageProps = getPageProps({ store, req, res, config });

  const componentDeclaredStatus = NestedStatus.rewind();
  let adjustedStatus = status || componentDeclaredStatus || 500;
  if (error.response && error.response.status) {
    adjustedStatus = error.response.status;
  }

  const apiError = createApiError({ response: { status: adjustedStatus } });
  store.dispatch(loadErrorPage({ error: apiError }));

  const HTML = renderHTML({ pageProps });
  return res
    .status(adjustedStatus)
    .send(`<!DOCTYPE html>\n${HTML}`)
    .end();
}

function sendHTML({ res, html }) {
  const componentDeclaredStatus = NestedStatus.rewind();
  return res
    .status(componentDeclaredStatus)
    .send(`<!DOCTYPE html>\n${html}`)
    .end();
}

function hydrateOnClient({ res, props = {}, pageProps }) {
  return sendHTML({
    html: renderHTML({ props, pageProps }),
    res,
  });
}

function baseServer(
  App,
  createStore,
  { appSagas, appInstanceName = null, config = defaultConfig, _HotShots } = {},
) {
  const appName =
    appInstanceName !== null ? appInstanceName : config.get('appName');

  const app = new Express();
  app.disable('x-powered-by');

  const sentryDsn = config.get('sentryDsn');
  if (sentryDsn) {
    Raven.config(sentryDsn, { logger: 'server-js' }).install();
    app.use(Raven.requestHandler());
    log.info(`Sentry reporting configured with DSN ${sentryDsn}`);
    // The error handler is defined below.
  } else {
    log.warn(
      'Sentry reporting is disabled; Set config.sentryDsn to enable it.',
    );
  }

  if (config.get('useDatadog') && config.get('datadogHost')) {
    log.info('Recording DataDog timing stats for all responses');
    app.use(middleware.datadogTiming({ _HotShots }));
  }

  app.use(middleware.logRequests);

  // Set HTTP Strict Transport Security headers
  app.use(middleware.hsts());

  // Sets X-Frame-Options
  app.use(middleware.frameguard());

  // Sets x-content-type-options:"nosniff"
  app.use(helmet.noSniff());

  // Sets x-xss-protection:"1; mode=block"
  app.use(helmet.xssFilter());

  // CSP configuration.
  const noScriptStyles = middleware.getNoScriptStyles(appName);
  app.use(middleware.csp({ noScriptStyles }));

  // Serve assets locally from node ap (no-op by default).
  if (config.get('enableNodeStatics')) {
    app.use(middleware.serveAssetsLocally());
  }

  // Show version/commit information as JSON.
  function viewVersion(req, res) {
    // This is a magic file that gets written by deployment scripts.
    const version = path.join(config.get('basePath'), 'version.json');

    fs.stat(version, (error) => {
      if (error) {
        log.error(`Could not stat version file ${version}: ${error}`);
        res.sendStatus(415);
      } else {
        res.setHeader('Content-Type', 'application/json');
        fs.createReadStream(version).pipe(res);
      }
    });
  }

  // Following the ops monitoring convention, return version info at this URL.
  app.get('/__version__', viewVersion);
  // For AMO, this helps differentiate from /__version__ served by addons-server.
  app.get('/__frontend_version__', viewVersion);

  // Return 200 for csp reports - this will need to be overridden when deployed.
  app.post('/__cspreport__', (req, res) => res.status(200).end('ok'));

  const isDevelopment = config.get('isDevelopment');
  if (appName === 'disco' && isDevelopment) {
    // We use 57 (the first version of Firefox Quantum) here so that any
    // version-dependent styles (eg.
    // https://github.com/mozilla/addons-frontend/blob/master/src/disco/css/App.scss)
    // are not loaded.
    const defaultVersion = '57.0';

    app.get('/', (req, res) => {
      res.redirect(
        302,
        `/en-US/firefox/discovery/pane/${defaultVersion}/Darwin/normal`,
      );
    });

    app.get('/:version/', (req, res) => {
      const version = req.params.version || defaultVersion;
      res.redirect(
        302,
        `/en-US/firefox/discovery/pane/${version}/Darwin/normal`,
      );
    });
  }

  // Handle application and lang redirections.
  if (config.get('enablePrefixMiddleware')) {
    app.use(middleware.prefixMiddleware);
  }

  // Add trailing slashes to URLs
  if (config.get('enableTrailingSlashesMiddleware')) {
    app.use(middleware.trailingSlashesMiddleware);
  }

  app.use(async (req, res, next) => {
    if (isDevelopment) {
      log.info(oneLine`Clearing require cache for webpack isomorphic tools.
        [Development Mode]`);

      // clear require() cache if in development mode
      webpackIsomorphicTools.refresh();
    }

    const cacheAllResponsesFor = config.get('cacheAllResponsesFor');
    if (cacheAllResponsesFor) {
      if (!isDevelopment) {
        throw new Error(oneLine`You cannot simulate the cache with
          the cacheAllResponsesFor config value when isDevelopment is false.
          In other words, we already do caching in hosted environments
          (via nginx) so this would be confusing!`);
      }
      log.warn(oneLine`Sending a Cache-Control header so that the client caches
        all requests for ${cacheAllResponsesFor} seconds`);
      res.set('Cache-Control', `public, max-age=${cacheAllResponsesFor}`);
    }

    // Vary the cache on Do Not Track headers.
    res.vary('DNT');

    const history = createHistory({ req });
    const { sagaMiddleware, store } = createStore({ history });

    let pageProps;
    let runningSagas;

    try {
      cookie.plugToRequest(req, res);

      let sagas = appSagas;
      if (!sagas) {
        // eslint-disable-next-line global-require, import/no-dynamic-require
        sagas = require(`${appName}/sagas`).default;
      }
      runningSagas = sagaMiddleware.run(sagas);

      // TODO: synchronize cookies with Redux store more automatically.
      // See https://github.com/mozilla/addons-frontend/issues/5617
      const token = cookie.load(config.get('cookieName'));
      if (token) {
        store.dispatch(setAuthToken(token));
      }
      if (
        cookie.load(config.get('dismissedExperienceSurveyCookieName')) !==
        undefined
      ) {
        store.dispatch(dismissSurvey());
      }

      pageProps = getPageProps({ noScriptStyles, store, req, res, config });

      if (config.get('disableSSR') === true) {
        // This stops all running sagas.
        store.dispatch(END);

        await runningSagas.done;
        log.warn('Server side rendering is disabled.');

        return hydrateOnClient({ res, pageProps });
      }
    } catch (preLoadError) {
      log.info(oneLine`Caught an error in match() before rendering:
          ${preLoadError}`);
      return next(preLoadError);
    }

    let i18nData = {};
    const { htmlLang } = pageProps;
    const locale = langToLocale(htmlLang);

    try {
      if (locale !== langToLocale(config.get('defaultLang'))) {
        // eslint-disable-next-line global-require, import/no-dynamic-require
        i18nData = require(`../../locale/${locale}/${appName}.js`);
      }
    } catch (e) {
      log.info(`Locale JSON not found or required for locale: "${locale}"`);
      log.info(`Falling back to default lang: "${config.get('defaultLang')}"`);
    }

    const i18n = makeI18n(i18nData, htmlLang);

    const props = {
      component: (
        <Root history={history} i18n={i18n} store={store}>
          <App />
        </Root>
      ),
    };

    // We need to render once because it will force components to
    // dispatch data loading actions which get processed by sagas.
    log.info('First component render to dispatch loading actions');
    renderHTML({ props, pageProps });

    // Send the redux-saga END action to stop sagas from running
    // indefinitely. This is only done for server-side rendering.
    store.dispatch(END);

    try {
      // Once all sagas have completed, we load the page.
      await runningSagas.done;
      log.info('Second component render after sagas have finished');

      const finalHTML = renderHTML({ props, pageProps });

      // A redirection has been requested, let's do it.
      const { redirectTo } = store.getState();
      if (redirectTo && redirectTo.url) {
        log.info(oneLine`Redirection requested:
            url=${redirectTo.url} status=${redirectTo.status}`);
        return res.redirect(redirectTo.status, redirectTo.url);
      }

      return sendHTML({ res, html: finalHTML });
    } catch (error) {
      log.error(`Caught error during rendering: ${error}`);
      return next(error);
    }
  });

  // Error handlers:

  if (sentryDsn) {
    app.use(Raven.errorHandler());
  }

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      log.warn(oneLine`Ignoring error for ${req.url}
        because a response was already sent; error: ${error}`);
      return next(error);
    }

    log.error(`Showing 500 page for error: ${error}`);
    log.error({ err: error }); // log the stack trace too.
    return showErrorPage({ createStore, error, status: 500, req, res, config });
  });

  return app;
}

export function runServer({
  listen = true,
  exitProcess = true,
  config = defaultConfig,
} = {}) {
  const port = config.get('serverPort');
  const host = config.get('serverHost');
  const appName = config.get('appName');

  const useHttpsForDev = process.env.USE_HTTPS_FOR_DEV;

  const isoMorphicServer = new WebpackIsomorphicTools(
    WebpackIsomorphicToolsConfig,
  );

  return new Promise((resolve) => {
    if (!appName) {
      throw new Error(
        `Please specify a valid appName from ${config.get('validAppNames')}`,
      );
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
        const App = require(`${appName}/components/App`).default;
        const createStore = require(`${appName}/store`).default;
        /* eslint-enable global-require, import/no-dynamic-require */
        let server = baseServer(App, createStore, {
          appInstanceName: appName,
        });
        if (listen === true) {
          if (useHttpsForDev) {
            if (host === 'example.com') {
              const options = {
                key: fs.readFileSync(
                  'bin/local-dev-server-certs/example.com.key.pem',
                ),
                cert: fs.readFileSync(
                  'bin/local-dev-server-certs/example.com.crt.pem',
                ),
                ca: fs.readFileSync(
                  'bin/local-dev-server-certs/example.com.ca.crt.pem',
                ),
                passphrase: '',
              };
              server = https.createServer(options, server);
            } else {
              log.info(
                `To use the HTTPS server you must serve the site at example.com (host was "${host}")`,
              );
            }
          }
          server.listen(port, host, (err) => {
            if (err) {
              return reject(err);
            }
            const proxyEnabled = convertBoolean(config.get('proxyEnabled'));
            // Not using oneLine here since it seems to change '  ' to ' '.
            log.info(
              [
                `🔥  Addons-frontend server is running`,
                `[ENV:${config.util.getEnv('NODE_ENV')}]`,
                `[APP:${appName}]`,
                `[isDevelopment:${config.get('isDevelopment')}]`,
                `[isDeployed:${config.get('isDeployed')}]`,
                `[apiHost:${config.get('apiHost')}]`,
                `[apiPath:${config.get('apiPath')}]`,
              ].join(' '),
            );
            if (proxyEnabled) {
              const proxyPort = config.get('proxyPort');
              log.info(
                `🚦  Proxy detected, frontend running at http://${host}:${port}.`,
              );
              log.info(
                `👁  Open your browser at http://localhost:${proxyPort} to view it.`,
              );
            } else {
              log.info(
                `👁  Open your browser at http${
                  useHttpsForDev ? 's' : ''
                }://${host}:${port} to view it.`,
              );
            }
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
