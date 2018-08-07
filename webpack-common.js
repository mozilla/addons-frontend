/* eslint-disable import/no-extraneous-dependencies */
import autoprefixer from 'autoprefixer';
import CircularDependencyPlugin from 'circular-dependency-plugin';
import config from 'config';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import webpack from 'webpack';

import 'core/polyfill';
import { getClientConfig } from 'core/utils';

// Common options for URL loaders (i.e. derivatives of file-loader).
const urlLoaderOptions = {
  // If a media file is less than this size in bytes, it will be linked as a data: URL.
  // Otherwise it will be linked as a separate file URL.
  limit: 10000,
};

const postCssPlugins = [];
if (config.get('enablePostCssLoader')) {
  postCssPlugins.push(
    autoprefixer({
      browsers: ['last 2 versions'],
      grid: false,
    }),
  );
}

export function getRules({ babelOptions, bundleStylesWithJs = false } = {}) {
  let styleRules;

  if (bundleStylesWithJs) {
    // In development, we bundle styles with the JS.
    styleRules = [
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader', options: { importLoaders: 2 } },
          {
            loader: 'postcss-loader',
            options: {
              outputStyle: 'expanded',
              plugins: () => postCssPlugins,
            },
          },
        ],
      },
      {
        test: /\.scss$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader', options: { importLoaders: 2 } },
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => postCssPlugins,
            },
          },
          { loader: 'sass-loader', options: { outputStyle: 'expanded' } },
        ],
      },
    ];
  } else {
    // In production, we create a separate CSS bundle rather than include
    // styles with the JS bundle. This lets the style bundle load in parallel.

    const cssLoaderOptions = {
      importLoaders: 2,
      sourceMap: true,
      minimize: true,
    };

    styleRules = [
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: cssLoaderOptions,
            },
            {
              loader: 'postcss-loader',
              options: {
                outputStyle: 'expanded',
                plugins: () => postCssPlugins,
                sourceMap: true,
                sourceMapContents: true,
              },
            },
          ],
        }),
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: cssLoaderOptions,
            },
            {
              loader: 'postcss-loader',
              options: { plugins: () => postCssPlugins },
            },
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
      options: babelOptions,
    },
    ...styleRules,
    {
      test: /\.svg$/,
      use: [{ loader: 'svg-url-loader', options: urlLoaderOptions }],
    },
    {
      test: /\.(jpg|png|gif|webm|mp4|otf|woff|woff2)$/,
      use: [{ loader: 'url-loader', options: urlLoaderOptions }],
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
    // Since the NodeJS code does not run from a webpack bundle, here
    // are a few replacements that affect only the client side bundle.
    //
    // This replaces the config with a new module that has sensitive,
    // server-only keys removed.
    new webpack.NormalModuleReplacementPlugin(
      /config$/,
      'core/client/config.js',
    ),
    // This swaps the server side window object with a standard browser window.
    new webpack.NormalModuleReplacementPlugin(
      /core\/window/,
      'core/browserWindow.js',
    ),
    new CircularDependencyPlugin({
      exclude: /node_modules/,
      failOnError: true,
    }),
  ];

  if (excludeOtherAppLocales) {
    plugins.push(
      // This allow us to exclude locales for other apps being built.
      new webpack.ContextReplacementPlugin(
        /locale$/,
        new RegExp(`^\\.\\/.*?\\/${appName}\\.js$`),
      ),
    );
  }

  return plugins;
}
