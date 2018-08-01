/* eslint-disable max-len, import/no-extraneous-dependencies */
import path from 'path';

import config from 'config';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import SriPlugin from 'webpack-subresource-integrity';
import WebpackIsomorphicToolsPlugin from 'webpack-isomorphic-tools/plugin';
import UglifyJsPlugin from 'uglifyjs-webpack-plugin';

import SriDataPlugin from './src/core/server/sriDataPlugin';
import { getPlugins, getRules } from './webpack-common';
import webpackIsomorphicToolsConfig from './src/core/server/webpack-isomorphic-tools-config';

const appName = config.get('appName');
const appsBuildList = appName ? [appName] : config.get('validAppNames');

const entryPoints = {};
for (const app of appsBuildList) {
  entryPoints[app] = `${app}/client`;
}

export default {
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
  plugins: [
    ...getPlugins(),
    new ExtractTextPlugin({
      filename: '[name]-[contenthash].css',
      allChunks: true,
    }),
    // optimizations
    new UglifyJsPlugin({
      uglifyOptions: {
        output: {
          comments: false,
        },
        compress: {
          drop_console: true,
        },
      },
    }),
    new WebpackIsomorphicToolsPlugin(webpackIsomorphicToolsConfig),
    new SriPlugin({ hashFuncNames: ['sha512'] }),
    new SriDataPlugin({
      saveAs: path.join(__dirname, 'dist', 'sri.json'),
    }),
    // This function helps ensure we do bail if a compilation error
    // is encountered since --bail doesn't cause the build to fail with
    // uglify errors.
    // Remove when https://github.com/webpack/webpack/issues/2390 is fixed.
    function bailOnStatsError() {
      this.plugin('done', (stats) => {
        if (stats.compilation.errors && stats.compilation.errors.length) {
          // eslint-disable-next-line no-console
          console.log(stats.compilation.errors);
          process.exit(1);
        }
      });
    },
  ],
  resolve: {
    alias: {
      'normalize.css': 'normalize.css/normalize.css',
      tests: path.resolve('./tests'),
    },
    modules: [path.resolve('./src'), 'node_modules'],
    extensions: ['.js', '.jsx'],
  },
};
