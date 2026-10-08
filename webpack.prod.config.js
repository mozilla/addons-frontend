/* eslint-disable import/no-extraneous-dependencies */
// CommonJS entry point that lets `webpack-cli` load the ESM production config.
//
// `webpack-cli` cannot transpile a `*.babel.js` config with the installed
// `@babel/register`, so we register Babel ourselves here (requiring it installs
// the require hook) and hand webpack-cli the plain config object.
require('@babel/register');

module.exports = require('./webpack.prod.config.babel').default;
