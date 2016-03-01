// Karma configuration
/* eslint-disable no-console */

import webpackConfig from './webpack.config';

var coverageReporters = [{
  type: 'text-summary',
}];

var newWebpackConfig = Object.assign({}, webpackConfig, {
  plugins: [],
  devtool: 'inline-source-map',
  module: Object.assign({}, webpackConfig.module, {
    preLoaders: [{
      test: /\.jsx?$/,
      loader: 'babel-istanbul',
      include: /src\//,
      exclude: /node_modules/,
    }],
  }),
});

var reporters = [
  'mocha',
  'coverage',
];

// Remove the bits from the shared config
// that we don't want for tests.
delete newWebpackConfig.output;
delete newWebpackConfig.entry;

if (process.env.TRAVIS) {
  console.log('On Travis sending coveralls');
  coverageReporters.push({ type: 'lcov', dir: 'coverage'});
  reporters.push('coveralls');
} else {
  console.log('Not on Travis so not sending coveralls');
  coverageReporters.push({type: 'html', dir: 'coverage', subdir: '.'});
}

export default function karmaConf(config) {
  config.set({
    coverageReporter: {
      reporters: coverageReporters,
    },
    frameworks: ['mocha', 'chai', 'sinon'],
    files: [
      'test-runner.js',
    ],
    preprocessors: {
      'test-runner.js': 'webpack',
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
}
