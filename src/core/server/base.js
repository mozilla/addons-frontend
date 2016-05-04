import fs from 'fs';
import Express from 'express';
import helmet from 'helmet';
import path from 'path';
import cookie from 'react-cookie';
import React from 'react';
import ReactDOM from 'react-dom/server';
import ReactHelmet from 'react-helmet';

import { Provider } from 'react-redux';
import { match } from 'react-router';
import { ReduxAsyncConnect, loadOnServer } from 'redux-async-connect';

import WebpackIsomorphicTools from 'webpack-isomorphic-tools';
import WebpackIsomorphicToolsConfig from 'webpack-isomorphic-tools-config';
import ServerHtml from 'core/containers/ServerHtml';

import config from 'config';
import { setJWT } from 'core/actions';

const env = config.util.getEnv('NODE_ENV');
const isDeployed = ['stage', 'dev', 'production'].indexOf(env) > -1;

const errorString = 'Internal Server Error';
const appName = config.get('appName');

// Globals (these are set by definePlugin for client-side builds).
global.CLIENT = false;
global.SERVER = true;
global.DEVELOPMENT = env === 'development';

function baseServer(routes, createStore, { appInstanceName = appName } = {}) {
  const app = new Express();
  app.disable('x-powered-by');

  // Sets X-Frame-Options
  app.use(helmet.frameguard('deny'));

  // Sets x-content-type-options:"nosniff"
  app.use(helmet.noSniff());

  // Sets x-xss-protection:"1; mode=block"
  app.use(helmet.xssFilter());

  // CSP configuration.
  app.use(helmet.contentSecurityPolicy(config.get('CSP')));

  if (env === 'development') {
    console.log('Running in Development Mode'); // eslint-disable-line no-console

    // clear require() cache if in development mode
    webpackIsomorphicTools.refresh();
  }

  app.use(Express.static(path.join(config.get('basePath'), 'dist')));

  // Return 200 for csp reports - this will need to be overridden when deployed.
  app.post('/__cspreport__', (req, res) => res.status(200).end('ok'));

  // Redirect from / for the search app it's a 302 to prevent caching.
  if (appInstanceName === 'search') {
    app.get('/', (req, res) => res.redirect(302, '/search'));
  }

  app.use((req, res) => {
    match({ routes, location: req.url }, (err, redirectLocation, renderProps) => {
      cookie.plugToRequest(req, res);

      if (err) {
        console.error(err); // eslint-disable-line no-console
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

      return loadOnServer({...renderProps, store})
        .then(() => {
          const InitialComponent = (
            <Provider store={store} key="provider">
              <ReduxAsyncConnect {...renderProps} />
            </Provider>
          );

          // Get SRI for deployed services only.
          const sriData = (isDeployed) ? JSON.parse(
            fs.readFileSync(path.join(config.get('basePath'), 'dist/sri.json'))
          ) : {};

          const pageProps = {
            appName: appInstanceName,
            assets: webpackIsomorphicTools.assets(),
            component: InitialComponent,
            head: ReactHelmet.rewind(),
            sriData,
            includeSri: isDeployed,
            store,
          };

          const HTML = ReactDOM.renderToString(<ServerHtml {...pageProps} />);
          res.send(`<!DOCTYPE html>${HTML}`);
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error(error.stack);
          res.status(500).end(errorString);
        });
    });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    // eslint-disable-next-line no-console
    console.error(err.stack);
    res.status(500).end(errorString);
  });

  return app;
}

export function runServer({listen = true, app = appName} = {}) {
  if (!app) {
    // eslint-disable-next-line no-console
    console.log(`Please specify a valid appName from ${config.get('validAppNames')}`);
    process.exit(1);
  }

  const port = config.get('serverPort');
  const host = config.get('serverHost');

  const isoMorphicServer = new WebpackIsomorphicTools(WebpackIsomorphicToolsConfig);
  return isoMorphicServer.development(env === 'development')
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
        const server = baseServer(routes, createStore, {appInstanceName: app});
        if (listen === true) {
          server.listen(port, host, (err) => {
            if (err) {
              reject(err);
            }
            // eslint-disable-next-line no-console
            console.log(`🔥  Addons-frontend server is running [ENV:${env}] [APP:${app}]`);
            // eslint-disable-next-line no-console
            console.log(`👁  Open your browser at http://${host}:${port} to view it.`);
            resolve(server);
          });
        } else {
          resolve(server);
        }
      });
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err);
    });
}

export default baseServer;
