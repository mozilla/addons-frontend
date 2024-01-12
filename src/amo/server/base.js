import fs from 'fs';
import path from 'path';
import https from 'https';

import 'amo/polyfill';
import { oneLine } from 'common-tags';
import compression from 'compression';
import defaultConfig from 'config';
import Express from 'express';
import httpContext from 'express-http-context';
import helmet from 'helmet';
import { createMemoryHistory } from 'history';
import * as React from 'react';
import ReactDOM from 'react-dom/server';
import NestedStatus from 'react-nested-status';
import { END } from 'redux-saga';
import cookiesMiddleware from 'universal-cookie-express';
import i18nextMiddleware from 'i18next-http-middleware';
import WebpackIsomorphicTools from 'webpack-isomorphic-tools';

import log from 'amo/logger';
import { REGION_CODE_HEADER, createApiError } from 'amo/api';
import Root from 'amo/components/Root';
import { AMO_REQUEST_ID_HEADER } from 'amo/constants';
import ServerHtml from 'amo/components/ServerHtml';
import * as middleware from 'amo/middleware';
import requestId from 'amo/middleware/requestId';
import { loadErrorPage } from 'amo/reducers/errorPage';
import { addQueryParamsToHistory, convertBoolean } from 'amo/utils';
import {
  viewFrontendVersionHandler,
  viewHeartbeatHandler,
} from 'amo/utils/server';
import {
  setAuthToken,
  setClientApp,
  setLang,
  setRegionCode,
  setRequestId,
  setUserAgent,
} from 'amo/reducers/api';
import {
  getDirection,
  isValidLang,
  langToLocale,
  makeI18n,
} from 'amo/i18n/utils';
import { fetchSiteStatus, loadedPageIsAnonymous } from 'amo/reducers/site';
import { init as initI18next } from 'amo/i18next';

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

  console.log('store', req.i18n.store.data);

  return {
    initialI18nStore: req.i18n.store.data,
    assets: webpackIsomorphicTools.assets(),
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
  app,
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
  app.disable('x-powered-by');

  if (config.get('enableRequestID')) {
    // This middleware must be set very early.
    app.use(httpContext.middleware);
    app.use(requestId);
  }

  app.use(middleware.responseTime({ _config: config, _HotShots }));

  // Enable gzip compression
  app.use(compression());

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
    app.use(config.get('staticPath'), middleware.serveAssetsLocally());
  }

  // This middleware adds `universalCookies` to the Express request.
  app.use(cookiesMiddleware());

  // Following the ops monitoring Dockerflow convention, return version info at
  // this URL. See: https://github.com/mozilla-services/Dockerflow
  app.get('/__version__', viewFrontendVersionHandler());
  // For AMO, this helps differentiate from /__version__ served by addons-server.
  app.get('/__frontend_version__', viewFrontendVersionHandler());
  // Also return info for requests to __heartbeat__ and __lbheartbeat__.
  app.get('/__frontend_heartbeat__', viewHeartbeatHandler());
  app.get('/__frontend_lbheartbeat__', (req, res) => {
    return res.status(200).end('ok');
  });

  // Return 200 for csp reports - this will need to be overridden when deployed.
  app.post('/__cspreport__', (req, res) => res.status(200).end('ok'));

  const isDevelopment = config.get('isDevelopment');

  // Handle application and lang redirections.
  if (config.get('enablePrefixMiddleware')) {
    app.use(middleware.prefixMiddleware);
  }

  app.use((req, res, next) => {
    req.i18n.changeLanguage(res.locals.lang);
    next();
  });

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

      // Make sure the initial page does not get stored in browser caches.
      // Specifically, we don't want the auth token in Redux state to hang
      // around. See https://github.com/mozilla/addons-frontend/issues/6217
      //
      // The site operates as a single page app so this should really
      // only affect how the browser loads the page when clicking
      // the back button.
      res.set('Cache-Control', isAnonymousPage ? ['public'] : ['max-age=0']);

      // Vary the cache on Do Not Track headers, because if enabled we serve
      // a different HTML without Google Analytics script included.
      res.vary('DNT');

      // Vary on User-Agent, because we serve different install buttons or
      // banners depending on the user-agent.
      res.vary('User-Agent');

      let history;

      try {
        history = _createHistory({ req });
      } catch (error) {
        // See https://github.com/mozilla/addons-frontend/issues/10061
        if (error instanceof URIError) {
          _log.error(`Caught an error during createHistory: ${error}`);
          return res
            .status(404)
            .send(
              `<!DOCTYPE html>\nWe're sorry, we were unable to parse the request URL: ${error}`,
            )
            .end();
        }
        throw error;
      }

      const { connectedHistory, sagaMiddleware, store } = createStore({
        history,
      });

      let pageProps;
      let runningSagas;

      const thisRequestId = res.get(AMO_REQUEST_ID_HEADER);
      if (thisRequestId) {
        store.dispatch(setRequestId(thisRequestId));
      }

      const token = req.universalCookies.get(config.get('cookieName'));

      try {
        let sagas = appSagas;
        if (!sagas) {
          // eslint-disable-next-line global-require, import/no-dynamic-require
          sagas = require('amo/sagas').default;
        }
        runningSagas = sagaMiddleware.run(sagas);

        if (isAnonymousPage) {
          store.dispatch(loadedPageIsAnonymous());
        } else if (token) {
          // TODO: synchronize cookies with Redux store more automatically.
          // See https://github.com/mozilla/addons-frontend/issues/5617
          store.dispatch(setAuthToken(token));
        } else {
          // We only need to do this without a token because the user login
          // saga already sets the site status (the Users API returns site
          // status in its response).
          store.dispatch(fetchSiteStatus());
        }

        pageProps = getPageProps({ store, req, res, config });

        if (config.get('disableSSR') === true) {
          // This stops all running sagas.
          store.dispatch(END);

          await runningSagas.toPromise();
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
          i18nData = require(`../../locale/${locale}/amo.js`);
        }
      } catch (e) {
        _log.info(`Locale JSON not found or required for locale: "${locale}"`);
        _log.info(
          `Falling back to default lang: "${config.get('defaultLang')}"`,
        );
      }

      const jed = makeI18n(i18nData, htmlLang);

      // TODO: language server side is still wrong.. proably the wrong instance.
      const props = {
        component: (
          <Root
            cookies={req.universalCookies}
            history={connectedHistory}
            jed={jed}
            i18next={req.i18n}
            store={store}
          >
            <App />
          </Root>
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
        await runningSagas.toPromise();
        _log.debug('Second component render after sagas have finished');

        const finalHTML = renderHTML({ props, pageProps, store });

        // We can only call rewind() once, so only peek() to get the status
        // code from nested component so that we can still call rewind() later.
        const componentDeclaredStatus = NestedStatus.peek();
        const { redirectTo, users } = store.getState();

        const isRedirecting = redirectTo && redirectTo.url;
        const responseStatusCode = isRedirecting
          ? redirectTo.status
          : componentDeclaredStatus || res.statusCode;
        if (
          ['GET', 'HEAD'].includes(req.method) &&
          responseStatusCode >= 200 &&
          responseStatusCode < 400 &&
          !token
        ) {
          // We tell public caches (nginx, proxies, CDN) to cache all succesful
          // anonymous responses coming from "safe" requests: GET/HEAD verb,
          // 20x/30x status, no special cookies. nginx/CDN config has similar
          // config to only serve cached responses to such requests.
          // Note that we have both max-age and s-maxage set. The latter
          // overrides the former, but just for shared caches, so browsers
          // continue to not cache our pages while nginx/CDN can if it's safe
          // to do so.
          _log.debug(oneLine`${req.method} -> ${responseStatusCode},
            redirecting=${isRedirecting} anonymous=${!token}:
            response should be cached.`);
          res.append('Cache-Control', 's-maxage=180');
          // The following is for backwards-compatibility until we have
          // switched nginx to obey Cache-Control instead.
          res.set('X-Accel-Expires', '180');
        } else {
          _log.debug(oneLine`${req.method} -> ${responseStatusCode},
            redirecting=${isRedirecting} anonymous=${!token}:
            response should *not* be cached.`);
          // Redundant since we set max-age=0 by default but doesn't hurt, and
          // leaves us free to change our policy around browser caching in the
          // long run without affecting shared caches.
          res.append('Cache-Control', 's-maxage=0');
        }

        // A redirection has been requested, let's do it.
        if (isRedirecting) {
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

  app.use((error, req, res, next) => {
    try {
      if (res.headersSent) {
        _log.warn(oneLine`Ignoring error for ${req.url} because a response was
          already sent; error: ${error}`);

        return next(error);
      }

      _log.error(`Showing 500 page for error: ${error}`);
      // eslint-disable-next-line amo/only-log-strings
      _log.error('%o', error); // log the stack trace too.

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
      _log.error('%o', recoveryError); // log the stack trace too.

      // Pass the original error to the next error handler.
      return next(error);
    }
  });

  return app;
}

export async function runServer({
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

  const i18nextInstance = await initI18next(
    {
      preload: ['en_US', 'de'],
      resources: {
        'en_US': {
          amo: {
            translation: 'This is a server side translation',
          },
        },
        'de': {
          amo: {
            translation: 'Dies ist eine serverseitige Übersetzung',
          },
        },
      },
    },
    [i18nextMiddleware.LanguageDetector],
  );

  const app = new Express();

  app.use(
    i18nextMiddleware.handle(i18nextInstance, {
      ignoreRoutes: [],
      removeLngFromUrl: false,
    }),
  );

  return isoMorphicServer
    .server(config.get('basePath'))
    .then(() => {
      global.webpackIsomorphicTools = isoMorphicServer;
      // Webpack Isomorphic tools is ready
      // now fire up the actual server.
      return new Promise((resolve, reject) => {
        /* eslint-disable global-require, import/no-dynamic-require */
        const App = require('amo/components/App').default;
        const createStore = require('amo/store').default;
        /* eslint-enable global-require, import/no-dynamic-require */
        let server = baseServer(app, App, createStore);
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
      log.error(`${err}`);

      if (exitProcess) {
        process.exit(1);
      } else {
        throw err;
      }
    });
}
export default baseServer;
