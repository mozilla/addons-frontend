import { stripIndent } from 'common-tags';
import Express from 'express';
import helmet from 'helmet';
import path from 'path';
import React from 'react';
import cookie from 'react-cookie';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { match } from 'react-router';
import { ReduxAsyncConnect, loadOnServer } from 'redux-async-connect';
import serialize from 'serialize-javascript';
import WebpackIsomorphicTools from 'webpack-isomorphic-tools';
import WebpackIsomorphicToolsConfig from 'config/webpack-isomorphic-tools';

import config from 'config';


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

  // Return 204 for csp reports.
  app.post('/__cspreport__', (req, res) => res.status(200).end('ok'));

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

      store.dispatch({type: 'SET_JWT', payload: {token: cookie.load('jwt_api_auth_token')}});

      return loadOnServer({...renderProps, store}).then(() => {
        const InitialComponent = (
          <Provider store={store} key="provider">
            <ReduxAsyncConnect {...renderProps} />
          </Provider>
        );

        const componentHTML = renderToString(InitialComponent);
        const assets = webpackIsomorphicTools.assets();
        const styles = Object.keys(assets.styles).map((style) =>
        `<link href=${assets.styles[style]} rel="stylesheet" type="text/css" />`
        ).join('\n');

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
            <script src="${assets.javascript.main}"></script>
          </body>
        </html>`;

        res.header('Content-Type', 'text/html');
        return res.end(HTML);
      });
    });
  });

  return app;
}

export function runServer({listen = true, appName} = {}) {
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
        const server = require(`${appName || APP_NAME}/server`).default;
        if (listen === true) {
          server.listen(port, host, (err) => {
            if (err) {
              reject(err);
            }
            // eslint-disable-next-line no-console
            console.log(`🔥  Addons-frontend server is running [ENV:${ENV}]`);
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
