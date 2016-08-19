/* eslint-disable import/no-extraneous-dependencies */
require('babel-polyfill');

require('./tests/client/init');

const testsContext = require.context('./tests/client/', true, /\.js$/);
const componentsContext = require.context(
  // This regex excludes server.js or server/*.js
  './src/', true, /^(?:(?!server|config|client).)*\.js$/);

testsContext.keys().forEach(testsContext);
componentsContext.keys().forEach(componentsContext);
