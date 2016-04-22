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
import WebpackIsomorphicToolsConfig from 'config/webpack-isomorphic-tools';

import config from 'config';
import { setJWT } from 'core/actions';


const ENV = config.get('env');
const APP_NAME = config.get('currentApp');

// Globals (these are set by definePlugin for client-side builds).
global.CLIENT = false;
global.SERVER = true;
global.DEVELOPMENT = ENV !== 'production';

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

  if (ENV === 'development') {
    console.log('Running in Development Mode'); // eslint-disable-line no-console

    // clear require() cache if in development mode
    webpackIsomorphicTools.refresh();
  }

  app.use(Express.static(path.join(__dirname, '../../../dist')));

  // Return 200 for csp reports - this will need to be overridden in production.
  app.post('/__cspreport__', (req, res) => res.status(200).end('ok'));

  // Redirect from / for the search app it's a 302 to prevent caching.
  if (APP_NAME === 'search') {
    app.get('/', (req, res) => res.redirect(302, '/search'));
  }

  app.use((req, res) => {
    match({ routes, location: req.url }, (err, redirectLocation, renderProps) => {
      cookie.plugToRequest(req, res);

      if (err) {
        console.error(err); // eslint-disable-line no-console
        return res.status(500).end('Internal server error');
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

        // Get SRI for production only.
        const sri = (ENV === 'production') ? JSON.parse(
          fs.readFileSync(path.join(config.get('basePath'), 'sri.json'))
        ) : {};

        const styles = Object.keys(assets.styles).map((style) => {
          const cssHash = sri[path.basename(assets.styles[style])];
          if (ENV === 'production' && !cssHash) {
            throw new Error('Missing SRI Data');
          }
          const cssSRI = sri && cssHash ? ` integrity="${cssHash}" crossorigin="anonymous"` : '';
          return `<link href="${assets.styles[style]}"${cssSRI}
                        rel="stylesheet" type="text/css" />`;
        }).join('\n');

        const script = Object.keys(assets.javascript).map((js) => {
          const jsHash = sri[path.basename(assets.javascript[js])];
          if (ENV === 'production' && !jsHash) {
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
      });
    });
  });

  return app;
}

export function runServer({listen = true, appName = APP_NAME} = {}) {
  if (!appName) {
    // eslint-disable-next-line no-console
    console.log(`Please specify a valid appName from ${config.get('validAppNames')}`);
    process.exit(1);
  }

  const port = ENV === 'production' ?
    config.get('serverPort') : config.get('devServerPort');
  const host = ENV === 'production' ?
    config.get('serverHost') : config.get('devServerHost');

  const isoMorphicServer = new WebpackIsomorphicTools(WebpackIsomorphicToolsConfig);
  return isoMorphicServer.development(ENV === 'development')
    .server(config.get('basePath'))
    .then(() => {
      global.webpackIsomorphicTools = isoMorphicServer;
      // Webpack Isomorphic tools is ready
      // now fire up the actual server.
      return new Promise((resolve, reject) => {
        const server = require(`${appName}/server`).default;
        if (listen === true) {
          server.listen(port, host, (err) => {
            if (err) {
              reject(err);
            }
            // eslint-disable-next-line no-console
            console.log(`🔥  Addons-frontend server is running [ENV:${ENV}] [APP:${appName}]`);
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
