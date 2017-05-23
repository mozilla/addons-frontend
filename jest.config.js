// eslint-disable-next-line import/no-extraneous-dependencies
require('babel-register');

const config = require('config');

function getClientConfig(_config) {
  const clientConfig = {};
  // eslint-disable-next-line no-restricted-syntax
  for (const key of _config.get('clientConfigKeys')) {
    clientConfig[key] = _config.get(key);
  }
  return clientConfig;
}

module.exports = {
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/src/core/server/webpack-isomorphic-tools-config.js',
    '<rootDir>/tests/',
    '<rootDir>/config/',
  ],
  globals: {
    CLIENT_CONFIG: getClientConfig(config),
  },
  moduleDirectories: [
    'src',
    'node_modules',
    '<rootDir>',
  ],
  moduleFileExtensions: [
    'js',
    'json',
    'jsx',
  ],
  moduleNameMapper: {
    // Prevent un-transpiled react-photoswipe code being required.
    '^photoswipe$': '<rootDir>/node_modules/photoswipe',
    // Use the client-side logger by default for tests.
    '^core/logger$': '<rootDir>/src/core/client/logger',
    '^core/window$': '<rootDir>/src/core/browserWindow',
    // Replaces the following formats with an empty module.
    '^.+\\.(scss|css|svg|woff|woff2|mp4|webm)$': '<rootDir>/tests/emptyModule',
  },
  setupTestFrameworkScriptFile: '<rootDir>/tests/setup.js',
  testPathIgnorePatterns: ['/node_modules', '<rootDir>/config'],
  testMatch: [
    '**/__tests__/**/*.js?(x)',
    '**/[Tt]est(*).js?(x)',
  ],
  transform: {
    '^.+\\.js$': 'babel-jest',
    // This transforms images to be a module that exports the filename.
    // Tests can assert on the filenname.
    '^.+\\.(jpg|jpeg|gif|png)$': '<rootDir>/tests/fileTransformer',
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/',
  ],
  verbose: true,
};
