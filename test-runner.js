/* eslint-disable import/no-extraneous-dependencies */
require('babel-polyfill');

require('./tests/client/init');

const testsContext = require.context('./tests/client/', true, /\.js$/);
const componentsContext = require.context(
  // This regex excludes everything in locale/**/*.js, server.js, and
  // server/*.js
  './src/', true, /^(?:(?!locale\/[A-Za-z_]{2,5}\/|server|config|client).)*\.js$/);

testsContext.keys().forEach(testsContext);
componentsContext.keys().forEach(componentsContext);
