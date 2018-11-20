/* eslint-disable max-len, import/no-extraneous-dependencies */
import path from 'path';

import config from 'config';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import SriPlugin from 'webpack-subresource-integrity';
import WebpackIsomorphicToolsPlugin from 'webpack-isomorphic-tools/plugin';
import UglifyJsPlugin from 'uglifyjs-webpack-plugin';

import SriDataPlugin from './src/core/server/sriDataPlugin';
import { getPlugins, getRules } from './webpack-common';
import webpackIsomorphicToolsConfig from './src/core/server/webpack-isomorphic-tools-config';

const appName = config.get('appName');
const appsBuildList = appName ? [appName] : config.get('validAppNames');

const entryPoints = {};
for (const app of appsBuildList) {
  entryPoints[app] = `${app}/client`;
}

export default {
  mode: 'production',
  devtool: 'source-map',
  context: path.resolve(__dirname),
  entry: entryPoints,
  output: {
    crossOriginLoading: 'anonymous',
    path: path.join(__dirname, 'dist'),
    filename: '[name]-[chunkhash].js',
    chunkFilename: '[name]-[chunkhash].js',
    publicPath: config.has('staticHost') ? `${config.get('staticHost')}/` : '/',
  },
  module: {
    rules: getRules(),
  },
  node: {
    // This allows us to use `__filename` in our code base, for instance to
    // have unique names in the error handlers.
    __filename: true,
  },
  plugins: [
    ...getPlugins(),
    new ExtractTextPlugin({
      filename: '[name]-[hash].css',
      allChunks: true,
    }),
    new WebpackIsomorphicToolsPlugin(webpackIsomorphicToolsConfig),
    new SriPlugin({ hashFuncNames: ['sha512'] }),
    new SriDataPlugin({
      saveAs: path.join(__dirname, 'dist', 'sri.json'),
    }),
  ],
  resolve: {
    alias: {
      normalize: 'normalize.css/normalize.css',
      tests: path.resolve('./tests'),
    },
    modules: [path.resolve('./src'), 'node_modules'],
    extensions: ['.js', '.jsx'],
  },
};
