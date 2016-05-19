/* eslint-disable max-len, no-console */

import fs from 'fs';
import path from 'path';
import webpack from 'webpack';

import { getClientConfig } from 'core/utils';
import config from 'config';

import webpackConfig from './webpack.prod.config.babel';
import WebpackIsomorphicToolsPlugin from 'webpack-isomorphic-tools/plugin';
import webpackIsomorphicToolsConfig from './webpack-isomorphic-tools-config';

const clientConfig = getClientConfig(config);
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
  plugins: localDevelopment ? babelPlugins.concat(babelDevPlugins) : babelPlugins,
});

const webpackHost = config.get('webpackServerHost');
const webpackPort = config.get('webpackServerPort');
const assetsPath = path.resolve(__dirname, 'dist');

const hmr = `webpack-hot-middleware/client?path=https://${webpackHost}:${webpackPort}/__webpack_hmr`;

const appName = config.get('appName');
const appsBuildList = appName ? [appName] : config.get('validAppNames');

const entryPoints = {};
for (const app of appsBuildList) {
  entryPoints[app] = [
    hmr,
    `src/${app}/client`,
  ];
}


export default Object.assign({}, webpackConfig, {
  devtool: 'inline-source-map',
  context: path.resolve(__dirname),
  entry: entryPoints,
  output: Object.assign({}, webpackConfig.output, {
    path: assetsPath,
    filename: '[name]-[hash].js',
    chunkFilename: '[name]-[hash].js',
    publicPath: `https://${webpackHost}:${webpackPort}/`,
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
    }, {
      test: /\.svg$/,
      loader: 'url?limit=10000&mimetype=image/svg+xml',
    }],
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
    new webpack.HotModuleReplacementPlugin(),
    new webpack.IgnorePlugin(/webpack-stats\.json$/),
    webpackIsomorphicToolsPlugin.development(),
  ],
});
