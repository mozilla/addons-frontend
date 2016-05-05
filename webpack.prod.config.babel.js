/* eslint-disable max-len */

import path from 'path';

import config from 'config';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import WebpackIsomorphicToolsPlugin from 'webpack-isomorphic-tools/plugin';
import webpackIsomorphicToolsConfig from './webpack-isomorphic-tools-config';
import webpack from 'webpack';

import SriStatsPlugin from 'sri-stats-webpack-plugin';

import { getClientConfig } from 'core/utils';

const clientConfig = getClientConfig(config);

const appName = config.get('appName');
const appsBuildList = appName ? [appName] : config.get('validAppNames');

const entryPoints = {};
for (const app of appsBuildList) {
  entryPoints[app] = `src/${app}/client`;
}


export default {
  devtool: 'source-map',
  context: path.resolve(__dirname),
  progress: true,
  entry: entryPoints,
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name]-[chunkhash].js',
    chunkFilename: '[name]-[chunkhash].js',
    publicPath: '/',
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loaders: ['babel'],
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract('style', 'css?importLoaders=2&sourceMap!autoprefixer?browsers=last 2 version!sass?outputStyle=expanded&sourceMap=true&sourceMapContents=true'),
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      DEVELOPMENT: false,
      CLIENT: true,
      SERVER: false,
      CLIENT_CONFIG: JSON.stringify(clientConfig),
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    // Replaces server config module with the subset clientConfig object.
    new webpack.NormalModuleReplacementPlugin(/config$/, 'client-config.js'),
    new ExtractTextPlugin('[name]-[chunkhash].css', {allChunks: true}),
    new SriStatsPlugin({
      algorithm: 'sha512',
      write: true,
      saveAs: path.join(__dirname, 'dist/sri.json'),
    }),
    // ignore dev config
    new webpack.IgnorePlugin(/\.\/webpack\.dev/, /\/babel$/),
    // optimizations
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
    }),
    new WebpackIsomorphicToolsPlugin(webpackIsomorphicToolsConfig),
  ],
  resolve: {
    alias: {
      'normalize.css': 'normalize.css/normalize.css',
    },
    root: [
      path.resolve(__dirname),
    ],
    modulesDirectories: ['node_modules', 'src'],
    extensions: ['', '.js', '.jsx'],
  },
};
