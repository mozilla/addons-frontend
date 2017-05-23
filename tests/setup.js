import 'babel-polyfill';
import sinon from 'sinon';
import { assert } from 'chai';
import config from 'config';
import areIntlLocalesSupported from 'intl-locales-supported';

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

const localesMyAppSupports = [
  'de-DE', 'fr',
];

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


const realSinon = sinon;
global.before = beforeAll;
global.after = afterAll;
global.assert = assert;

// Patch missing console.debug in node.
// eslint-disable-next-line no-console
console.debug = console.log;

// Setup sinon global to be a sandbox which is restored
// after each test.
global.sinon = realSinon.sandbox.create();
global.sinon.createStubInstance = realSinon.createStubInstance;
global.sinon.format = realSinon.format;
global.sinon.assert = realSinon.assert;
// Stub the magic constant webpack normally supplies.
global.CLIENT_CONFIG = require('core/utils').getClientConfig(config);

afterEach(() => {
  global.sinon.restore();
});
