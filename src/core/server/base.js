import createLocation from 'history/lib/createLocation';
import express from 'express';
import path from 'path';
import React from 'react';

import { renderToString } from 'react-dom/server';
import { RouterContext, match } from 'react-router';

import config from 'config';
import devServer from './dev';

const ENV = config.get('env');

export default function(routes) {
  const app = express();

  if (ENV === 'development') {
    devServer(app);
  }

  app.use(express.static(path.join(__dirname, '../../../dist')));

  app.use((req, res) => {
    const location = createLocation(req.url);

    match({ routes, location }, (err, redirectLocation, renderProps) => {
      if (err) {
        console.error(err); // eslint-disable-line no-console
        return res.status(500).end('Internal server error');
      }

      if (!renderProps) return res.status(404).end('Not found.');

      const InitialComponent = (
        <RouterContext {...renderProps} />
      );

      const componentHTML = renderToString(InitialComponent);

      const HTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Isomorphic Redux Demo</title>
        </head>
        <body>
          <div id="react-view">${componentHTML}</div>
          <script type="application/javascript" src="/bundle.js"></script>
        </body>
      </html>`;

      return res.end(HTML);
    });
  });

  return app;
}
