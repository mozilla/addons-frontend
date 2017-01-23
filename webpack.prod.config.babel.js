/* eslint-disable max-len, import/no-extraneous-dependencies */
import path from 'path';

import autoprefixer from 'autoprefixer';
import config from 'config';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import SriStatsPlugin from 'sri-stats-webpack-plugin';
import webpack from 'webpack';
import WebpackIsomorphicToolsPlugin from 'webpack-isomorphic-tools/plugin';

import { getClientConfig } from 'core/utils';

import webpackIsomorphicToolsConfig
  from './src/core/server/webpack-isomorphic-tools-config';

const clientConfig = getClientConfig(config);

const appName = config.get('appName');
const appsBuildList = appName ? [appName] : config.get('validAppNames');

const entryPoints = {};
// eslint-disable-next-line no-restricted-syntax
for (const app of appsBuildList) {
  entryPoints[app] = `src/${app}/client`;
}

const settings = {
  devtool: 'source-map',
  context: path.resolve(__dirname),
  progress: true,
  entry: entryPoints,
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name]-[chunkhash].js',
    chunkFilename: '[name]-[chunkhash].js',
    publicPath: config.has('staticHost') ? `${config.get('staticHost')}/` : '/',
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel',
      }, {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('style', 'css?importLoaders=2&sourceMap!postcss?outputStyle=expanded&sourceMap=true&sourceMapContents=true'),
      }, {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract('style', 'css?importLoaders=2&sourceMap!postcss!sass?outputStyle=expanded&sourceMap=true&sourceMapContents=true'),
      }, {
        test: /\.svg$/,
        loader: 'svg-url?limit=10000',
      }, {
        test: /\.jpg$/,
        loader: 'url?limit=10000&mimetype=image/jpeg',
      }, {
        test: /\.png$/,
        loader: 'url?limit=10000&mimetype=image/png',
      }, {
        test: /\.gif/,
        loader: 'url?limit=10000&mimetype=image/gif',
      }, {
        test: /\.webm$/,
        loader: 'url?limit=10000&mimetype=video/webm',
      }, {
        test: /\.mp4$/,
        loader: 'url?limit=10000&mimetype=video/mp4',
      }, {
        test: /\.otf$/,
        loader: 'url?limit=10000&mimetype=application/font-sfnt',
      }, {
        test: /\.woff$/,
        loader: 'url?limit=10000&mimetype=application/font-woff',
      }, {
        test: /\.woff2$/,
        loader: 'url?limit=10000&mimetype=application/font-woff2',
      },
    ],
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
    // Use the browser's window for window.
    new webpack.NormalModuleReplacementPlugin(/core\/window/, 'core/browserWindow.js'),
    // This allow us to exclude locales for other apps being built.
    new webpack.ContextReplacementPlugin(
      /locale$/,
      new RegExp(`^\\.\\/.*?\\/${appName}\\.js$`)
    ),
    new ExtractTextPlugin('[name]-[contenthash].css', { allChunks: true }),
    new SriStatsPlugin({
      algorithm: 'sha512',
      write: true,
      saveAs: path.join(__dirname, 'dist/sri.json'),
    }),
    // optimizations
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        drop_console: true,
      },
    }),
    new WebpackIsomorphicToolsPlugin(webpackIsomorphicToolsConfig),
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
    },
    root: [
      path.resolve(__dirname),
      path.resolve('./src'),
    ],
    modulesDirectories: ['node_modules'],
    extensions: ['', '.js', '.jsx'],
  },
};

if (config.get('enablePostCssLoader')) {
  settings.postcss = [
    autoprefixer({ browsers: ['last 2 versions'] }),
  ];
}

export default settings;
