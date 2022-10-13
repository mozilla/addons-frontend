// This transformer is used by jest so that require('blah/baz/foo.jpeg') returns 'foo.jpeg'.
// See jest.config.js for the list of file extensions that  use this transform.
const path = require('path');

module.exports = {
  process(src, filename) {
    return {
      code: `module.exports = ${JSON.stringify(path.basename(filename))};`,
    };
  },

};