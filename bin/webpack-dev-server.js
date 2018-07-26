#!/usr/bin/env node

/* eslint-disable strict, no-console */

require('babel-register');
const Express = require('express');
const config = require('config');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');

const webpackDevConfig = require('../webpack.dev.config.babel').default;

const host = config.get('webpackServerHost');
const port = config.get('webpackServerPort');

const compiler = webpack(webpackDevConfig);

const serverOptions = {
  contentBase: `http://${host}:${port}`,
  headers: { 'Access-Control-Allow-Origin': '*' },
  hot: true,
  inline: true,
  lazy: false,
  noInfo: true,
  progress: true,
  publicPath: webpackDevConfig.output.publicPath,
  quiet: true,
  stats: { colors: true },
};

const app = new Express();

app.use(webpackDevMiddleware(compiler, serverOptions));
app.use(webpackHotMiddleware(compiler));

app.listen(port, (err) => {
  if (err) {
    console.error(err);
  } else {
    console.info(`🚧  Webpack development server listening on host: ${host} port: ${port}`);
  }
});
