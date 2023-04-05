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
    'index': 'blog-utils',
  },
  output: {
    filename: `${target}.js`,
    library: {
      name: 'AddonsFrontendBlogUtils',
      type: 'umd',
    },
    globalObject: 'this',
    publicPath: '',
  },
  target,
  externals,
  module: {
    // Set a file limit to embed assets in CSS. It's needed to make this
    // library easier to use in addons-blog.
    rules: getRules({ fileLimit: 20000 }),
  },
  plugins: [
    ...getPlugins({ withBrowserWindow: target === 'web' }),
    new webpack.NormalModuleReplacementPlugin(
      /amo\/tracking/,
      'blog-utils/tracking.js',
    ),
    new MiniCssExtractPlugin({ filename: 'style.css' }),
  ],
  resolve: {
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        extractComments: false,
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

// This creates a webpack multi-config to generate two JS bundles (node and
// browser). The `target` value is used as filename.
export default [
  makeConfig({ target: 'web' }),
  makeConfig({
    target: 'node',
    externals: {
      // Those dependencies are declared in the `package.json` file of this
      // library.
      jsdom: 'jsdom',
      'node-fetch': 'commonjs2 node-fetch',
    },
  }),
];
