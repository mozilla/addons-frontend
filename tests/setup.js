import { setImmediate } from 'timers';

import sinon from 'sinon';
import config from 'config';
import areIntlLocalesSupported from 'intl-locales-supported';

import '@testing-library/jest-dom/extend-expect';

import 'amo/polyfill';

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

afterEach(() => {
  global.sinon.restore();
});
