// Karma configuration
/* eslint-disable max-len, no-console, strict, import/no-extraneous-dependencies */

'use strict';

require('babel-register');

const fs = require('fs');

const webpack = require('webpack');
const config = require('config');

const getClientConfig = require('./src/core/utils').getClientConfig;
const webpackConfigProd = require('./webpack.prod.config.babel').default;

const clientConfig = getClientConfig(config);
const babelrc = fs.readFileSync('./.babelrc');
const babelQuery = JSON.parse(babelrc);

const coverageReporters = [{
  type: 'text-summary',
}];

babelQuery.plugins.push(['istanbul', { include: 'src/**' }]);

const newWebpackConfig = Object.assign({}, webpackConfigProd, {
  plugins: [
    new webpack.DefinePlugin({
      CLIENT_CONFIG: JSON.stringify(clientConfig),
    }),
    // Replaces server config module with the subset clientConfig object.
    new webpack.NormalModuleReplacementPlugin(/config$/, 'core/client/config.js'),
    // Substitutes client only config.
    new webpack.NormalModuleReplacementPlugin(/core\/logger$/, 'core/client/logger.js'),
    // Use the browser's window for window.
    new webpack.NormalModuleReplacementPlugin(/core\/window/, 'core/browserWindow.js'),
    // Plugin to show any webpack warnings and prevent tests from running
    // Based on: https://gist.github.com/Stuk/6b574049435df532e905
    function WebpackWarningPlugin() {
      this.plugin('done', (_stats) => {
        const stats = _stats;
        let flagException = false;

        const loggedExceptions = [
          'SyntaxError',
        ];

        function strContainsException(str) {
          return loggedExceptions.some((substring) => str.includes(substring));
        }

        ['errors', 'warnings'].forEach((key) => {
          const loggedStack = stats.compilation[key];
          if (loggedStack && loggedStack.length) {
            stats.compilation[key].forEach((item) => {
              const message = item.message || '';
              if (strContainsException(message)) {
                console.log(message);
                flagException = true;
              }
            });
          }
        });

        // Bail if syntax errors were encountered and we're not watching.
        if (flagException && process.argv.indexOf('--watch') === -1) {
          throw new Error('Error encountered, bailing');
        }
      });
    },
  ],
  devtool: 'inline-source-map',
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: babelQuery,
      }, {
        test: /\.css$/,
        loader: 'style!css?importLoaders=2!postcss?outputStyle=expanded',
      }, {
        test: /\.scss$/,
        loader: 'style!css?importLoaders=2!postcss!sass?outputStyle=expanded',
      }, {
        test: /\.svg$/,
        loader: 'url?limit=10000&mimetype=image/svg+xml',
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
  output: undefined,
  entry: undefined,
});

const reporters = [
  'mocha',
  'coverage',
];

if (process.env.TRAVIS) {
  console.log('On Travis sending coveralls');
  coverageReporters.push({ type: 'lcov', dir: 'coverage' });
  reporters.push('coveralls');
} else {
  console.log('Not on Travis so not sending coveralls');
  coverageReporters.push({ type: 'html', dir: 'coverage', subdir: '.' });
}

module.exports = function karmaConf(conf) {
  conf.set({
    coverageReporter: {
      reporters: coverageReporters,
    },
    frameworks: ['mocha', 'chai', 'sinon'],
    files: [
      'test-runner.js',
    ],
    mochaReporter: {
      showDiff: true,
    },
    preprocessors: {
      'test-runner.js': ['webpack', 'sourcemap'],
    },
    reporters,
    colors: true,
    port: 9876,
    plugins: [
      'karma-chai',
      'karma-coverage',
      'karma-coveralls',
      'karma-firefox-launcher',
      'karma-mocha',
      'karma-mocha-reporter',
      'karma-sinon',
      'karma-sourcemap-loader',
      'karma-webpack',
    ],
    browsers: ['Firefox'],
    singleRun: false,
    concurrency: Infinity,
    webpack: newWebpackConfig,
    failOnEmptyTestSuite: true,
    webpackServer: {
      noInfo: true,
      quiet: true,
    },
  });
};
