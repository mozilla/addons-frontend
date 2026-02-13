module.exports = {
  collectCoverageFrom: ['src/**/*.{js,jsx}'],
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/src/amo/server/webpack-isomorphic-tools-config.js',
    '<rootDir>/src/locale/',
  ],
  moduleDirectories: ['src', 'node_modules'],
  moduleFileExtensions: ['js', 'json', 'jsx'],
  moduleNameMapper: {
    // Alias tests for tests to be able to import helpers.
    '^tests/(.*)$': '<rootDir>/tests/$1',
    // Alias config for tests to be able to import config files.
    '^config/(default|test)$': '<rootDir>/config/$1',
    // Replaces the following formats with an empty module.
    '^.+\\.(scss|css|woff|woff2|mp4|webm)$': '<rootDir>/tests/emptyModule',
    // Alias bin for bin scripts.
    '^bin/(.*)$': '<rootDir>/bin/$1',
  },
  reporters: [
    '<rootDir>/tests/jest-reporters/fingers-crossed.js',
    '<rootDir>/tests/jest-reporters/summary.js',
    '<rootDir>/tests/jest-reporters/flow-check.js',
    '<rootDir>/tests/jest-reporters/eslint-check.js',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/(assets|bin|config|coverage|dist|docs|flow|locale|src)/',
  ],
  testMatch: ['**/[Tt]est(*).js?(x)', '**/__tests__/**/*.js?(x)'],
  // This will initialize the jsdom document with a URL which is necessary
  // for History push state to work.
  // See https://github.com/ReactTraining/react-router/issues/5030
  testEnvironmentOptions: { url: 'http://localhost/' },
  transform: {
    '^.+\\.js$': 'babel-jest',
    // This transforms images to be a module that exports the filename.
    // Tests can assert on the filename.
    '^.+\\.(jpg|jpeg|gif|png|svg)$': '<rootDir>/tests/fileTransformer',
  },
  transformIgnorePatterns: [
    // ESM modules should be transformed.
    '<rootDir>/node_modules/(?!(cheerio|react-photoswipe-gallery|photoswipe|sinon)/)',
  ],
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
