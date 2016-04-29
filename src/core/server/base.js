import fs from 'fs';
import Express from 'express';
import helmet from 'helmet';
import path from 'path';
import serialize from 'serialize-javascript';
import cookie from 'react-cookie';
import React from 'react';

import { stripIndent } from 'common-tags';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { match } from 'react-router';
import { ReduxAsyncConnect, loadOnServer } from 'redux-async-connect';

import WebpackIsomorphicTools from 'webpack-isomorphic-tools';
import WebpackIsomorphicToolsConfig from 'webpack-isomorphic-tools-config';

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

export default function(routes, createStore) {
  const app = new Express();
  app.disable('x-powered-by');

  // Sets X-Frame-Options
  app.use(helmet.frameguard('deny'));

  // Sets x-content-type-options:"nosniff"
  app.use(helmet.noSniff());

  // Sets x-xss-protection:"1; mode=block"
  app.use(helmet.xssFilter());

  // CSP configuration.
  app.use(helmet.csp(config.get('CSP')));

  if (env === 'development') {
    console.log('Running in Development Mode'); // eslint-disable-line no-console

    // clear require() cache if in development mode
    webpackIsomorphicTools.refresh();
  }

  app.use(Express.static(path.join(config.get('basePath'), 'dist')));

  // Return 200 for csp reports - this will need to be overridden when deployed.
  app.post('/__cspreport__', (req, res) => res.status(200).end('ok'));

  // Redirect from / for the search app it's a 302 to prevent caching.
  if (appName === 'search') {
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

      return loadOnServer({...renderProps, store}).then(() => {
        const InitialComponent = (
          <Provider store={store} key="provider">
            <ReduxAsyncConnect {...renderProps} />
          </Provider>
        );

        const componentHTML = renderToString(InitialComponent);

        const assets = webpackIsomorphicTools.assets();

        // Get SRI for deployed services only.
        const sri = (isDeployed) ? JSON.parse(
          fs.readFileSync(path.join(config.get('basePath'), 'dist/sri.json'))
        ) : {};

        const styles = Object.keys(assets.styles).map((style) => {
          const cssHash = sri[path.basename(assets.styles[style])];
          if (isDeployed && !cssHash) {
            throw new Error('Missing SRI Data');
          }
          const cssSRI = sri && cssHash ? ` integrity="${cssHash}" crossorigin="anonymous"` : '';
          return `<link href="${assets.styles[style]}"${cssSRI}
                        rel="stylesheet" type="text/css" />`;
        }).join('\n');

        const script = Object.keys(assets.javascript).map((js) => {
          const jsHash = sri[path.basename(assets.javascript[js])];
          if (isDeployed && !jsHash) {
            throw new Error('Missing SRI Data');
          }
          const jsSRI = sri && jsHash ? ` integrity="${jsHash}" crossorigin="anonymous"` : '';
          return `<script src="${assets.javascript[js]}"${jsSRI}></script>`;
        }).join('\n');

        const HTML = stripIndent`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Isomorphic Redux Demo</title>
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              ${styles}
            </head>
            <body>
              <div id="react-view">${componentHTML}</div>
              <script type="application/json" id="redux-store-state">
                ${serialize(store.getState())}
              </script>
              ${script}
            </body>
          </html>`;

        res.header('Content-Type', 'text/html');
        return res.end(HTML);
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
        const server = require(`${app}/server`).default;
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
