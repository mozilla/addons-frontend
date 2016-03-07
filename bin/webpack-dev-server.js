#!/usr/bin/env node

/* eslint-disable strict, no-console */

require('babel-register');

const Express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const webpackDevConfig = require('config/webpack.dev.config.babel').default;

const app = new Express();
const config = require('config').default;

const host = config.get('webpackServerHost');
const port = config.get('webpackServerPort');

const compiler = webpack(webpackDevConfig);

const serverOptions = {
  contentBase: `http://${host}:${port}`,
  quiet: true,
  noInfo: true,
  hot: true,
  inline: true,
  lazy: false,
  stats: {colors: true},
  publicPath: webpackDevConfig.output.publicPath,
};

app.use(webpackDevMiddleware(compiler, serverOptions));
app.use(webpackHotMiddleware(compiler));

app.listen(port, (err) => {
  if (err) {
    console.error(err);
  } else {
    console.info(`🚧  Webpack development server listening on host: ${host} port: ${port}`);
  }
});
