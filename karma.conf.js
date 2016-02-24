// Karma configuration
// Generated on Thu Feb 25 2016 16:44:19 GMT-0600 (CST)

var webpackConfig = require('./webpack.config').default;
var newWebpackConfig = Object.assign({}, webpackConfig);
// Remove the bits from the shared config
// that we don't want for tests.
delete newWebpackConfig.output;
delete newWebpackConfig.entry;

newWebpackConfig.plugins = [];

// Expose the right kind of source map for test-loader.js
newWebpackConfig.devtool = 'inline-source-map';

module.exports = function karmaConf(config) {
  config.set({
    basePath: '',
    frameworks: ['mocha', 'chai', 'sinon'],
    files: [
      'tests/**/Test*.js',
    ],
    exclude: [
    ],
    preprocessors: {
      'tests/**/Test*.js': ['webpack', 'sourcemap'],
    },
    reporters: ['mocha'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
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
