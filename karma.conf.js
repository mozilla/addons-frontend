// This allows the karma conf to use ES6.
require('./server.babel');

module.exports = exports = require('./config/karma.config').default;
