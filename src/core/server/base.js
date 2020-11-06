import fs from 'fs';
import path from 'path';
import https from 'https';

import 'core/polyfill';
import { oneLine } from 'common-tags';
import defaultConfig from 'config';
import Express from 'express';
import httpContext from 'express-http-context';
import helmet from 'helmet';
import { createMemoryHistory } from 'history';
import Raven from 'raven';
import * as React from 'react';
import ReactDOM from 'react-dom/server';
import NestedStatus from 'react-nested-status';
import { END } from 'redux-saga';
import cookiesMiddleware from 'universal-cookie-express';
import WebpackIsomorphicTools from 'webpack-isomorphic-tools';
import { ChunkExtractor, ChunkExtractorManager } from '@loadable/server';

import log from 'core/logger';
import { REGION_CODE_HEADER, createApiError } from 'core/api';
import Root from 'core/components/Root';
import { AMO_REQUEST_ID_HEADER, APP_NAME } from 'core/constants';
import ServerHtml from 'core/components/ServerHtml';
import * as middleware from 'core/middleware';
import requestId from 'core/middleware/requestId';
import { loadErrorPage } from 'core/reducers/errorPage';
import { dismissSurvey } from 'core/reducers/survey';
import { addQueryParamsToHistory, convertBoolean } from 'core/utils';
import { viewFrontendVersionHandler } from 'core/utils/server';
import {
  setAuthToken,
  setClientApp,
  setLang,
  setRegionCode,
  setRequestId,
  setUserAgent,
} from 'core/reducers/api';
import {
  getDirection,
  isValidLang,
  langToLocale,
  makeI18n,
} from 'core/i18n/utils';
import { getDeploymentVersion } from 'core/utils/build';
import { getSentryRelease } from 'core/utils/sentry';
import { fetchSiteStatus, loadedPageIsAnonymous } from 'core/reducers/site';

import WebpackIsomorphicToolsConfig from './webpack-isomorphic-tools-config';

export const createHistory = ({ req }) => {
  return addQueryParamsToHistory({
    history: createMemoryHistory({ initialEntries: [req.url] }),
  });
};

export function getPageProps({ store, req, res, config }) {
  const isDeployed = config.get('isDeployed');

  // Get SRI for deployed services only.
  const sriData = isDeployed
    ? JSON.parse(
        fs.readFileSync(path.join(config.get('basePath'), 'dist/sri.json')),
      )
    : {};

  // Code-splitting.
  const chunkExtractor = new ChunkExtractor({
    stats: JSON.parse(fs.readFileSync(config.get('loadableStatsFile'))),
    entrypoints: [APP_NAME],
  });

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
    log.debug('No userAgent found in request headers.');
  }

  const regionCode = req.get(REGION_CODE_HEADER);
  if (regionCode) {
    store.dispatch(setRegionCode(regionCode));
  } else {
    log.debug(`No ${REGION_CODE_HEADER} found in request headers.`);
  }

  return {
    assets: webpackIsomorphicTools.assets(),
    chunkExtractor,
    htmlLang: lang,
    htmlDir: dir,
    includeSri: isDeployed,
    sriData,
    // A DNT header set to "1" means Do Not Track
    trackingEnabled:
      convertBoolean(config.get('trackingEnabled')) &&
      req.header('dnt') !== '1',
  };
}

function renderHTML({ props = {}, pageProps, store }) {
  // Capture the store state before beginning to render any components.
  // This will ensure that no other components in the render tree will
  // modify state before ServerHtml has a chance to serialize it.
  // https://github.com/mozilla/addons-frontend/issues/6729
  const appState = store.getState();
  return ReactDOM.renderToString(
    <ServerHtml {...pageProps} {...props} appState={appState} />,
  );
}

