module.exports = {
  collectCoverageFrom: ['src/**/*.{js,jsx}'],
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/src/core/server/webpack-isomorphic-tools-config.js',
    '<rootDir>/src/locale/',
  ],
  moduleDirectories: ['src', 'node_modules'],
  moduleFileExtensions: ['js', 'json', 'jsx'],
  moduleNameMapper: {
    // Prevent un-transpiled react-photoswipe code being required.
    '^photoswipe$': '<rootDir>/node_modules/photoswipe',
    // Alias tests for tests to be able to import helpers.
    '^tests/(.*)$': '<rootDir>/tests/$1',
    // Replaces the following formats with an empty module.
    '^.+\\.(scss|css|svg|woff|woff2|mp4|webm)$': '<rootDir>/tests/emptyModule',
  },
  setupTestFrameworkScriptFile: '<rootDir>/tests/setup.js',
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/(assets|bin|config|coverage|dist|docs|flow|locale|src)/',
  ],
  testMatch: ['**/[Tt]est(*).js?(x)', '**/__tests__/**/*.js?(x)'],
  // This will initialize the jsdom document with a URL which is necessary
  // for History push state to work.
  // See https://github.com/ReactTraining/react-router/issues/5030
  testURL: 'http://localhost/',
  transform: {
    '^.+\\.js$': 'babel-jest',
    // This transforms images to be a module that exports the filename.
    // Tests can assert on the filenname.
    '^.+\\.(jpg|jpeg|gif|png)$': '<rootDir>/tests/fileTransformer',
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  watchPathIgnorePatterns: [
    '<rootDir>/bin/server.js',
    '<rootDir>/webpack-assets.json',
  ],
  verbose: false,
};
