// This transformer is used by jest so that require('blah/baz/foo.jpeg') returns 'foo.jpeg'.
const path = require('path');

module.exports = {
  process(src, filename) {
    return `module.exports = ${JSON.stringify(path.basename(filename))};`;
  },
};