function showErrorPage({
  _createHistory,
  createStore,
  error = {},
  req,
  res,
  status,
  config,
}) {
  const { store } = createStore({ history: _createHistory({ req }) });
  const pageProps = getPageProps({ store, req, res, config });

  const componentDeclaredStatus = NestedStatus.rewind();
  let adjustedStatus = status || componentDeclaredStatus || 500;
  if (error.response && error.response.status) {
    adjustedStatus = error.response.status;
  }

  const apiError = createApiError({ response: { status: adjustedStatus } });
  store.dispatch(loadErrorPage({ error: apiError }));

  const HTML = renderHTML({ pageProps, store });
  return res.status(adjustedStatus).send(`<!DOCTYPE html>\n${HTML}`).end();
}

function sendHTML({ res, html }) {
  const componentDeclaredStatus = NestedStatus.rewind();
  return res
    .status(componentDeclaredStatus)
    .send(`<!DOCTYPE html>\n${html}`)
    .end();
}

function hydrateOnClient({ res, props = {}, pageProps, store }) {
  return sendHTML({
    html: renderHTML({ props, pageProps, store }),
    res,
  });
}

function baseServer(
  App,
  createStore,
  {
    _HotShots,
    _createHistory = createHistory,
    _log = log,
    appSagas,
    config = defaultConfig,
  } = {},
) {
  const app = new Express();
  app.disable('x-powered-by');

  if (config.get('enableRequestID')) {
    // This middleware must be set very early.
    app.use(httpContext.middleware);
    app.use(requestId);
  }

  const versionJson = JSON.parse(
    fs.readFileSync(path.join(config.get('basePath'), 'version.json')),
  );

  const sentryDsn = config.get('sentryDsn');
  if (sentryDsn) {
    Raven.config(sentryDsn, {
      logger: 'server-js',
      release: getSentryRelease({
        version: getDeploymentVersion({ versionJson }),
      }),
    }).install();
    app.use(Raven.requestHandler());
    _log.info(`Sentry reporting configured with DSN ${sentryDsn}`);
    // The error handler is defined below.
  } else {
    _log.warn(
      'Sentry reporting is disabled; Set config.sentryDsn to enable it.',
    );
  }

  if (config.get('useDatadog') && config.get('datadogHost')) {
    _log.info('Recording DataDog timing stats for all responses');
    app.use(middleware.datadogTiming({ _HotShots }));
  }

  // Set HTTP Strict Transport Security headers
  app.use(middleware.hsts());

  // Sets X-Frame-Options
  app.use(middleware.frameguard());

  // Sets x-content-type-options:"nosniff"
  app.use(helmet.noSniff());

  // Sets x-xss-protection:"1; mode=block"
  app.use(helmet.xssFilter());

  // CSP configuration.
  app.use(middleware.csp());

  // Serve assets locally from node ap (no-op by default).
  if (config.get('enableNodeStatics')) {
    app.use(middleware.serveAssetsLocally());
  }

  // This middleware adds `universalCookies` to the Express request.
  app.use(cookiesMiddleware());

  // Following the ops monitoring Dockerflow convention, return version info at
  // this URL. See: https://github.com/mozilla-services/Dockerflow
  app.get('/__version__', viewFrontendVersionHandler());
  // For AMO, this helps differentiate from /__version__ served by addons-server.
  app.get('/__frontend_version__', viewFrontendVersionHandler());

  // Return 200 for csp reports - this will need to be overridden when deployed.
  app.post('/__cspreport__', (req, res) => res.status(200).end('ok'));

  const isDevelopment = config.get('isDevelopment');

  // Handle application and lang redirections.
  if (config.get('enablePrefixMiddleware')) {
    app.use(middleware.prefixMiddleware);
  }

  // Add trailing slashes to URLs
  if (config.get('enableTrailingSlashesMiddleware')) {
    app.use(middleware.trailingSlashesMiddleware);
  }

  app.use(async (req, res, next) => {
    try {
      if (isDevelopment) {
        _log.info(oneLine`Clearing require cache for webpack isomorphic tools.
        [Development Mode]`);

        // clear require() cache if in development mode
        webpackIsomorphicTools.refresh();
      }

      const isAnonymousPage =
        config
          .get('anonymousPagePatterns')
          .filter((pattern) => new RegExp(pattern).test(req.originalUrl))
          .length !== 0;

      // Make sure the initial page does not get stored. Specifically, we
      // don't want the auth token in Redux state to hang around.
      // See https://github.com/mozilla/addons-frontend/issues/6217
      //
      // The site operates as a single page app so this should really
      // only affect how the browser loads the page when clicking
      // the back button.
      //
      res.set('Cache-Control', isAnonymousPage ? ['public'] : ['no-store']);

      // Vary the cache on Do Not Track headers.
      res.vary('DNT');

      const history = _createHistory({ req });
      const { sagaMiddleware, store } = createStore({ history });

      let pageProps;
      let runningSagas;

      const thisRequestId = res.get(AMO_REQUEST_ID_HEADER);
      if (thisRequestId) {
        store.dispatch(setRequestId(thisRequestId));
      }

      try {
        let sagas = appSagas;
        if (!sagas) {
          // eslint-disable-next-line global-require, import/no-dynamic-require
          sagas = require(`${APP_NAME}/sagas`).default;
        }
        runningSagas = sagaMiddleware.run(sagas);

        if (isAnonymousPage) {
          store.dispatch(loadedPageIsAnonymous());
        } else {
          // TODO: synchronize cookies with Redux store more automatically.
          // See https://github.com/mozilla/addons-frontend/issues/5617
          const token = req.universalCookies.get(config.get('cookieName'));
          if (token) {
            store.dispatch(setAuthToken(token));
          } else {
            // We only need to do this without a token because the user login
            // saga already sets the site status (the Users API returns site
            // status in its response).
            store.dispatch(fetchSiteStatus());
          }
        }

        if (
          req.universalCookies.get(
            config.get('dismissedExperienceSurveyCookieName'),
          ) !== undefined
        ) {
          store.dispatch(dismissSurvey());
        }

        pageProps = getPageProps({ store, req, res, config });

        if (config.get('disableSSR') === true) {
          // This stops all running sagas.
          store.dispatch(END);

          await runningSagas.done;
          _log.warn('Server side rendering is disabled.');

          return hydrateOnClient({ res, pageProps, store });
        }
      } catch (preLoadError) {
        _log.error(`Caught an error before rendering: ${preLoadError}`);
        return next(preLoadError);
      }

      let i18nData = {};
      const { htmlLang } = pageProps;
      const locale = langToLocale(htmlLang);

      try {
        if (locale !== langToLocale(config.get('defaultLang'))) {
          // eslint-disable-next-line global-require, import/no-dynamic-require
          i18nData = require(`../../locale/${locale}/${APP_NAME}.js`);
        }
      } catch (e) {
        _log.info(`Locale JSON not found or required for locale: "${locale}"`);
        _log.info(
          `Falling back to default lang: "${config.get('defaultLang')}"`,
        );
      }

      const i18n = makeI18n(i18nData, htmlLang);

      const props = {
        component: (
          <ChunkExtractorManager extractor={pageProps.chunkExtractor}>
            <Root
              cookies={req.universalCookies}
              history={history}
              i18n={i18n}
              store={store}
            >
              <App />
            </Root>
          </ChunkExtractorManager>
        ),
      };

      // We need to render once because it will force components to
      // dispatch data loading actions which get processed by sagas.
      _log.debug('First component render to dispatch loading actions');
      renderHTML({ props, pageProps, store });

      // Send the redux-saga END action to stop sagas from running
      // indefinitely. This is only done for server-side rendering.
      store.dispatch(END);

      try {
        // Once all sagas have completed, we load the page.
        await runningSagas.done;
        _log.debug('Second component render after sagas have finished');

        const finalHTML = renderHTML({ props, pageProps, store });

        const { redirectTo, users } = store.getState();

        // A redirection has been requested, let's do it.
        if (redirectTo && redirectTo.url) {
          _log.debug(oneLine`Redirection requested:
            url=${redirectTo.url} status=${redirectTo.status}`);
          return res.redirect(redirectTo.status, redirectTo.url);
        }

        // See: https://github.com/mozilla/addons-frontend/issues/9482
        if (users && users.currentUserWasLoggedOut === true) {
          req.universalCookies.remove(config.get('cookieName'), {
            domain: config.get('cookieDomain'),
            httpOnly: true,
            path: '/',
            sameSite: config.get('cookieSameSite'),
            secure: config.get('cookieSecure'),
          });
          // This is the Django session cookie, it needs to be removed to allow
          // users to log in again successfully after account deletion.
          // See: https://github.com/mozilla/addons-frontend/issues/9495
          req.universalCookies.remove('sessionid', {
            domain: config.get('cookieDomain'),
            httpOnly: true,
            path: '/',
            sameSite: config.get('cookieSameSite'),
            secure: config.get('cookieSecure'),
          });
          _log.debug('Cleared cookies');
        }

        return sendHTML({ res, html: finalHTML });
      } catch (error) {
        _log.error(`Caught error during rendering: ${error}`);
        return next(error);
      }
    } catch (handlerError) {
      _log.error(oneLine`Caught an unexpected error while handling the request:
        ${handlerError}`);

      return next(handlerError);
    }
  });

  // Error handlers:

  if (sentryDsn) {
    app.use(Raven.errorHandler());
  }

  app.use((error, req, res, next) => {
    try {
      if (res.headersSent) {
        _log.warn(oneLine`Ignoring error for ${req.url} because a response was
          already sent; error: ${error}`);

        return next(error);
      }

      _log.error(`Showing 500 page for error: ${error}`);
      // eslint-disable-next-line amo/only-log-strings
      _log.error(error); // log the stack trace too.

      return showErrorPage({
        _createHistory,
        createStore,
        error,
        status: 500,
        req,
        res,
        config,
      });
    } catch (recoveryError) {
      _log.error(oneLine`Additionally, the error handler caught an error:
        ${recoveryError}`);
      // eslint-disable-next-line amo/only-log-strings
      _log.error(recoveryError); // log the stack trace too.

      // Pass the original error to the next error handler.
      return next(error);
    }
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

  const useHttpsForDev = process.env.USE_HTTPS_FOR_DEV;

  const isoMorphicServer = new WebpackIsomorphicTools(
    WebpackIsomorphicToolsConfig,
  );

  return isoMorphicServer
    .server(config.get('basePath'))
    .then(() => {
      global.webpackIsomorphicTools = isoMorphicServer;
      // Webpack Isomorphic tools is ready
      // now fire up the actual server.
      return new Promise((resolve, reject) => {
        /* eslint-disable global-require, import/no-dynamic-require */
        const App = require(`${APP_NAME}/components/App`).default;
        const createStore = require(`${APP_NAME}/store`).default;
        /* eslint-enable global-require, import/no-dynamic-require */
        let server = baseServer(App, createStore);
        if (listen === true) {
          if (useHttpsForDev) {
            if (host === 'example.com') {
              const options = {
                key: fs.readFileSync(
                  'bin/local-dev-server-certs/example.com-key.pem',
                ),
                cert: fs.readFileSync(
                  'bin/local-dev-server-certs/example.com.pem',
                ),
                passphrase: '',
              };
              server = https.createServer(options, server);
            } else {
              log.debug(
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
            // eslint-disable-next-line amo/only-log-strings
            log.info(
              [
                `🔥 Addons-frontend server is running`,
                `[ENV:${config.util.getEnv('NODE_ENV')}]`,
                `[isDevelopment:${config.get('isDevelopment')}]`,
                `[isDeployed:${config.get('isDeployed')}]`,
                `[apiHost:${config.get('apiHost')}]`,
                `[apiPath:${config.get('apiPath')}]`,
                `[apiVersion:${config.get('apiVersion')}]`,
              ].join(' '),
            );
            if (proxyEnabled) {
              const proxyPort = config.get('proxyPort');
              log.debug(
                `🚦 Proxy detected, frontend running at http://${host}:${port}.`,
              );
              log.debug(
                `👁  Open your browser at http${
                  useHttpsForDev ? 's' : ''
                }://${host}:${proxyPort} to view it.`,
              );
            } else {
              log.debug(
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
      // eslint-disable-next-line amo/only-log-strings
      log.error({ err });

      if (exitProcess) {
        process.exit(1);
      } else {
        throw err;
      }
    });
}
export default baseServer;
