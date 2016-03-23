/* eslint-disable max-len, no-console */

import fs from 'fs';
import path from 'path';
import webpack from 'webpack';

import webpackConfig from './webpack.prod.config.babel';
import config from './index';

import WebpackIsomorphicToolsPlugin from 'webpack-isomorphic-tools/plugin';
import webpackIsomorphicToolsConfig from './webpack-isomorphic-tools';

const webpackIsomorphicToolsPlugin =
  new WebpackIsomorphicToolsPlugin(webpackIsomorphicToolsConfig);
const APP_NAME = config.get('currentApp');

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
  plugins: babelPlugins.concat(babelDevPlugins),
});

const webpackHost = config.get('webpackServerHost');
const webpackPort = config.get('webpackServerPort');
const assetsPath = path.resolve(__dirname, '../../dist');

export default Object.assign({}, webpackConfig, {
  devtool: 'inline-source-map',
  context: path.resolve(__dirname, '..'),
  entry: {
    main: [
      `webpack-hot-middleware/client?path=http://${webpackHost}:${webpackPort}/__webpack_hmr`,
      `${APP_NAME}/client`,
    ],
  },
  output: Object.assign({}, webpackConfig.output, {
    path: assetsPath,
    filename: '[name]-[hash].js',
    chunkFilename: '[name]-[chunkhash].js',
    publicPath: `http://${webpackHost}:${webpackPort}/`,
  }),
  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loader: 'babel',
      query: BABEL_QUERY,
    }, {
      test: /\.scss$/,
      loader: 'style!css?importLoaders=2!autoprefixer?browsers=last 2 version!sass?outputStyle=expanded',
    }],
  },
  plugins: [
    new webpack.DefinePlugin({
      DEVELOPMENT: true,
      CLIENT: true,
      SERVER: false,
    }),
    new webpack.EnvironmentPlugin([
      'NODE_ENV',
      'API_HOST',
    ]),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.IgnorePlugin(/webpack-stats\.json$/),
    webpackIsomorphicToolsPlugin.development(),
  ],
});
