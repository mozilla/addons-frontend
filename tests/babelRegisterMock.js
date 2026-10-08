// babel-jest already transpiles the code under test in the Jest environment, so
// `@babel/register` is not needed. It is also native ESM, which Jest's CommonJS
// module runtime cannot `require()`, so we stub it out here. See the
// `moduleNameMapper` entry in jest.config.js.
const noop = () => {};
noop.default = noop;
noop.revert = noop;

module.exports = noop;
