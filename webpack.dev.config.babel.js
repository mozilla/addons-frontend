/* eslint-disable max-len, no-console, import/no-extraneous-dependencies */

import fs from 'fs';
import path from 'path';

import config from 'config';
import webpack from 'webpack';
import WebpackIsomorphicToolsPlugin from 'webpack-isomorphic-tools/plugin';

import { getPlugins, getRules } from './webpack-common';
import webpackConfig from './webpack.prod.config.babel';
import webpackIsomorphicToolsConfig
  from './src/core/server/webpack-isomorphic-tools-config';

const localDevelopment = config.util.getEnv('NODE_ENV') === 'development';

const webpackIsomorphicToolsPlugin =
  new WebpackIsomorphicToolsPlugin(webpackIsomorphicToolsConfig);

const babelrc = fs.readFileSync('./.babelrc');
const babelrcObject = JSON.parse(babelrc);

const babelPlugins = babelrcObject.plugins || [];
const babelDevPlugins = [['react-transform', {
  transforms: [{
    transform: 'react-transform-hmr',
    imports: ['react'],
    locals: ['module'],
  }],
}]];

const BABEL_QUERY = Object.assign({}, babelrcObject, {
  plugins: localDevelopment ?
    babelPlugins.concat(babelDevPlugins) : babelPlugins,
});

const webpackHost = config.get('webpackServerHost');
const webpackPort = config.get('webpackServerPort');
const assetsPath = path.resolve(__dirname, 'dist');

const hmr = `webpack-hot-middleware/client?path=//${webpackHost}:${webpackPort}/__webpack_hmr`;

const appName = config.get('appName');
const appsBuildList = appName ? [appName] : config.get('validAppNames');

const entryPoints = {};
// eslint-disable-next-line no-restricted-syntax
for (const app of appsBuildList) {
  entryPoints[app] = [
    hmr,
    `${app}/client`,
  ];
}

export default Object.assign({}, webpackConfig, {
  devtool: 'inline-source-map',
  devServer: {
    progress: true,
  },
  context: path.resolve(__dirname),
  entry: entryPoints,
  output: Object.assign({}, webpackConfig.output, {
    path: assetsPath,
    filename: '[name]-[hash].js',
    chunkFilename: '[name]-[hash].js',
    publicPath: `//${webpackHost}:${webpackPort}/`,
  }),
  module: {
    rules: getRules({ babelQuery: BABEL_QUERY, bundleStylesWithJs: true }),
  },
  plugins: [
    ...getPlugins(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.IgnorePlugin(/webpack-stats\.json$/),
    webpackIsomorphicToolsPlugin.development(),
  ],
});
