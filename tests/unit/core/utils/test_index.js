import url from 'url';

import config from 'config';

import {
  ADDON_TYPE_COMPLETE_THEME,
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
  ADDON_TYPE_THEMES_FILTER,
  CATEGORY_COLORS,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  validAddonTypes,
} from 'core/constants';
import {
  addQueryParams,
  addQueryParamsToHistory,
  addonHasVersionHistory,
  apiAddonType,
  apiAddonTypeIsValid,
  convertBoolean,
  getAddonTypeFilter,
  getCategoryColor,
  getClientApp,
  getClientConfig,
  isAddonAuthor,
  isAllowedOrigin,
  isTheme,
  isValidClientApp,
  nl2br,
  normalizeFileNameId,
  removeProtocolFromURL,
  safePromise,
  sanitizeHTML,
  sanitizeUserHTML,
  decodeHtmlEntities,
  visibleAddonType,
  trimAndAddProtocolToUrl,
} from 'core/utils';
import { createInternalAddon } from 'core/reducers/addons';
import { fakeAddon } from 'tests/unit/amo/helpers';
import {
  createFakeHistory,
  createFakeLocation,
  unexpectedSuccess,
  userAgents,
} from 'tests/unit/helpers';

describe(__filename, () => {
  describe('addonHasVersionHistory', () => {
    function createAddonWithType(type) {
      return createInternalAddon({ ...fakeAddon, type });
    }

    it('requires an addon', () => {
      expect(() => {
        addonHasVersionHistory();
      }).toThrow('addon is required');
    });

    it('returns false for complete (legacy/XUL) theme', () => {
      const addon = createAddonWithType(ADDON_TYPE_COMPLETE_THEME);

      expect(addonHasVersionHistory(addon)).toEqual(false);
    });

    it('returns true for dictionary', () => {
      const addon = createAddonWithType(ADDON_TYPE_DICT);

      expect(addonHasVersionHistory(addon)).toEqual(true);
    });

    it('returns true for extension', () => {
      const addon = createAddonWithType(ADDON_TYPE_EXTENSION);

      expect(addonHasVersionHistory(addon)).toEqual(true);
    });

    it('returns true for language pack', () => {
      const addon = createAddonWithType(ADDON_TYPE_LANG);

      expect(addonHasVersionHistory(addon)).toEqual(true);
    });

    it('returns false for search tool', () => {
      // Search plugins only have one listed version so showing their
      // version history is useless. It's best to just say they don't
      // have a history.
      const addon = createAddonWithType(ADDON_TYPE_OPENSEARCH);

      expect(addonHasVersionHistory(addon)).toEqual(false);
    });

    it('returns false for lightweight theme', () => {
      const addon = createAddonWithType(ADDON_TYPE_THEME);

      expect(addonHasVersionHistory(addon)).toEqual(false);
    });

    it('returns true for static theme', () => {
      const addon = createAddonWithType(ADDON_TYPE_STATIC_THEME);

      expect(addonHasVersionHistory(addon)).toEqual(true);
    });
  });

  describe('apiAddonType', () => {
    it('maps plural/visible addonTypes to internal types', () => {
      expect(apiAddonType('extensions')).toEqual('extension');
      expect(apiAddonType('themes')).toEqual('persona');
    });

    it('fails on unrecognised plural/visible addonType', () => {
      expect(() => {
        // "theme" is not a valid pluralAddonType mapping; it should
        // be "themes".
        apiAddonType('theme');
      }).toThrowError('"theme" not found in API_ADDON_TYPES_MAPPING');
    });

    // See:
    // https://github.com/mozilla/addons-frontend/pull/1541#discussion_r95861202
    it('does not return a false positive on a method', () => {
      expect(() => {
        apiAddonType('hasOwnProperty');
      }).toThrowError('"hasOwnProperty" not found in API_ADDON_TYPES_MAPPING');
    });
  });

  describe('addonTypeIsValid', () => {
    it('returns true for a valid addonType', () => {
      expect(apiAddonTypeIsValid('extensions')).toEqual(true);
    });

    it('returns false for an invalid addonType', () => {
      expect(apiAddonTypeIsValid('xul')).toEqual(false);
    });
  });

  describe('getClientConfig', () => {
    const fakeConfig = new Map();
    fakeConfig.set('hai', 'there');
    fakeConfig.set('what', 'evar');
    fakeConfig.set('secret', 'sauce');
    fakeConfig.set('clientConfigKeys', ['hai', 'what']);

    it('should add config data to object', () => {
      const clientConfig = getClientConfig(fakeConfig);
      expect(clientConfig.hai).toEqual('there');
      expect(clientConfig.what).toEqual('evar');
      expect(clientConfig.secret).toEqual(undefined);
    });
  });

  describe('convertBoolean', () => {
    it('should see "false" as false', () => {
      expect(convertBoolean('false')).toEqual(false);
    });

    it('should see "0" as false', () => {
      expect(convertBoolean('0')).toEqual(false);
    });

    it('should see 0 as false', () => {
      expect(convertBoolean(0)).toEqual(false);
    });

    it('should get "true" as true', () => {
      expect(convertBoolean('true')).toEqual(true);
    });

    it('should get "1" as true', () => {
      expect(convertBoolean('1')).toEqual(true);
    });

    it('should get 1 as true', () => {
      expect(convertBoolean(1)).toEqual(true);
    });

    it('should return true for true value', () => {
      expect(convertBoolean(true)).toEqual(true);
    });

    it('should return false for random string value', () => {
      expect(convertBoolean('whatevs')).toEqual(false);
    });
  });

  describe('getClientApp', () => {
    it('should return firefox by default with no args', () => {
      expect(getClientApp()).toEqual(CLIENT_APP_FIREFOX);
    });

    it('should return firefox by default with bad type', () => {
      expect(getClientApp(1)).toEqual(CLIENT_APP_FIREFOX);
    });

    userAgents.androidWebkit.forEach((ua) => {
      it(`should return 'android' for a androidWebkit UA string ${ua}`, () => {
        expect(getClientApp(ua)).toEqual(CLIENT_APP_ANDROID);
      });
    });

    userAgents.chromeAndroid.forEach((ua) => {
      it(`should return 'android' for a chromeAndroid UA string ${ua}`, () => {
        expect(getClientApp(ua)).toEqual(CLIENT_APP_ANDROID);
      });
    });

    userAgents.chrome.forEach((ua) => {
      it(`should fallback to 'firefox' for a chrome UA string ${ua}`, () => {
        expect(getClientApp(ua)).toEqual(CLIENT_APP_FIREFOX);
      });
    });

    userAgents.firefox.forEach((ua) => {
      it(`should return firefox by default for a Firefox UA string ${ua}`, () => {
        expect(getClientApp(ua)).toEqual(CLIENT_APP_FIREFOX);
      });
    });

    userAgents.firefoxOS.forEach((ua) => {
      it(`should return firefox by default for a Firefox OS UA string ${ua}`, () => {
        expect(getClientApp(ua)).toEqual(CLIENT_APP_FIREFOX);
      });
    });

    userAgents.firefoxAndroid.forEach((ua) => {
      it(`should return android for a Firefox Android UA string ${ua}`, () => {
        expect(getClientApp(ua)).toEqual(CLIENT_APP_ANDROID);
      });
    });

    userAgents.firefoxIOS.forEach((ua) => {
      it(`should return 'firefox' for a Firefox iOS UA string ${ua}`, () => {
        expect(getClientApp(ua)).toEqual(CLIENT_APP_FIREFOX);
      });
    });

    it('should return "android" for lowercase UA string', () => {
      // This UA string has android, not Android.
      const ua =
        'mozilla/5.0 (android; mobile; rv:40.0) gecko/40.0 firefox/40.0';
      expect(getClientApp(ua)).toEqual(CLIENT_APP_ANDROID);
    });
  });

  describe('isAddonAuthor', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      authors: [
        {
          id: 5838591,
          name: 'tofumatt',
          picture_url: 'http://cdn.a.m.o/myphoto.jpg',
          url: 'http://a.m.o/en-GB/firefox/user/tofumatt/',
          username: 'tofumatt',
        },
      ],
    });

    it('returns true when userId is in add-on author object', () => {
      expect(isAddonAuthor({ addon, userId: 5838591 })).toEqual(true);
    });

    it('returns false when userId is not in add-on author object', () => {
      expect(isAddonAuthor({ addon, userId: 5838592 })).toEqual(false);
    });

    it('returns false when addon is false', () => {
      expect(isAddonAuthor({ addon: false, userId: 5838591 })).toEqual(false);
    });

    it('returns false when addon is null', () => {
      expect(isAddonAuthor({ addon: null, userId: 5838591 })).toEqual(false);
    });

    it('returns false when addon is not set', () => {
      expect(isAddonAuthor({ userId: 5838591 })).toEqual(false);
    });

    it('returns false when addon.authors is not set', () => {
      expect(isAddonAuthor({ addon: {}, userId: 5838591 })).toEqual(false);
    });

    it('returns false when userId is not set', () => {
      expect(isAddonAuthor({ addon, userId: null })).toEqual(false);
    });

    it('returns false if add-on has no authors', () => {
      const partialAddon = { ...addon, authors: [] };

      expect(isAddonAuthor({ addon: partialAddon, userId: null })).toEqual(
        false,
      );
    });

    it('returns false if add-on has a null value for authors', () => {
      const partialAddon = { ...addon, authors: null };

      expect(isAddonAuthor({ addon: partialAddon, userId: null })).toEqual(
        false,
      );
    });
  });

  describe('isValidClientApp', () => {
    const _config = new Map();
    _config.set('validClientApplications', [
      CLIENT_APP_FIREFOX,
      CLIENT_APP_ANDROID,
    ]);

    it('should be valid if passed "firefox"', () => {
      expect(isValidClientApp(CLIENT_APP_FIREFOX, { _config })).toEqual(true);
    });

    it('should be valid if passed "android"', () => {
      expect(isValidClientApp(CLIENT_APP_ANDROID, { _config })).toEqual(true);
    });

    it('should be invalid if passed "whatever"', () => {
      expect(isValidClientApp('whatever', { _config })).toEqual(false);
    });
  });

  describe('nl2br', () => {
    it('converts \n to <br/>', () => {
      expect(nl2br('\n')).toEqual('<br />');
    });

    it('converts \r to <br/>', () => {
      expect(nl2br('\r')).toEqual('<br />');
    });

    it('converts \r\n to <br/>', () => {
      expect(nl2br('\r\n')).toEqual('<br />');
    });

    it('converts multiple new lines to multiple breaks', () => {
      expect(nl2br('\n\n')).toEqual('<br /><br />');
    });

    it('converts multiple new lines (Windows) to multiple breaks', () => {
      expect(nl2br('\r\n\r\n')).toEqual('<br /><br />');
    });

    it('handles null text', () => {
      expect(nl2br(null)).toEqual('');
    });

    it('returns mixed content with <br/>', () => {
      expect(nl2br('foo\nbar\n\n<b>bold</b>')).toEqual(
        'foo<br />bar<br />\n<b>bold</b>',
      );
    });

    it('preserves line breaks between tags', () => {
      const htmlValue = '<ul>\n<li><strong></strong>\n</li>\n</ul>';

      expect(nl2br(htmlValue)).toEqual(
        '<ul>\n<li><strong></strong>\n</li>\n</ul>',
      );
    });

    it('converts line breaks in tag content', () => {
      const htmlValue = '<strong>foo\nbar</strong>';

      expect(nl2br(htmlValue)).toEqual('<strong>foo<br />bar</strong>');
    });

    it('returns valid HTML', () => {
      const htmlValue = 'ul\nli<strong>foo\nbar</strong>';

      expect(nl2br(htmlValue)).toEqual(
        'ul<br />li<strong>foo<br />bar</strong>',
      );
    });
  });

  describe('isAllowedOrigin', () => {
    it('disallows a random origin', () => {
      expect(isAllowedOrigin('http://whatever.com')).toEqual(false);
    });

    it('allows amoCDN by default', () => {
      expect(isAllowedOrigin(`${config.get('amoCDN')}/foo.png`)).toEqual(true);
    });

    it('returns false for a bogus url', () => {
      expect(isAllowedOrigin(1)).toEqual(false);
    });

    it('returns false for an empty string', () => {
      expect(isAllowedOrigin('')).toEqual(false);
    });

    it('accepts overriding the allowed origins', () => {
      const allowedOrigins = ['http://foo.com', 'https://foo.com'];
      expect(isAllowedOrigin('http://foo.com', { allowedOrigins })).toEqual(
        true,
      );
      expect(isAllowedOrigin('https://foo.com', { allowedOrigins })).toEqual(
        true,
      );
    });
  });

  describe('addQueryParams', () => {
    it('adds a query param to a plain url', () => {
      const output = addQueryParams('http://whatever.com/', { foo: 'bar' });
      expect(url.parse(output, true).query).toEqual({ foo: 'bar' });
    });

    it('adds more than one query param to a plain url', () => {
      const output = addQueryParams('http://whatever.com/', {
        foo: 'bar',
        test: 1,
      });
      expect(url.parse(output, true).query).toEqual({ foo: 'bar', test: '1' });
    });

    it('overrides an existing parameter', () => {
      const output = addQueryParams('http://whatever.com/?foo=1', {
        foo: 'bar',
      });
      expect(url.parse(output, true).query).toEqual({ foo: 'bar' });
    });

    it('overrides multiple existing parameters', () => {
      const output = addQueryParams('http://whatever.com/?foo=1&bar=2', {
        foo: 'bar',
        bar: 'baz',
      });
      expect(url.parse(output, true).query).toEqual({ foo: 'bar', bar: 'baz' });
    });

    it('leaves other params intact', () => {
      const output = addQueryParams('http://whatever.com/?foo=1&bar=2', {
        bar: 'updated',
      });
      expect(url.parse(output, true).query).toEqual({
        foo: '1',
        bar: 'updated',
      });
    });

    it('handles relative URLs', () => {
      const output = addQueryParams('/relative/path/?one=1', { two: '2' });
      expect(output).toMatch(/^\/relative\/path\//);
      expect(url.parse(output, true).query).toEqual({ one: '1', two: '2' });
    });
  });

  describe('visibleAddonType', () => {
    it('maps internal addonTypes to plural/visible types', () => {
      expect(visibleAddonType('extension')).toEqual('extensions');
      expect(visibleAddonType('persona')).toEqual('themes');
    });

    it('fails on unrecognised internal addonType', () => {
      expect(() => {
        // "theme" is not a valid visible addonType; it should be "themes".
        visibleAddonType('personas');
      }).toThrowError('"personas" not found in VISIBLE_ADDON_TYPES_MAPPING');
    });

    // See:
    // https://github.com/mozilla/addons-frontend/pull/1541#discussion_r95861202
    it('does not return a false positive on a method', () => {
      expect(() => {
        visibleAddonType('hasOwnProperty');
      }).toThrowError(
        '"hasOwnProperty" not found in VISIBLE_ADDON_TYPES_MAPPING',
      );
    });
  });

  describe('safePromise', () => {
    it('passes through a promised value', () => {
      const asPromised = safePromise(() => Promise.resolve('return value'));
      return asPromised().then((returnedValue) => {
        expect(returnedValue).toEqual('return value');
      });
    });

    it('passes along all arguments', () => {
      const callback = sinon.spy(() => Promise.resolve());
      const asPromised = safePromise(callback);
      return asPromised('one', 'two', 'three').then(() => {
        sinon.assert.calledWith(callback, 'one', 'two', 'three');
      });
    });

    it('catches errors and returns them as rejected promises', () => {
      const message = 'well, that was unfortunate';
      const asPromised = safePromise(() => {
        throw new Error(message);
      });
      return asPromised().then(unexpectedSuccess, (error) => {
        expect(error.message).toEqual(message);
      });
    });
  });

  describe('trimAndAddProtocolToUrl', () => {
    it('adds a protocol to a URL if missing', () => {
      expect(trimAndAddProtocolToUrl('test.com')).toEqual('http://test.com');
    });

    it('trims whitespace on a URL', () => {
      expect(trimAndAddProtocolToUrl(' test.com ')).toEqual('http://test.com');
    });

    it('works with HTTPS URLs', () => {
      expect(trimAndAddProtocolToUrl('https://test.com')).toEqual(
        'https://test.com',
      );
    });
  });

  describe('getCategoryColor', () => {
    it('throws if category is false-y', () => {
      expect(() => {
        getCategoryColor(null);
      }).toThrowError('category is required');
    });

    it('all valid addonTypes are in CATEGORY_COLORS', () => {
      expect(() => {
        validAddonTypes.forEach((addonType) => {
          const category = { id: 2, type: addonType };

          getCategoryColor(category);
        });
      }).not.toThrowError('not found in CATEGORY_COLORS');
    });

    it('throws on unrecognised addonType', () => {
      expect(() => {
        getCategoryColor({ id: 5, type: 'NOT_A_REAL_TYPE' });
      }).toThrowError(
        'addonType "NOT_A_REAL_TYPE" not found in CATEGORY_COLORS',
      );
    });

    it('deals with high category IDs', () => {
      for (let i = 750; i < 800; i++) {
        const category = { id: i, type: ADDON_TYPE_THEME };
        const categoryColor = getCategoryColor(category);

        expect(categoryColor).toBeLessThanOrEqual(
          CATEGORY_COLORS[ADDON_TYPE_THEME],
        );
        expect(categoryColor).toBeLessThanOrEqual(12);
        expect(categoryColor).toBeGreaterThanOrEqual(1);
      }
    });

    it('has a different number of colors for different addonTypes', () => {
      const category = { id: 11, type: ADDON_TYPE_EXTENSION };
      const categoryColor = getCategoryColor(category);

      expect(categoryColor).toEqual(1);
    });
  });

  describe('sanitizeUserHTML', () => {
    const sanitize = (...args) => sanitizeUserHTML(...args).__html;

    it('converts new lines to breaks', () => {
      expect(
        sanitize(`
      first
      second
    `).trim(),
      ).toEqual('<br>      first<br>      second<br>');
    });

    it('allows some tags', () => {
      const customHtml =
        '<b>check</b> <i>out</i> <a href="http://mysite">my site</a>';
      expect(sanitize(customHtml)).toEqual(customHtml);
    });

    it('does not allow certain tags', () => {
      expect(
        sanitize('<b>my add-on</b> <script>alert("does XSS")</script>'),
      ).toEqual('<b>my add-on</b> ');
    });

    it('does nothing to null values', () => {
      expect(sanitize(null)).toEqual('');
    });
  });

  describe('sanitizeHTML', () => {
    it('does not change links', () => {
      const html = '<a href="http://example.org">link</a>';
      expect(sanitizeHTML(html, ['a'])).toEqual({
        __html: html,
      });
    });

    // This is a built-in feature of dompurify.
    it('removes `target` attribute on links', () => {
      const html = '<a href="http://example.org" target="_blank">link</a>';
      expect(sanitizeHTML(html, ['a'])).toEqual({
        __html: '<a href="http://example.org">link</a>',
      });
    });
  });

  describe('decodeHtmlEntities', () => {
    it('decodes entities', () => {
      expect(decodeHtmlEntities('&lt;&gt;&quot;&amp;&copy;&reg;')).toEqual(
        '<>"&©®',
      );
    });

    it('passes through anything else', () => {
      expect(decodeHtmlEntities('just whatever')).toEqual('just whatever');
    });
  });

  describe('removeProtocolFromURL', () => {
    it('removes http:// from URL', () => {
      expect(removeProtocolFromURL('http://test.com/')).toEqual('test.com/');
    });

    it('removes https:// from URL', () => {
      expect(removeProtocolFromURL('https://test.com/')).toEqual('test.com/');
    });

    it('removes // from URL', () => {
      expect(removeProtocolFromURL('//test.com/')).toEqual('test.com/');
    });
  });

  describe('getAddonTypeFilter', () => {
    it('returns ADDON_TYPE_THEMES_FILTER when add-on type is a lightweight theme', () => {
      const addon = createInternalAddon({ type: ADDON_TYPE_THEME });
      expect(getAddonTypeFilter(addon.type)).toEqual(ADDON_TYPE_THEMES_FILTER);
    });

    it('returns ADDON_TYPE_THEMES_FILTER when add-on type is a static theme', () => {
      const addon = createInternalAddon({ type: ADDON_TYPE_STATIC_THEME });
      expect(getAddonTypeFilter(addon.type)).toEqual(ADDON_TYPE_THEMES_FILTER);
    });

    it('returns ADDON_TYPE_EXTENSION when add-on type is an extension', () => {
      const addon = createInternalAddon({ type: ADDON_TYPE_EXTENSION });
      expect(getAddonTypeFilter(addon.type)).toEqual(ADDON_TYPE_EXTENSION);
    });
  });

  describe('normalizeFileNameId', () => {
    it('returns a path relative to the project root directory', () => {
      expect(normalizeFileNameId('/path/to/src/foo/index.js')).toEqual(
        'src/foo/index.js',
      );
    });

    it('returns the given filename if `src` is not in it', () => {
      const filename = 'tests/unit/core/utils/test_index.js';

      expect(normalizeFileNameId(filename)).toEqual(filename);
    });

    it('does not strip `src` in a given relative filename', () => {
      const filename = 'src/file.js';

      expect(normalizeFileNameId(filename)).toEqual(filename);
    });
  });

  describe('isTheme', () => {
    it('returns true if type is a lightweight theme', () => {
      expect(isTheme(ADDON_TYPE_THEME)).toEqual(true);
    });

    it('returns true if type is a static theme', () => {
      expect(isTheme(ADDON_TYPE_STATIC_THEME)).toEqual(true);
    });

    it('returns false if type is an extension', () => {
      expect(isTheme(ADDON_TYPE_EXTENSION)).toEqual(false);
    });
  });

  describe('addQueryParamsToHistory', () => {
    it('adds a query object to history.location', () => {
      const history = createFakeHistory({
        location: createFakeLocation({ query: null }),
      });

      expect(history).toHaveProperty('location.query', null);

      const historyWithQueryParams = addQueryParamsToHistory({ history });

      expect(historyWithQueryParams).toHaveProperty('location.query', {});
    });

    it('parses the query string to build the query object', () => {
      const history = createFakeHistory({
        location: createFakeLocation({ query: null, search: 'foo=123' }),
      });

      expect(history).toHaveProperty('location.query', null);

      const historyWithQueryParams = addQueryParamsToHistory({ history });

      expect(historyWithQueryParams).toHaveProperty('location.query', {
        foo: '123',
      });
    });
  });
});
