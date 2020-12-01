/* eslint-disable max-len, import/no-extraneous-dependencies */
import path from 'path';

import config from 'config';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import SriPlugin from 'webpack-subresource-integrity';
import WebpackIsomorphicToolsPlugin from 'webpack-isomorphic-tools/plugin';
import TerserPlugin from 'terser-webpack-plugin';
import OptimizeCssAssetsPlugin from 'optimize-css-assets-webpack-plugin';

import SriDataPlugin from './src/core/server/sriDataPlugin';
import { getPlugins, getRules } from './webpack-common';
import webpackIsomorphicToolsConfig from './src/core/server/webpack-isomorphic-tools-config';
import { APP_NAME, WEBPACK_ENTRYPOINT } from './src/core/constants';

const entryPoints = { [WEBPACK_ENTRYPOINT]: `${APP_NAME}/client` };

export default {
  bail: true,
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
  optimization: {
    minimizer: [
      // We do not use UglifyJsPlugin because it does not work as intended with
      // our config, but TerserPlugin is very similar.
      new TerserPlugin({
        // This has been enabled by default in terser-webpack-plugin 2.0.0 but
        // we were not using it before.
        extractComments: false,
        // Even though devtool is set to source-map, this must be true to
        // output source maps:
        sourceMap: true,
        // Do not change these options without busting the cache.
        // See: https://github.com/mozilla/addons-frontend/issues/5796
        terserOptions: {
          output: {
            comments: false,
          },
          compress: {
            drop_console: true,
          },
        },
      }),
      new OptimizeCssAssetsPlugin({
        cssProcessorPluginOptions: {
          preset: [
            'default',
            {
              svgo: {
                plugins: [
                  {
                    // There is a bug in this optimization.
                    // See https://github.com/mozilla/addons-frontend/issues/7191
                    convertPathData: false,
                  },
                ],
              },
            },
          ],
        },
      }),
    ],
  },
  plugins: [
    ...getPlugins(),
    new MiniCssExtractPlugin({
      filename: '[name]-[hash].css',
      chunkFilename: '[name]-[hash].css',
    }),
    new WebpackIsomorphicToolsPlugin(webpackIsomorphicToolsConfig),
    new SriPlugin({ hashFuncNames: ['sha512'] }),
    new SriDataPlugin({
      saveAs: path.join(__dirname, 'dist', 'sri.json'),
    }),
  ],
  resolve: {
    alias: {
      tests: path.resolve(__dirname, 'tests'),
    },
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    extensions: ['.js', '.jsx'],
  },
};
