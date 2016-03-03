// This allows the karma conf to use ES6.
require('./server.babel');

module.exports = exports = require('./src/config/karma.config').default;
