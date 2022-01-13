#!/usr/bin/env node

/* eslint-disable strict, no-console, amo/only-log-strings */

require('@babel/register');
const https = require('https');

const Express = require('express');
const config = require('config');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');

const webpackDevConfig = require('../webpack.dev.config.babel').default;

const port = config.get('webpackServerPort');

const compiler = webpack(webpackDevConfig);

const serverOptions = {
  headers: { 'Access-Control-Allow-Origin': '*' },
  publicPath: webpackDevConfig.output.publicPath,
};

const app = new Express();

app.use(webpackDevMiddleware(compiler, serverOptions));
app.use(webpackHotMiddleware(compiler));

let server;

if (process.env.USE_HTTPS_FOR_DEV) {
  // eslint-disable-next-line global-require
  const { key, cert } = require('./local-dev-server-certs');
  server = https.createServer({ key, cert }, app);
} else {
  server = app;
}

server.listen(port, (err) => {
  if (err) {
    console.error(err);
  } else {
    console.info(`🚧  Webpack development server listening on port: ${port}`);
  }
});
