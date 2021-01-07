import config from 'config';
import UAParser from 'ua-parser-js';

import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  OS_ALL,
  OS_ANDROID,
  OS_LINUX,
  OS_MAC,
  OS_WINDOWS,
} from 'core/constants';
import {
  addQueryParamsToHistory,
  apiAddonType,
  apiAddonTypeIsValid,
  convertBoolean,
  decodeHtmlEntities,
  findFileForPlatform,
  getClientApp,
  getClientConfig,
  isAddonAuthor,
  isAllowedOrigin,
  isValidClientApp,
  nl2br,
  normalizeFileNameId,
  removeProtocolFromURL,
  safePromise,
  sanitizeHTML,
  sanitizeUserHTML,
  visibleAddonType,
} from 'core/utils';
import { createPlatformFiles } from 'core/reducers/versions';
import {
  createFakeHistory,
  createFakeLocation,
  createInternalAddonWithLang,
  fakeAddon,
  fakePlatformFile,
  fakeVersion,
  unexpectedSuccess,
  userAgents,
  userAgentsByPlatform,
} from 'tests/unit/helpers';

describe(__filename, () => {
  describe('apiAddonType', () => {
    it('maps plural/visible addonTypes to internal types', () => {
      expect(apiAddonType('extensions')).toEqual(ADDON_TYPE_EXTENSION);
      expect(apiAddonType('themes')).toEqual(ADDON_TYPE_STATIC_THEME);
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
    const addon = createInternalAddonWithLang({
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

    it('preserves line breaks between ul/li tags', () => {
      const htmlValue = '<ul>\n<li><strong></strong>\n</li>\n</ul>';

      expect(nl2br(htmlValue)).toEqual(
        '<ul>\n<li><strong></strong>\n</li>\n</ul>',
      );
    });

    it('preserves line breaks between ol/li tags', () => {
      const htmlValue = '<ol>\n<li><strong></strong>\n</li>\n</ol>';

      expect(nl2br(htmlValue)).toEqual(
        '<ol>\n<li><strong></strong>\n</li>\n</ol>',
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

    it('converts line breaks between tags', () => {
      const htmlValue =
        '<strong>A title:</strong>\n<a href="something">A link</a>\nSome text';

      expect(nl2br(htmlValue)).toEqual(
        '<strong>A title:</strong><br /><a href="something">A link</a><br />Some text',
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

  describe('visibleAddonType', () => {
    it('maps internal addonTypes to plural/visible types', () => {
      expect(visibleAddonType(ADDON_TYPE_EXTENSION)).toEqual('extensions');
      expect(visibleAddonType(ADDON_TYPE_STATIC_THEME)).toEqual('themes');
    });

    it('fails on unrecognised internal addonType', () => {
      expect(() => {
        // "theme" is not a valid visible addonType; it should be "themes".
        visibleAddonType('theme');
      }).toThrowError('"theme" not found in VISIBLE_ADDON_TYPES_MAPPING');
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

  describe('findFileForPlatform', () => {
    const _findFileForPlatform = ({
      files = [fakePlatformFile],
      userAgent = userAgentsByPlatform.windows.firefox40,
    } = {}) => {
      const userAgentInfo = userAgent && UAParser(userAgent);
      const platformFiles = createPlatformFiles({ ...fakeVersion, files });

      return findFileForPlatform({
        userAgentInfo,
        platformFiles,
      });
    };

    const windowsFile = {
      ...fakePlatformFile,
      platform: OS_WINDOWS,
    };
    const macFile = {
      ...fakePlatformFile,
      platform: OS_MAC,
    };
    const linuxFile = {
      ...fakePlatformFile,
      platform: OS_LINUX,
    };
    const androidFile = {
      ...fakePlatformFile,
      platform: OS_ANDROID,
    };
    const allPlatformsFile = {
      ...fakePlatformFile,
      platform: OS_ALL,
    };

    it('returns the correct file for Windows', () => {
      expect(
        _findFileForPlatform({
          userAgent: userAgentsByPlatform.windows.firefox40,
          files: [windowsFile, macFile],
        }),
      ).toEqual(windowsFile);
    });

    it('returns the correct file for Mac OS', () => {
      expect(
        _findFileForPlatform({
          userAgent: userAgentsByPlatform.mac.firefox33,
          files: [windowsFile, macFile],
        }),
      ).toEqual(macFile);
    });

    it('returns the correct file for Linux', () => {
      expect(
        _findFileForPlatform({
          userAgent: userAgentsByPlatform.linux.firefox10,
          files: [windowsFile, linuxFile],
        }),
      ).toEqual(linuxFile);
    });

    it('returns the correct file for Linux Ubuntu', () => {
      expect(
        _findFileForPlatform({
          // This parses to the name Ubuntu instead of Linux.
          userAgent: userAgentsByPlatform.linux.firefox57Ubuntu,
          files: [windowsFile, linuxFile],
        }),
      ).toEqual(linuxFile);
    });

    it('returns the correct file for Unix platforms', () => {
      expect(
        _findFileForPlatform({
          userAgent: userAgentsByPlatform.unix.firefox51,
          files: [windowsFile, linuxFile],
        }),
      ).toEqual(linuxFile);
    });

    it('returns the correct file for BSD platforms', () => {
      expect(
        _findFileForPlatform({
          userAgent: userAgentsByPlatform.bsd.firefox40FreeBSD,
          files: [windowsFile, linuxFile],
        }),
      ).toEqual(linuxFile);
    });

    it('returns the correct file for Android mobile', () => {
      expect(
        _findFileForPlatform({
          userAgent: userAgentsByPlatform.android.firefox40Mobile,
          files: [windowsFile, androidFile],
        }),
      ).toEqual(androidFile);
    });

    it('returns the correct file for Android tablet', () => {
      expect(
        _findFileForPlatform({
          userAgent: userAgentsByPlatform.android.firefox40Tablet,
          files: [windowsFile, androidFile],
        }),
      ).toEqual(androidFile);
    });

    it('returns all-platform URL for unsupported platforms', () => {
      expect(
        _findFileForPlatform({
          // This platform is unsupported.
          userAgent: userAgentsByPlatform.firefoxOS.firefox26,
          files: [windowsFile, allPlatformsFile],
        }),
      ).toEqual(allPlatformsFile);
    });

    it('gives preference to a specific platform URL', () => {
      expect(
        _findFileForPlatform({
          userAgent: userAgentsByPlatform.windows.firefox40,
          files: [windowsFile, allPlatformsFile],
        }),
      ).toEqual(windowsFile);
    });

    it('returns undefined when nothing else matches', () => {
      expect(
        _findFileForPlatform({
          // This is valid for Linux.
          userAgent: userAgentsByPlatform.linux.firefox10,
          files: [windowsFile, macFile],
        }),
      ).toEqual(undefined);
    });

    it('returns undefined for user agents with an unknown platform', () => {
      expect(
        _findFileForPlatform({
          userAgent: 'some-completely-wacko-user-agent-string',
          files: [windowsFile, macFile],
        }),
      ).toEqual(undefined);
    });

    it('returns undefined when no files exist', () => {
      expect(
        _findFileForPlatform({
          userAgent: userAgentsByPlatform.linux.firefox10,
          files: [],
        }),
      ).toEqual(undefined);
    });
  });
});
