/* eslint-disable max-len, import/no-extraneous-dependencies */
import path from 'path';

import config from 'config';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { SubresourceIntegrityPlugin } from 'webpack-subresource-integrity';
import WebpackIsomorphicToolsPlugin from 'webpack-isomorphic-tools/plugin';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';

import SriDataPlugin from './src/amo/server/sriDataPlugin';
import { getPlugins, getRules } from './webpack-common';
import WebpackAssetsFontsPlugin from './src/amo/server/WebpackAssetsFontsPlugin';
import webpackIsomorphicToolsConfig from './src/amo/server/webpack-isomorphic-tools-config';
import { WEBPACK_ENTRYPOINT } from './src/amo/constants';

const DIST_DIR = path.join(__dirname, 'dist');
const STATIC_DIR = path.join(DIST_DIR, 'static');

export default {
  bail: true,
  mode: 'production',
  devtool: 'source-map',
  context: path.resolve(__dirname),
  entry: { [WEBPACK_ENTRYPOINT]: 'amo/client' },
  output: {
    crossOriginLoading: 'anonymous',
    // This is the path used to write the files on disk (which can be different from
    // config.get('staticPath'), which is the path part of the URL the statics are
    // served from).
    // It needs to match the directory used by src/amo/middleware/staticAssets.js
    path: STATIC_DIR,
    filename: '[name]-[contenthash].js',
    chunkFilename: '[name]-[contenthash].js',
    // This is the path used to require files in the generated bundles.
    publicPath: config.get('staticPath'),
  },
  module: {
    rules: getRules({
      babelOptions: {
        plugins: [path.resolve('./babel-plugin-count-react-elements')],
      },
    }),
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
  plugins: [
    ...getPlugins(),
    new MiniCssExtractPlugin({
      filename: '[name]-[contenthash].css',
      chunkFilename: '[name]-[contenthash].css',
    }),
    new WebpackIsomorphicToolsPlugin(webpackIsomorphicToolsConfig),
    new WebpackAssetsFontsPlugin({
      webpackAssetsFileName: 'webpack-assets.json',
    }),
    new SubresourceIntegrityPlugin({ hashFuncNames: ['sha512'] }),
    new SriDataPlugin({ saveAs: path.join(DIST_DIR, 'sri.json') }),
  ],
  resolve: {
    alias: {
      tests: path.resolve(__dirname, 'tests'),
    },
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    extensions: ['.js', '.jsx'],
  },
};
