/* eslint-disable import/no-extraneous-dependencies */
// CommonJS entry point that lets `webpack-cli` load the ESM blog-utils config.
// See the comment in `webpack.prod.config.js` for why this indirection exists.
require('@babel/register');

module.exports = require('./webpack.blog-utils.config.babel').default;
