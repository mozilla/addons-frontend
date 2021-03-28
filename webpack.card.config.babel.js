/* eslint-disable max-len, import/no-extraneous-dependencies */
import path from 'path';

import webpack from 'webpack';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import TerserPlugin from 'terser-webpack-plugin';

import { getPlugins, getRules } from './webpack-common';

const makeConfig = ({ target, externals = {} }) => ({
  mode: process.env.NODE_ENV,
  devtool: false,
  entry: {
    'index': 'card',
  },
  output: {
    filename: `${target}.js`,
    library: {
      name: 'AddonsFrontendCard',
      type: 'umd',
    },
    globalObject: 'this',
  },
  target,
  externals,
  module: {
    rules: getRules({ fileLimit: 20000 }),
  },
  plugins: [
    ...getPlugins({ withBrowserWindow: target === 'web' }),
    new webpack.NormalModuleReplacementPlugin(
      /amo\/tracking/,
      'card/tracking.js',
    ),
    new MiniCssExtractPlugin({ filename: 'style.css' }),
  ],
  resolve: {
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
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
        sourceMap: false,
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
      new CssMinimizerPlugin(),
    ],
  },
});

export default [
  makeConfig({
    target: 'web',
    externals: {
      'amo/window': 'window',
    },
  }),
  makeConfig({
    target: 'node',
    externals: {
      jsdom: 'jsdom',
      'node-fetch': 'commonjs2 node-fetch',
    },
  }),
];
