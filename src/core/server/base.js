import { stripIndent } from 'common-tags';
import Express from 'express';
import helmet from 'helmet';
import path from 'path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { match } from 'react-router';
import { ReduxAsyncConnect, loadOnServer } from 'redux-async-connect';
import serialize from 'serialize-javascript';

import config from 'config';


const ENV = config.get('env');

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
    // webpackIsomorphicTools.refresh();
  }

  app.use(Express.static(path.join(__dirname, '../../../dist')));

  // Return 204 for csp reports.
  app.post('/__cspreport__', (req, res) => res.status(200).end('ok'));

  app.use((req, res) => {
    match({ routes, location: req.url }, (err, redirectLocation, renderProps) => {
      if (err) {
        console.error(err); // eslint-disable-line no-console
        return res.status(500).end('Internal server error');
      }

      if (!renderProps) {
        return res.status(404).end('Not found.');
      }

      const store = createStore();

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
