/* eslint-disable max-len, no-console, import/no-extraneous-dependencies */
import path from 'path';

import config from 'config';
import webpack from 'webpack';
import WebpackIsomorphicToolsPlugin from 'webpack-isomorphic-tools/plugin';

import { getPlugins, getRules } from './webpack-common';
import webpackConfig from './webpack.prod.config.babel';
import webpackIsomorphicToolsConfig from './src/amo/server/webpack-isomorphic-tools-config';
import { WEBPACK_ENTRYPOINT } from './src/amo/constants';

const webpackIsomorphicToolsPlugin = new WebpackIsomorphicToolsPlugin(
  webpackIsomorphicToolsConfig,
);

const babelConfig = require('./babel.config');

const babelPlugins = babelConfig.plugins || [];

export const babelOptions = {
  ...babelConfig,
  plugins: babelPlugins,
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
    // We need to remove the protocol because of `npm run amo:dev-https`.
    publicPath: config.get('staticPath'),
  },
  module: {
    rules: getRules({ babelOptions, bundleStylesWithJs: true }),
  },
  plugins: [
    ...getPlugins(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.IgnorePlugin({ resourceRegExp: /webpack-stats\.json$/ }),
    webpackIsomorphicToolsPlugin.development(),
  ],
};
