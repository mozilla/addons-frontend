/* eslint-disable import/no-extraneous-dependencies */
import autoprefixer from 'autoprefixer';
import CircularDependencyPlugin from 'circular-dependency-plugin';
import config from 'config';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import webpack from 'webpack';

import 'amo/polyfill';
import { getClientConfig } from 'amo/utils';

export function getStyleRules({
  bundleStylesWithJs = false,
  _config = config,
} = {}) {
  let styleRules;

  const postCssPlugins = [];
  if (_config.get('enablePostCssLoader')) {
    postCssPlugins.push(autoprefixer());
  }

  const cssLoaderOptions = {
    importLoaders: 2,
    // This is needed to be backward compatible with css-loader v2.
    esModule: false,
  };
  const postcssLoaderOptions = {
    postcssOptions: {
      plugins: postCssPlugins,
    },
  };
  const sassLoaderOptions = {
    sassOptions: {
      quietDeps: true,
      silenceDeprecations: [
        'import', // https://sass-lang.com/documentation/breaking-changes/import/
        'global-builtin', // https://sass-lang.com/documentation/breaking-changes/import/
        'color-functions', // https://sass-lang.com/documentation/breaking-changes/color-functions/
        'slash-div', // https://sass-lang.com/documentation/breaking-changes/slash-div/
      ],
    },
  };

  if (bundleStylesWithJs) {
    // In development, we bundle styles with the JS.
    styleRules = [
      {
        test: /\.(sc|c)ss$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader', options: cssLoaderOptions },
          { loader: 'postcss-loader', options: postcssLoaderOptions },
          { loader: 'sass-loader', options: sassLoaderOptions },
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
          { loader: 'css-loader', options: cssLoaderOptions },
          { loader: 'postcss-loader', options: postcssLoaderOptions },
          { loader: 'sass-loader', options: sassLoaderOptions },
        ],
      },
    ];
  }

  return styleRules;
}

function getAssetRules() {
  // Common options for URL loaders (i.e. derivatives of file-loader).
  const urlLoaderOptions = {
    encoding: 'base64',
    // This has been added in url-loader 2.2.0 and file-loader 5.0.0. The
    // default value (`true`) is a breaking change, so we have to set it to
    // `false`.
    esModule: false,
    // Disable inlining of assets (It does more harm than good, we don't need
    // it with HTTP/2).
    limit: false,
    // This is the default value.
    fallback: 'file-loader',
    // We want to use predictable filenames for "subset" fonts.
    name(resourcePath) {
      if (/-subset-/.test(resourcePath)) {
        return '[name].[contenthash].[ext]';
      }

      return '[contenthash].[ext]';
    },
  };

  return [
    {
      test: /\.(svg|jpg|png|gif|webm|mp4|otf|woff|woff2)$/,
      use: [{ loader: 'url-loader', options: urlLoaderOptions }],
      type: 'javascript/auto',
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

export function getPlugins({ withBrowserWindow = true } = {}) {
  const clientConfig = getClientConfig(config);

  const plugins = [
    new webpack.DefinePlugin({
      CLIENT_CONFIG: JSON.stringify(clientConfig),
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    // Since the NodeJS code does not run from a webpack bundle, here are a few
    // replacements that affect only the client side bundle.
    //
    // This replaces the config with a new module that has sensitive,
    // server-only keys removed.
    new webpack.NormalModuleReplacementPlugin(
      /^config$/,
      'amo/client/config.js',
    ),
    new CircularDependencyPlugin({
      exclude: /node_modules/,
      failOnError: true,
    }),
    // This allow us to exclude locales for other apps being built.
    new webpack.ContextReplacementPlugin(/locale$/, /^\.\/.*?\/amo\.js$/),
  ];

  if (withBrowserWindow) {
    plugins.push(
      // This swaps the server side window object with a standard browser
      // window.
      new webpack.NormalModuleReplacementPlugin(
        /amo\/window/,
        'amo/browserWindow.js',
      ),
    );
  }

  return plugins;
}
