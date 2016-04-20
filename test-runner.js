require('babel-polyfill');

const testsContext = require.context('./tests/karma/', true, /\.js$/);
const componentsContext = require.context(
  // This regex excludes server.js or server/*.js
  './src/', true, /^(?:(?!server|config|client).)*\.js$/);

testsContext.keys().forEach(testsContext);
componentsContext.keys().forEach(componentsContext);
