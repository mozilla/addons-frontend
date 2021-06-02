import sinon from 'sinon';
import config from 'config';
import areIntlLocalesSupported from 'intl-locales-supported';
import values from 'object.values';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

// Side-effects from imports are quite unfortunate but this is required
// to get all of the cool jest + enzyme integration for calls like:
// `expect(shallow(<Component />)).toIncludeText('Foo');`.
// See: github.com/mozilla/addons-frontend/pull/2540#discussion_r120926107
import 'jest-enzyme';

import 'amo/polyfill';

Enzyme.configure({ adapter: new Adapter() });

if (!Object.values) {
  values.shim();
}

class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    Object.keys(this.store).forEach((key) => {
      delete this.store[key];
    });
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = value;
  }

  removeItem(key) {
    delete this.store[key];
  }

  key(index) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }

  get length() {
    return Object.keys(this.store).length;
  }
}
global.localStorage = new LocalStorageMock();

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

// web-vitals library needs window.performance with getEntriesByName()
if (global.performance) {
  global.performance.getEntriesByName = jest.fn;
}

afterEach(() => {
  global.sinon.restore();
});
