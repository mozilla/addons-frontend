import url from 'url';

import React from 'react';
import config from 'config';
import { sprintf } from 'jed';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-dom/test-utils';
import { compose } from 'redux';

import * as api from 'core/api';
import {
  ADDON_TYPE_COMPLETE_THEME,
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_THEME,
  CATEGORY_COLORS,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  validAddonTypes,
} from 'core/constants';
import {
  apiAddonTypeIsValid,
  addQueryParams,
  addonHasVersionHistory,
  apiAddonType,
  convertBoolean,
  getCategoryColor,
  getClientApp,
  getClientConfig,
  isAddonAuthor,
  isAllowedOrigin,
  isValidClientApp,
  ngettext,
  nl2br,
  parsePage,
  refreshAddon,
  render404IfConfigKeyIsFalse,
  safePromise,
  sanitizeHTML,
  sanitizeUserHTML,
  visibleAddonType,
  trimAndAddProtocolToUrl,
} from 'core/utils';
import NotFound from 'core/components/ErrorPage/NotFound';
import I18nProvider from 'core/i18n/Provider';
import { createInternalAddon, loadAddons } from 'core/reducers/addons';
import {
  fakeAddon,
  signedInApiState,
} from 'tests/unit/amo/helpers';
import {
  createFetchAddonResult,
  fakeI18n,
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

    it('returns false for theme', () => {
      const addon = createAddonWithType(ADDON_TYPE_THEME);

      expect(addonHasVersionHistory(addon)).toEqual(false);
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
      const ua = 'mozilla/5.0 (android; mobile; rv:40.0) gecko/40.0 firefox/40.0';
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

      expect(isAddonAuthor({ addon: partialAddon, userId: null }))
        .toEqual(false);
    });

    it('returns false if add-on has a null value for authors', () => {
      const partialAddon = { ...addon, authors: null };

      expect(isAddonAuthor({ addon: partialAddon, userId: null }))
        .toEqual(false);
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

  describe('refreshAddon', () => {
    const addonSlug = fakeAddon.slug;
    const apiState = signedInApiState;
    let dispatch;
    let mockApi;

    beforeEach(() => {
      dispatch = sinon.spy();
      mockApi = sinon.mock(api);
    });

    it('fetches and dispatches an add-on', () => {
      const { entities } = createFetchAddonResult(fakeAddon);
      mockApi
        .expects('fetchAddon')
        .once()
        .withArgs({ slug: addonSlug, api: apiState })
        .returns(Promise.resolve({ entities }));

      return refreshAddon({ addonSlug, apiState, dispatch })
        .then(() => {
          expect(dispatch.called).toBeTruthy();
          expect(dispatch.firstCall.args[0]).toEqual(loadAddons(entities));
          mockApi.verify();
        });
    });

    it('handles 404s when loading the add-on', () => {
      mockApi
        .expects('fetchAddon')
        .once()
        .withArgs({ slug: addonSlug, api: signedInApiState })
        .returns(Promise.reject(new Error('Error accessing API')));
      return refreshAddon({ addonSlug, apiState, dispatch })
        .then(unexpectedSuccess,
          () => {
            expect(dispatch.called).toEqual(false);
          });
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
      expect(isAllowedOrigin('http://foo.com', { allowedOrigins })).toEqual(true);
      expect(isAllowedOrigin('https://foo.com', { allowedOrigins })).toEqual(true);
    });
  });

  describe('addQueryParams', () => {
    it('adds a query param to a plain url', () => {
      const output = addQueryParams('http://whatever.com/', { foo: 'bar' });
      expect(url.parse(output, true).query).toEqual({ foo: 'bar' });
    });

    it('adds more than one query param to a plain url', () => {
      const output = addQueryParams('http://whatever.com/', { foo: 'bar', test: 1 });
      expect(url.parse(output, true).query).toEqual({ foo: 'bar', test: '1' });
    });

    it('overrides an existing parameter', () => {
      const output = addQueryParams('http://whatever.com/?foo=1', { foo: 'bar' });
      expect(url.parse(output, true).query).toEqual({ foo: 'bar' });
    });

    it('overrides multiple existing parameters', () => {
      const output = addQueryParams('http://whatever.com/?foo=1&bar=2', { foo: 'bar', bar: 'baz' });
      expect(url.parse(output, true).query).toEqual({ foo: 'bar', bar: 'baz' });
    });

    it('leaves other params intact', () => {
      const output = addQueryParams('http://whatever.com/?foo=1&bar=2', { bar: 'updated' });
      expect(url.parse(output, true).query).toEqual({ foo: '1', bar: 'updated' });
    });
  });

  describe('ngettext', () => {
    function fileCount(count) {
      return sprintf(ngettext('%(count)s file', '%(count)s files', count),
        { count });
    }

    it('outputs singular when count is one', () => {
      expect('1 file').toEqual(fileCount(1));
    });

    it('outputs plural when count is zero', () => {
      expect('0 files').toEqual(fileCount(0));
    });

    it('outputs plural when count is above one', () => {
      expect('2 files').toEqual(fileCount(2));
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
      }).toThrowError('"hasOwnProperty" not found in VISIBLE_ADDON_TYPES_MAPPING');
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
        expect(callback.called).toBeTruthy();
        expect(callback.firstCall.args).toEqual(['one', 'two', 'three']);
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
      expect(trimAndAddProtocolToUrl('https://test.com')).toEqual('https://test.com');
    });
  });

  describe('render404IfConfigKeyIsFalse', () => {
    function render(
      props = {},
      {
        configKey = 'someConfigKey',
        _config = { get: () => true },
        SomeComponent = () => <div />,
      } = {}
    ) {
      const WrappedComponent = compose(
        render404IfConfigKeyIsFalse(configKey, { _config }),
      )(SomeComponent);

      return renderIntoDocument(
        <I18nProvider i18n={fakeI18n()}>
          <WrappedComponent {...props} />
        </I18nProvider>
      );
    }

    it('requires a config key', () => {
      expect(() => render404IfConfigKeyIsFalse()).toThrowError(/configKey cannot be empty/);
    });

    it('returns a 404 when disabled by the config', () => {
      const configKey = 'customConfigKey';
      const _config = {
        get: sinon.spy(() => false),
      };
      const root = render({}, { _config, configKey });
      const node = findRenderedComponentWithType(root, NotFound);

      expect(node).toBeTruthy();
      expect(_config.get.called).toBeTruthy();
      expect(_config.get.firstCall.args[0]).toEqual(configKey);
    });

    it('passes through component and props when enabled', () => {
      const _config = { get: () => true };
      const SomeComponent = sinon.spy(() => <div />);
      render({ color: 'orange', size: 'large' }, { SomeComponent, _config });

      expect(SomeComponent.called).toBeTruthy();
      const props = SomeComponent.firstCall.args[0];
      expect(props.color).toEqual('orange');
      expect(props.size).toEqual('large');
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
        'addonType "NOT_A_REAL_TYPE" not found in CATEGORY_COLORS');
    });

    it('deals with high category IDs', () => {
      for (let i = 750; i < 800; i++) {
        const category = { id: i, type: ADDON_TYPE_THEME };
        const categoryColor = getCategoryColor(category);

        expect(categoryColor)
          .toBeLessThanOrEqual(CATEGORY_COLORS[ADDON_TYPE_THEME]);
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

  describe('parsePage', () => {
    it('returns a number', () => {
      expect(parsePage(10)).toBe(10);
    });

    it('parses a number from a string', () => {
      expect(parsePage('8')).toBe(8);
    });

    it('treats negatives as 1', () => {
      expect(parsePage('-10')).toBe(1);
    });

    it('treats words as 1', () => {
      expect(parsePage('hmmm')).toBe(1);
    });

    it('treats "0" as 1', () => {
      expect(parsePage('0')).toBe(1);
    });

    it('treats 0 as 1', () => {
      expect(parsePage(0)).toBe(1);
    });

    it('treats empty strings as 1', () => {
      expect(parsePage('')).toBe(1);
    });

    it('treats undefined as 1', () => {
      expect(parsePage(undefined)).toBe(1);
    });
  });

  describe('sanitizeUserHTML', () => {
    const sanitize = (...args) => sanitizeUserHTML(...args).__html;

    it('converts new lines to breaks', () => {
      expect(sanitize(`
      first
      second
    `).trim()).toEqual('<br>      first<br>      second<br>');
    });

    it('allows some tags', () => {
      const customHtml =
        '<b>check</b> <i>out</i> <a href="http://mysite">my site</a>';
      expect(sanitize(customHtml)).toEqual(customHtml);
    });

    it('does not allow certain tags', () => {
      expect(sanitize('<b>my add-on</b> <script>alert("does XSS")</script>'))
        .toEqual('<b>my add-on</b> ');
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
});
