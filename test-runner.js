require('babel-polyfill');

const testsContext = require.context('./tests', true, /\.js$/);
const componentsContext = require.context(
  './src/', true, /(actions|api|components|containers|reducers)\/.*\.js$/);

testsContext.keys().forEach(testsContext);
componentsContext.keys().forEach(componentsContext);
