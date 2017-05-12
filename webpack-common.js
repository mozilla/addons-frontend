/* eslint-disable import/no-extraneous-dependencies */
import config from 'config';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import webpack from 'webpack';

import { getClientConfig } from 'core/utils';

export function getRules({ babelQuery, bundleStylesWithJs = false } = {}) {
  let styleRules;

  if (bundleStylesWithJs) {
    // In development, we bundle styles with the JS.
    styleRules = [
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader', options: { importLoaders: 2 } },
          { loader: 'postcss-loader', options: { outputStyle: 'expanded' } },
        ],
      }, {
        test: /\.scss$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader', options: { importLoaders: 2 } },
          { loader: 'postcss-loader' },
          { loader: 'sass-loader', options: { outputStyle: 'expanded' } },
        ],
      },
    ];
  } else {
    // In production, we create a separate CSS bundle rather than
    // include styles with the JS bundle. This lets the style bundle
    // load in parallel.
    styleRules = [
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: { importLoaders: 2, sourceMap: true },
            },
            {
              loader: 'postcss-loader',
              options: {
                outputStyle: 'expanded',
                sourceMap: true,
                sourceMapContents: true,
              },
            },
          ],
        }),
      }, {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: { importLoaders: 2, sourceMap: true },
            },
            { loader: 'postcss-loader' },
            {
              loader: 'sass-loader',
              options: {
                outputStyle: 'expanded',
                sourceMap: true,
                sourceMapContents: true,
              },
            },
          ],
        }),
      },
    ];
  }

  return [
    {
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
      query: babelQuery,
    },
    ...styleRules,
    {
      test: /\.svg$/,
      use: [{ loader: 'svg-url-loader', options: { limit: 10000 } }],
    }, {
      test: /\.jpg$/,
      use: [{
        loader: 'url-loader',
        options: { limit: 10000, mimetype: 'image/jpeg' },
      }],
    }, {
      test: /\.png$/,
      use: [{
        loader: 'url-loader',
        options: { limit: 10000, mimetype: 'image/png' },
      }],
    }, {
      test: /\.gif/,
      use: [{
        loader: 'url-loader',
        options: { limit: 10000, mimetype: 'image/gif' },
      }],
    }, {
      test: /\.webm$/,
      use: [{
        loader: 'url-loader',
        options: { limit: 10000, mimetype: 'video/webm' },
      }],
    }, {
      test: /\.mp4$/,
      use: [{
        loader: 'url-loader',
        options: { limit: 10000, mimetype: 'video/mp4' },
      }],
    }, {
      test: /\.otf$/,
      use: [{
        loader: 'url-loader',
        options: { limit: 10000, mimetype: 'application/font-sfnt' },
      }],
    }, {
      test: /\.woff$/,
      use: [{
        loader: 'url-loader',
        options: { limit: 10000, mimetype: 'application/font-woff' },
      }],
    }, {
      test: /\.woff2$/,
      use: [{
        loader: 'url-loader',
        options: { limit: 10000, mimetype: 'application/font-woff2' },
      }],
    },
  ];
}

export function getPlugins({ excludeOtherAppLocales = true } = {}) {
  const appName = config.get('appName');
  const clientConfig = getClientConfig(config);

  const plugins = [
    new webpack.DefinePlugin({
      CLIENT_CONFIG: JSON.stringify(clientConfig),
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    // Replaces server config module with the subset clientConfig object.
    new webpack.NormalModuleReplacementPlugin(
      /config$/, 'core/client/config.js'),
    // Substitutes client only config.
    new webpack.NormalModuleReplacementPlugin(
      /core\/logger$/, 'core/client/logger.js'),
    // Use the browser's window for window.
    new webpack.NormalModuleReplacementPlugin(
      /core\/window/, 'core/browserWindow.js'),
  ];

  if (excludeOtherAppLocales) {
    plugins.push(
      // This allow us to exclude locales for other apps being built.
      new webpack.ContextReplacementPlugin(
        /locale$/,
        new RegExp(`^\\.\\/.*?\\/${appName}\\.js$`)
      ),
    );
  }

  return plugins;
}
