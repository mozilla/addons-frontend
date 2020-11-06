/* eslint-disable import/no-extraneous-dependencies */
import autoprefixer from 'autoprefixer';
import CircularDependencyPlugin from 'circular-dependency-plugin';
import config from 'config';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import webpack from 'webpack';
import LoadablePlugin from '@loadable/webpack-plugin';

import 'core/polyfill';
import { APP_NAME } from 'core/constants';
import { getClientConfig } from 'core/utils';
import { getDeploymentVersion } from 'core/utils/build';

import versionJson from './version';

export function getStyleRules({
  bundleStylesWithJs = false,
  _config = config,
} = {}) {
  let styleRules;

  const postCssPlugins = [];
  if (_config.get('enablePostCssLoader')) {
    postCssPlugins.push(
      autoprefixer({
        grid: false,
      }),
    );
  }

  if (bundleStylesWithJs) {
    // In development, we bundle styles with the JS.
    styleRules = [
      {
        test: /\.(sc|c)ss$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader', options: { importLoaders: 2 } },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: postCssPlugins,
              },
            },
          },
          {
            loader: 'sass-loader',
            options: { sassOptions: { outputStyle: 'expanded' } },
          },
        ],
      },
    ];
  } else {
    // In production, we create a separate CSS bundle rather than include
    // styles with the JS bundle. This lets the style bundle load in parallel.
    styleRules = [
      {
        test: /\.(sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2,
              sourceMap: true,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: postCssPlugins,
              },
              sourceMap: true,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              sassOptions: {
                outputStyle: 'expanded',
              },
            },
          },
        ],
      },
    ];
  }

  return styleRules;
}

export function getAssetRules() {
  // Common options for URL loaders (i.e. derivatives of file-loader).
  const urlLoaderOptions = {
    encoding: 'base64',
    // This has been added in url-loader 2.2.0 and file-loader 5.0.0. The
    // default value (`true`) is a breaking change, so we have to set it to
    // `false`.
    esModule: false,
    // If a media file is less than this size in bytes, it will be linked as a
    // data: URL. Otherwise it will be linked as a separate file URL.
    limit: 10000,
  };

  return [
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

export function getRules({ babelOptions, bundleStylesWithJs = false } = {}) {
  return [
    {
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
      options: babelOptions,
    },
    ...getStyleRules({ bundleStylesWithJs }),
    ...getAssetRules(),
  ];
}

export function getPlugins({
  excludeOtherAppLocales = true,
  includeLoadablePlugin = true,
} = {}) {
  const clientConfig = getClientConfig(config);

  const plugins = [
    new webpack.DefinePlugin({
      CLIENT_CONFIG: JSON.stringify(clientConfig),
      'process.env.NODE_ENV': JSON.stringify('production'),
      DEPLOYMENT_VERSION: JSON.stringify(getDeploymentVersion({ versionJson })),
    }),
    // Since the NodeJS code does not run from a webpack bundle, here
    // are a few replacements that affect only the client side bundle.
    //
    // This replaces the config with a new module that has sensitive,
    // server-only keys removed.
    new webpack.NormalModuleReplacementPlugin(
      /^config$/,
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

  if (includeLoadablePlugin) {
    // We need this file to be written on disk so that our server code can read
    // it. In development mode, webpack usually serves the file from memory but
    // that's not what we want for this file.
    plugins.push(new LoadablePlugin({ writeToDisk: true }));
  }

  if (excludeOtherAppLocales) {
    plugins.push(
      // This allow us to exclude locales for other apps being built.
      new webpack.ContextReplacementPlugin(
        /locale$/,
        new RegExp(`^\\.\\/.*?\\/${APP_NAME}\\.js$`),
      ),
    );
  }

  return plugins;
}
