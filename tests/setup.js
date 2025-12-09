import { setImmediate } from 'timers';
import { TextEncoder } from 'util';

import { configure } from '@testing-library/react';
import sinon from 'sinon';
import config from 'config';
import areIntlLocalesSupported from 'intl-locales-supported';
import * as matchers from 'jest-extended';

import '@testing-library/jest-dom';

import 'amo/polyfill';

global.TextEncoder = TextEncoder;

if (process.env.TEST_DEBUG !== 'FULL') {
  configure({
    getElementError: (message) => {
      const error = new Error(message.split('\n', 5).join('\n'));
      error.name = 'TestingLibraryElementError';
      return error;
    },
  });

  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn,
    error: jest.fn(),
  };
}

// setImmediate is required by Express in server tests.
// Being a Node.js API, it is not available for `testEnvironment: 'jsdom'`.
// FIXME: Server tests should be be ran w/ `testEnvironment: 'node'`.
global.setImmediate = setImmediate;

const localesMyAppSupports = ['de', 'fr'];

if (global.Intl) {
  // Determine if the built-in `Intl` has the locale data we need.
  if (!areIntlLocalesSupported(localesMyAppSupports)) {
    // `Intl` exists, but it doesn't have the data we need, so load the
    // polyfill and patch the constructors we need with the polyfill's.
    // eslint-disable-next-line global-require
    const IntlPolyfill = require('intl');
    Intl.NumberFormat = IntlPolyfill.NumberFormat;
    Intl.DateTimeFormat = IntlPolyfill.DateTimeFormat;
  }
} else {
  // No `Intl`, so use and load the polyfill.
  // eslint-disable-next-line global-require
  global.Intl = require('intl');
}

// Patch missing console.debug in node.
// eslint-disable-next-line no-console
console.debug = console.log;

// Setup sinon global to be a sandbox which is restored after each test.
global.sinon = sinon.createSandbox();

// Stub the magic constant webpack normally supplies.
global.CLIENT_CONFIG = require('amo/utils').getClientConfig(config);

// See: https://github.com/mozilla/addons-frontend/issues/1138
global.fetch = (input) => {
  throw new Error(
    `API calls MUST be mocked. URL fetched: ${input.url || input}`,
  );
};

// See: https://github.com/jsdom/jsdom/issues/3309
if (global.window && !global.window.performance.getEntriesByType) {
  global.window.performance.getEntriesByType = jest.fn().mockReturnValue([]);
}

expect.extend(matchers);

afterEach(() => {
  global.sinon.restore();
});
