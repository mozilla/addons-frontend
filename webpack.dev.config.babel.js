/* eslint-disable max-len, no-console, import/no-extraneous-dependencies */
import fs from 'fs';
import path from 'path';

import config from 'config';
import webpack from 'webpack';
import WebpackIsomorphicToolsPlugin from 'webpack-isomorphic-tools/plugin';

import { getPlugins, getRules } from './webpack-common';
import webpackConfig from './webpack.prod.config.babel';
import webpackIsomorphicToolsConfig from './src/core/server/webpack-isomorphic-tools-config';
import { APP_NAME } from './src/core/constants';

const localDevelopment = config.util.getEnv('NODE_ENV') === 'development';

const webpackIsomorphicToolsPlugin = new WebpackIsomorphicToolsPlugin(
  webpackIsomorphicToolsConfig,
);

const babelrc = fs.readFileSync('./.babelrc');
const babelrcObject = JSON.parse(babelrc);

const babelPlugins = babelrcObject.plugins || [];
const babelDevPlugins = ['react-hot-loader/babel'];

export const babelOptions = {
  ...babelrcObject,
  plugins: localDevelopment
    ? babelPlugins.concat(babelDevPlugins)
    : babelPlugins,
};

const webpackHost = config.get('webpackServerHost');
const webpackPort = config.get('webpackServerPort');
const assetsPath = path.resolve(__dirname, 'dist');

const hmr = `webpack-hot-middleware/client?path=//${webpackHost}:${webpackPort}/__webpack_hmr`;

const entryPoints = { [APP_NAME]: [hmr, `${APP_NAME}/client`] };

// We do not want the production optimization settings in development.
delete webpackConfig.optimization;

export default {
  ...webpackConfig,
  mode: 'development',
  devtool: 'cheap-module-source-map',
  context: path.resolve(__dirname),
  entry: entryPoints,
  output: {
    ...webpackConfig.output,
    path: assetsPath,
    filename: '[name]-[hash].js',
    chunkFilename: '[name]-[hash].js',
    // We need to remove the protocol because of `yarn amo:dev-https`.
    publicPath: `//${webpackHost}:${webpackPort}/`,
  },
  module: {
    rules: getRules({ babelOptions, bundleStylesWithJs: true }),
  },
  plugins: [
    ...getPlugins(),
    // Load unminified React and Redux in development to get better error
    // messages, because they use
    // [Invariant](https://github.com/zertosh/invariant) which hides error
    // messages in the production build.
    new webpack.NormalModuleReplacementPlugin(
      /^react$/,
      'react/umd/react.development.js',
    ),
    new webpack.NormalModuleReplacementPlugin(
      /^react-dom$/,
      'react-dom/umd/react-dom.development.js',
    ),
    new webpack.NormalModuleReplacementPlugin(/^redux$/, 'redux/dist/redux.js'),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.IgnorePlugin(/webpack-stats\.json$/),
    webpackIsomorphicToolsPlugin.development(),
  ],
};
