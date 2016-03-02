const testsContext = require.context('./tests', true, /\.js$/);
const componentsContext = require.context('./src/', true, /components\/.*\.js$/);

testsContext.keys().forEach(testsContext);
componentsContext.keys().forEach(componentsContext);
