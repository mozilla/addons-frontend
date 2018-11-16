/* eslint-disable max-len, no-console, import/no-extraneous-dependencies */
import fs from 'fs';
import path from 'path';

import config from 'config';
import webpack from 'webpack';
import WebpackIsomorphicToolsPlugin from 'webpack-isomorphic-tools/plugin';
import WriteFilePlugin from 'write-file-webpack-plugin';

import { getPlugins, getRules } from './webpack-common';
import webpackConfig from './webpack.prod.config.babel';
import webpackIsomorphicToolsConfig from './src/core/server/webpack-isomorphic-tools-config';

const localDevelopment = config.util.getEnv('NODE_ENV') === 'development';

const webpackIsomorphicToolsPlugin = new WebpackIsomorphicToolsPlugin(
  webpackIsomorphicToolsConfig,
);

const babelrc = fs.readFileSync('./.babelrc');
const babelrcObject = JSON.parse(babelrc);

const babelPlugins = babelrcObject.plugins || [];
const babelDevPlugins = ['react-hot-loader/babel'];

export const babelOptions = Object.assign({}, babelrcObject, {
  plugins: localDevelopment
    ? babelPlugins.concat(babelDevPlugins)
    : babelPlugins,
});

const webpackHost = config.get('webpackServerHost');
const webpackPort = config.get('webpackServerPort');
const assetsPath = path.resolve(__dirname, 'dist');

const hmr = `webpack-hot-middleware/client?path=//${webpackHost}:${webpackPort}/__webpack_hmr`;

const appName = config.get('appName');
const appsBuildList = appName ? [appName] : config.get('validAppNames');

const entryPoints = {};
for (const app of appsBuildList) {
  entryPoints[app] = [hmr, `${app}/client`];
}

// We do not want the production optimization settings in development.
delete webpackConfig.optimization;

export default Object.assign({}, webpackConfig, {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  context: path.resolve(__dirname),
  entry: entryPoints,
  output: Object.assign({}, webpackConfig.output, {
    path: assetsPath,
    filename: '[name]-[hash].js',
    chunkFilename: '[name]-[hash].js',
    // TODO: remove the protocol that was added because of an issue with
    // loadable-server, see:
    // https://github.com/smooth-code/loadable-components/issues/153
    // We need to remove the protocol because of `yarn amo:dev-https`.
    publicPath: `http://${webpackHost}:${webpackPort}/`,
  }),
  module: {
    rules: getRules({ babelOptions, bundleStylesWithJs: true }),
  },
  plugins: [
    ...getPlugins(),
    // We need this file to be written on disk so that our server code can read
    // it. In development mode, webpack usually serves the file from memory but
    // that's not what we want for this file.
    new WriteFilePlugin({
      test: /loadable-stats/,
    }),
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
});
