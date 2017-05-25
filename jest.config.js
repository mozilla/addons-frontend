module.exports = {
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/src/core/server/webpack-isomorphic-tools-config.js',
    '<rootDir>/tests/',
    '<rootDir>/config/',
  ],
  moduleDirectories: [
    'src',
    'node_modules',
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
    // Alias tests for tests to be able to import helpers.
    '^tests/(.*)$': '<rootDir>/tests/$1',
    // Alias package.json so it can be imported.
    '^package$': '<rootDir>/package.json',
    // Replaces the following formats with an empty module.
    '^.+\\.(scss|css|svg|woff|woff2|mp4|webm)$': '<rootDir>/tests/emptyModule',
  },
  setupTestFrameworkScriptFile: '<rootDir>/tests/setup.js',
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/(assets|bin|config|coverage|dist|docs|flow|locale|src)/',
  ],
  testMatch: [
    '**/[Tt]est(*).js?(x)',
    '**/__tests__/**/*.js?(x)',
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
  verbose: false,
};
