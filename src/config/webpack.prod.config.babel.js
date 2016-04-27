/* eslint-disable max-len */

import path from 'path';

import webpack from 'webpack';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import WebpackIsomorphicToolsPlugin from 'webpack-isomorphic-tools/plugin';
import webpackIsomorphicToolsConfig from './webpack-isomorphic-tools';

import SriStatsPlugin from 'sri-stats-webpack-plugin';

import config from './index';

const appsBuildList = config.get('appsBuildList');

const entryPoints = {};
for (const app of appsBuildList) {
  entryPoints[app] = `${app}/client`;
}


export default {
  devtool: 'source-map',
  context: path.resolve(__dirname, '..'),
  progress: true,
  entry: entryPoints,
  output: {
    path: path.join(__dirname, '../../dist'),
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
    }),
    new webpack.EnvironmentPlugin([
      'NODE_ENV',
      'API_HOST',
    ]),
    new ExtractTextPlugin('[name]-[chunkhash].css', {allChunks: true}),
    new SriStatsPlugin({
      algorithm: 'sha512',
      write: true,
      saveAs: path.join(__dirname, '../sri.json'),
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
      path.resolve('../src'),
    ],
    modulesDirectories: ['node_modules', 'src'],
    extensions: ['', '.js', '.jsx'],
  },
};
