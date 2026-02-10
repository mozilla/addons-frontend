/* eslint-disable max-len, no-console, import/no-extraneous-dependencies */
import path from 'path';

import config from 'config';
import { Util } from 'config/lib/util';
import webpack from 'webpack';
import WebpackIsomorphicToolsPlugin from 'webpack-isomorphic-tools/plugin';

import { getPlugins, getRules } from './webpack-common';
import webpackConfig from './webpack.prod.config.babel';
import webpackIsomorphicToolsConfig from './src/amo/server/webpack-isomorphic-tools-config';
import { WEBPACK_ENTRYPOINT } from './src/amo/constants';

const localDevelopment = Util.getEnv('NODE_ENV') === 'development';

const webpackIsomorphicToolsPlugin = new WebpackIsomorphicToolsPlugin(
  webpackIsomorphicToolsConfig,
);

const babelConfig = require('./babel.config');

const babelPlugins = babelConfig.plugins || [];
const babelDevPlugins = ['react-hot-loader/babel'];

export const babelOptions = {
  ...babelConfig,
  plugins: localDevelopment
    ? babelPlugins.concat(babelDevPlugins)
    : babelPlugins,
};

const hmr = `webpack-hot-middleware/client?path=${config.get(
  'staticPath',
)}__webpack_hmr`;

const entryPoints = { [WEBPACK_ENTRYPOINT]: [hmr, 'amo/client'] };

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
    filename: '[name]-[contenthash].js',
    chunkFilename: '[name]-[contenthash].js',
    // We need to remove the protocol because of `yarn amo:dev-https`.
    publicPath: config.get('staticPath'),
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
    //
    // We can no longer load the React versions from /umd/ as it no longer
    // exists.
    // See https://github.com/mozilla/addons-frontend/issues/11737
    // new webpack.NormalModuleReplacementPlugin(
    //   /^react$/,
    //   'react/umd/react.development.js',
    // ),
    // new webpack.NormalModuleReplacementPlugin(
    //   /^react-dom$/,
    //   'react-dom/umd/react-dom.development.js',
    // ),
    new webpack.NormalModuleReplacementPlugin(/^redux$/, 'redux/dist/redux.js'),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.IgnorePlugin({ resourceRegExp: /webpack-stats\.json$/ }),
    webpackIsomorphicToolsPlugin.development(),
  ],
};
