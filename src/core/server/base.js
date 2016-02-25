import createLocation from 'history/lib/createLocation';
import express from 'express';
import helmet from 'helmet';
import path from 'path';
import React from 'react';

import { renderToString } from 'react-dom/server';
import { RouterContext, match } from 'react-router';

import config from 'config';
import devServer from './dev';

const ENV = config.get('env');

export default function(routes) {
  const app = express();
  app.disable('x-powered-by');

  // Sets X-Frame-Options
  app.use(helmet.frameguard('deny'));

  // Sets x-content-type-options:"nosniff"
  app.use(helmet.noSniff());

  // Sets x-xss-protection:"1; mode=block"
  app.use(helmet.xssFilter());

  app.use(helmet.csp({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      reportUri: '/__cspreport__',
    },

    // Set to true if you only want browsers to report errors, not block them
    reportOnly: false,

    // Set to true if you want to blindly set all headers: Content-Security-Policy,
    // X-WebKit-CSP, and X-Content-Security-Policy.
    setAllHeaders: false,

    // Set to true if you want to disable CSP on Android where it can be buggy.
    disableAndroid: false,
  }));

  if (ENV === 'development') {
    console.log('Adding Webpack Dev Server'); // eslint-disable-line no-console
    devServer(app);
  }

  app.use(express.static(path.join(__dirname, '../../../dist')));

  // Return 204 for csp reports.
  app.post('/__cspreport__', (req, res) => res.status(204));

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
