/* eslint-disable max-len */

import autoprefixer from 'autoprefixer';
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

const settings = {
  devtool: 'source-map',
  context: path.resolve(__dirname),
  progress: true,
  entry: entryPoints,
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name]-[chunkhash].js',
    chunkFilename: '[name]-[chunkhash].js',
    publicPath: config.has('staticHost') ? `${config.get('staticHost')}/` : '/',
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel',
      }, {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract('style', 'css?importLoaders=2&sourceMap!postcss!sass?outputStyle=expanded&sourceMap=true&sourceMapContents=true'),
      }, {
        test: /\.svg$/,
        loader: 'svg-url?limit=10000',
      }, {
        test: /\.jpg$/,
        loader: 'url?limit=10000&mimetype=image/jpeg',
      }, {
        test: /\.webm$/,
        loader: 'url?limit=10000&mimetype=video/webm',
      }, {
        test: /\.mp4$/,
        loader: 'url?limit=10000&mimetype=video/mp4',
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      CLIENT_CONFIG: JSON.stringify(clientConfig),
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    // Replaces server config module with the subset clientConfig object.
    new webpack.NormalModuleReplacementPlugin(/config$/, 'core/client/config.js'),
    // Substitutes client only config.
    new webpack.NormalModuleReplacementPlugin(/core\/logger$/, 'core/client/logger.js'),
    // Use the browser's window for window.
    new webpack.NormalModuleReplacementPlugin(/core\/window/, 'core/browserWindow.js'),
    // This allow us to exclude locales for other apps being built.
    new webpack.ContextReplacementPlugin(
      /locale$/,
      new RegExp(`^\\.\\/.*?\\/${appName}\\.json$`)
    ),
    new ExtractTextPlugin('[name]-[contenthash].css', { allChunks: true }),
    new SriStatsPlugin({
      algorithm: 'sha512',
      write: true,
      saveAs: path.join(__dirname, 'dist/sri.json'),
    }),
    // optimizations
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        drop_console: true,
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

if (config.get('enablePostCssLoader')) {
  settings.postcss = [
    autoprefixer({ browsers: ['last 2 versions'] }),
  ];
}

export default settings;
