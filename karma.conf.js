// Karma configuration
/* eslint-disable max-len, no-console */
require('babel-register');

const fs = require('fs');

const babelrc = fs.readFileSync('./.babelrc');
const babelQuery = JSON.parse(babelrc);
const webpack = require('webpack');
const webpackConfigProd = require('./webpack.prod.config.babel').default;
const config = require('config');
const getClientConfig = require('src/core/utils').getClientConfig;
const clientConfig = getClientConfig(config);

const coverageReporters = [{
  type: 'text-summary',
}];


const newWebpackConfig = Object.assign({}, webpackConfigProd, {
  plugins: [
    new webpack.DefinePlugin({
      CLIENT_CONFIG: JSON.stringify(clientConfig),
    }),
    new webpack.NormalModuleReplacementPlugin(/config$/, 'client-config.js'),
  ],
  devtool: 'inline-source-map',
  module: {
    preLoaders: [{
      test: /\.jsx?$/,
      loader: 'babel-istanbul',
      include: /src\//,
      exclude: /node_modules/,
    }],
    loaders: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loader: 'babel',
      query: babelQuery,
    }, {
      test: /\.scss$/,
      loader: 'style!css?importLoaders=2!autoprefixer?browsers=last 2 version!sass?outputStyle=expanded',
    }, {
      test: /\.svg$/,
      loader: 'url?limit=10000&mimetype=image/svg+xml',
    }],
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
  coverageReporters.push({ type: 'lcov', dir: 'coverage'});
  reporters.push('coveralls');
} else {
  console.log('Not on Travis so not sending coveralls');
  coverageReporters.push({type: 'html', dir: 'coverage', subdir: '.'});
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
    autoWatch: true,
    browsers: ['Firefox'],
    singleRun: false,
    concurrency: Infinity,
    webpack: newWebpackConfig,
    webpackServer: {
      noInfo: true,
      quiet: true,
    },
  });
};
