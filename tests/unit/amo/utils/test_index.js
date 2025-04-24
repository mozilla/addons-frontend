import url from 'url';

import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  DEFAULT_UTM_MEDIUM,
  DEFAULT_UTM_SOURCE,
  DOWNLOAD_FIREFOX_UTM_CAMPAIGN,
  PROMOTED_ADDONS_SUMO_URL,
} from 'amo/constants';
import {
  addQueryParamsToHistory,
  apiAddonType,
  apiAddonTypeIsValid,
  checkInternalURL,
  convertBoolean,
  getAddonURL,
  getCanonicalURL,
  getClientApp,
  getClientConfig,
  getClientAppAndLangFromPath,
  getPromotedBadgesLinkUrl,
  isAddonAuthor,
  isValidClientApp,
  makeQueryStringWithUTM,
  nl2br,
  normalizeFileNameId,
  removeProtocolFromURL,
  safePromise,
  sanitizeHTML,
  sanitizeUserHTML,
  stripLangFromAmoUrl,
  visibleAddonType,
} from 'amo/utils';
import {
  createFakeHistory,
  createFakeLocation,
  createInternalAddonWithLang,
  fakeAddon,
  getFakeConfig,
  unexpectedSuccess,
  userAgents,
} from 'tests/unit/helpers';

describe(__filename, () => {
  describe('getCanonicalURL', () => {
    it(`returns an absolute canonical URL`, () => {
      const locationPathname = '/path/name';
      const baseURL = 'https://example.org';
      const _config = getFakeConfig({ baseURL });

      expect(getCanonicalURL({ _config, locationPathname })).toEqual(
        `${baseURL}${locationPathname}`,
      );
    });
  });

  describe('getAddonURL', () => {
    it(`returns an addon URL using slug`, () => {
      const slug = 'some-addon-slug';

      expect(getAddonURL(slug)).toEqual(`/addon/${slug}/`);
    });
  });

  describe('checkInternalURL', () => {
    const pathname = '/path/name';

    it('strips the host name for a full URL containing the current host', () => {
      const baseURL = 'https://example.org';
      const urlString = url.format({ ...url.parse(baseURL), pathname });

      expect(
        checkInternalURL({ _config: getFakeConfig({ baseURL }), urlString })
          .relativeURL,
      ).toEqual(pathname);
    });

    it('strips the host name for a protocol-free URL containing the current host', () => {
      const currentHost = 'example.org';
      const baseURL = `https://${currentHost}`;

      expect(
        checkInternalURL({
          _config: getFakeConfig({ baseURL }),
          urlString: `//${currentHost}${pathname}`,
        }).relativeURL,
      ).toEqual(pathname);
    });

    it('ensures that the generated URL always starst with a /', () => {
      const baseURL = 'https://example.org/';
      const urlString = url.format({ ...url.parse(baseURL), pathname });

      expect(
        checkInternalURL({ _config: getFakeConfig({ baseURL }), urlString })
          .relativeURL,
      ).toEqual(pathname);
    });

    it('does not strip the host name for a different host', () => {
      const siteBaseURL = 'https://example.org';
      const otherBaseURL = 'https://www.mozilla.org';

      const urlString = url.format({ ...url.parse(otherBaseURL), pathname });

      expect(
        checkInternalURL({
          _config: getFakeConfig({ baseURL: siteBaseURL }),
          urlString,
        }).relativeURL,
      ).toEqual(urlString);
    });

    describe('isInternal prop', () => {
      it('returns true for a single slash-prefixed URL', () => {
        expect(
          checkInternalURL({ urlString: '/some/path' }).isInternal,
        ).toEqual(true);
      });

      it('returns true for a protocol-free URL containing the current host', () => {
        const currentHost = 'example.org';
        const baseURL = `https://${currentHost}`;

        expect(
          checkInternalURL({
            _config: getFakeConfig({ baseURL }),
            urlString: `//${currentHost}`,
          }).isInternal,
        ).toEqual(true);
      });

      it('returns false for a protocol-free URL containing a different host', () => {
        const baseURL = 'https://example.org';

        expect(
          checkInternalURL({
            _config: getFakeConfig({ baseURL }),
            urlString: '//www.mozilla.org',
          }).isInternal,
        ).toEqual(false);
      });

      it('returns true for a full URL containing the current host', () => {
        const baseURL = 'https://example.org';
        const urlString = url.format({ ...url.parse(baseURL), pathname });

        expect(
          checkInternalURL({ _config: getFakeConfig({ baseURL }), urlString })
            .isInternal,
        ).toEqual(true);
      });

      it('returns false for a full URL containing a different host', () => {
        const siteBaseURL = 'https://example.org';
        const otherBaseURL = 'https://www.mozilla.org';

        const urlString = url.format({ ...url.parse(otherBaseURL), pathname });

        expect(
          checkInternalURL({
            _config: getFakeConfig({ baseURL: siteBaseURL }),
            urlString,
          }).isInternal,
        ).toEqual(false);
      });

      it('returns false for an subdomain of the current host', () => {
        const siteBaseURL = 'https://example.org';
        const subdomainBaseURL = 'https://subdomain.example.org';

        const urlString = url.format({
          ...url.parse(subdomainBaseURL),
          pathname,
        });

        expect(
          checkInternalURL({
            _config: getFakeConfig({ baseURL: siteBaseURL }),
            urlString,
          }).isInternal,
        ).toEqual(false);
      });

      it('returns false if the current host is a subdomain of the proposed URLs host', () => {
        const siteBaseURL = 'https://subdomain.example.org';
        const proposedBaseURL = 'https://example.org';

        const urlString = url.format({
          ...url.parse(proposedBaseURL),
          pathname,
        });

        expect(
          checkInternalURL({
            _config: getFakeConfig({ baseURL: siteBaseURL }),
            urlString,
          }).isInternal,
        ).toEqual(false);
      });

      it('returns false for a blog URL containing the current host', () => {
        const baseURL = 'https://example.org';
        const urlString = `${baseURL}/blog/some-blog-post/`;

        expect(
          checkInternalURL({ _config: getFakeConfig({ baseURL }), urlString })
            .isInternal,
        ).toEqual(false);
      });
    });
  });

  describe('getPromotedBadgesLinkUrl', () => {
    it('returns a URL with utm_content specified', () => {
      const utm_content = 'some-utm-content';

      expect(getPromotedBadgesLinkUrl({ utm_content })).toEqual(
        `${PROMOTED_ADDONS_SUMO_URL}${makeQueryStringWithUTM({
          utm_campaign: null,
          utm_content,
        })}`,
      );
    });
  });

  describe('stripLangFromAmoUrl', () => {
    // These are known values from the config.
    const validLang = 'en-US';
    const invalidLang = 'en_US';

    it('should return the same url if the link is external', () => {
      const _checkInternalURL = sinon
        .stub()
        .returns({ isInternal: false, relativeURL: '' });
      const urlString = `https://somehost/${validLang}/somepath/`;
      expect(stripLangFromAmoUrl({ _checkInternalURL, urlString })).toEqual(
        urlString,
      );
    });

    it('should strip the lang if the link is internal', () => {
      const _checkInternalURL = sinon
        .stub()
        .returns({ isInternal: true, relativeURL: '' });
      const urlString = `https://somehost/${validLang}/somepath/`;
      expect(stripLangFromAmoUrl({ _checkInternalURL, urlString })).toEqual(
        'https://somehost/somepath/',
      );
    });

    it('should not strip an invalid lang', () => {
      const _checkInternalURL = sinon
        .stub()
        .returns({ isInternal: true, relativeURL: '' });
      const urlString = `https://somehost/${invalidLang}/somepath/`;
      expect(stripLangFromAmoUrl({ _checkInternalURL, urlString })).toEqual(
        urlString,
      );
    });

    it('should not strip a lang that is not the first path item', () => {
      const _checkInternalURL = sinon
        .stub()
        .returns({ isInternal: true, relativeURL: '' });
      const urlString = `https://somehost/somepath/${validLang}/`;
      expect(stripLangFromAmoUrl({ _checkInternalURL, urlString })).toEqual(
        urlString,
      );
    });

    it('maintains the querystring', () => {
      const _checkInternalURL = sinon
        .stub()
        .returns({ isInternal: true, relativeURL: '' });
      const urlString = `https://somehost/${validLang}/somepath/?a=b`;
      expect(stripLangFromAmoUrl({ _checkInternalURL, urlString })).toEqual(
        'https://somehost/somepath/?a=b',
      );
    });

    it('does not strip a valid lang from the querystring', () => {
      const _checkInternalURL = sinon
        .stub()
        .returns({ isInternal: true, relativeURL: '' });
      const urlString = `https://somehost/somepath/?lang=${validLang}`;
      expect(stripLangFromAmoUrl({ _checkInternalURL, urlString })).toEqual(
        urlString,
      );
    });

    it('only strips the first instance of a lang', () => {
      const _checkInternalURL = sinon
        .stub()
        .returns({ isInternal: true, relativeURL: '' });
      const urlString = `https://somehost/${validLang}/${validLang}/somepath/`;
      expect(stripLangFromAmoUrl({ _checkInternalURL, urlString })).toEqual(
        `https://somehost/${validLang}/somepath/`,
      );
    });
  });

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
      }).toThrow('"theme" not found in API_ADDON_TYPES_MAPPING');
    });

    // See:
    // https://github.com/mozilla/addons-frontend/pull/1541#discussion_r95861202
    it('does not return a false positive on a method', () => {
      expect(() => {
        apiAddonType('hasOwnProperty');
      }).toThrow('"hasownproperty" not found in API_ADDON_TYPES_MAPPING');
    });

    // See https://github.com/mozilla/addons-frontend/issues/11788
    it('works with mixed case arguments', () => {
      expect(apiAddonType('Extensions')).toEqual(ADDON_TYPE_EXTENSION);
      expect(apiAddonType('ThemeS')).toEqual(ADDON_TYPE_STATIC_THEME);
    });
  });

  describe('addonTypeIsValid', () => {
    it('returns true for a valid addonType', () => {
      expect(apiAddonTypeIsValid('extensions')).toEqual(true);
    });

    it('returns false for an invalid addonType', () => {
      expect(apiAddonTypeIsValid('xul')).toEqual(false);
    });

    // See https://github.com/mozilla/addons-frontend/issues/11788
    it('works with a mixed case argument', () => {
      expect(apiAddonTypeIsValid('Extensions')).toEqual(true);
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
          picture_url: 'https://addons.mozilla.org//user-media/myphoto.jpg',
          url: 'https://addons.mozilla.org//en-GB/firefox/user/tofumatt/',
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

  describe('visibleAddonType', () => {
    it('maps internal addonTypes to plural/visible types', () => {
      expect(visibleAddonType(ADDON_TYPE_EXTENSION)).toEqual('extensions');
      expect(visibleAddonType(ADDON_TYPE_STATIC_THEME)).toEqual('themes');
    });

    it('fails on unrecognised internal addonType', () => {
      expect(() => {
        // "theme" is not a valid visible addonType; it should be "themes".
        visibleAddonType('theme');
      }).toThrow('"theme" not found in VISIBLE_ADDON_TYPES_MAPPING');
    });

    // See:
    // https://github.com/mozilla/addons-frontend/pull/1541#discussion_r95861202
    it('does not return a false positive on a method', () => {
      expect(() => {
        visibleAddonType('hasOwnProperty');
      }).toThrow('"hasownproperty" not found in VISIBLE_ADDON_TYPES_MAPPING');
    });

    // See https://github.com/mozilla/addons-frontend/issues/11788
    it('works with mixed case arguments', () => {
      expect(visibleAddonType('Extension')).toEqual('extensions');
      expect(visibleAddonType('StaticTheme')).toEqual('themes');
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

    describe('custom `<li>` handling through hook', () => {
      it('removes `<li>` if not allowed', () => {
        const html = '<li>witness me!</li>';
        expect(sanitizeHTML(html, [])).toEqual({
          __html: 'witness me!',
        });

        expect(sanitizeHTML(html)).toEqual({
          __html: 'witness me!',
        });
      });

      it('does not wrap `<li>` inside a `<ul>` if not allowed', () => {
        const html = '<li>witness me!</li>';
        expect(sanitizeHTML(html, ['li'])).toEqual({
          __html: '<li>witness me!</li>',
        });
      });

      it('wraps `<li>` inside a `<ul>` if they dont already', () => {
        const html = '<li>witness me!</li>';
        expect(sanitizeHTML(html, ['li', 'ul'])).toEqual({
          __html: '<ul><li>witness me!</li></ul>',
        });
      });

      it('wraps `<li>` inside a `<ul>` if their parent was not allowed', () => {
        const html = '<ol><li>witness me!</li></ol>';
        expect(sanitizeHTML(html, ['li', 'ul'])).toEqual({
          __html: '<ul><li>witness me!</li></ul>',
        });
      });

      it('doesnt wrap `<li>` inside a `<ul>` if not necessary', () => {
        const html = '<ul><li>witness me!</li></ul>';
        expect(sanitizeHTML(html, ['li', 'ul'])).toEqual({
          __html: '<ul><li>witness me!</li></ul>',
        });
      });

      it('doesnt wrap `<li>` inside a `<ul>` if not necessary with ol', () => {
        const html = '<ol><li>witness me!</li></ol>';
        expect(sanitizeHTML(html, ['li', 'ol', 'ul'])).toEqual({
          __html: '<ol><li>witness me!</li></ol>',
        });
      });

      it('doesnt wrap `<li>` inside a `<ul>` if not necessary with menu', () => {
        const html = '<menu><li>witness me!</li></menu>';
        expect(sanitizeHTML(html, ['li', 'menu', 'ul'])).toEqual({
          __html: '<menu><li>witness me!</li></menu>',
        });
      });

      it('handles multiple `<li>`', () => {
        const html = '<li>foo</li><li>bar</li>';
        expect(sanitizeHTML(html, ['li', 'ul'])).toEqual({
          __html: '<ul><li>foo</li><li>bar</li></ul>',
        });
      });

      it('handles multiple `<li>` when one does not need fixing', () => {
        const html = '<li>foo</li><ul><li>bar</li></ul>';
        expect(sanitizeHTML(html, ['li', 'ul'])).toEqual({
          __html: '<ul><li>foo</li></ul><ul><li>bar</li></ul>',
        });
      });

      it('handles multiple `<li>` in separate lists', () => {
        const html = '<li>foo</li><code>alice</code><li>bar</li>';
        expect(sanitizeHTML(html, ['li', 'ul', 'code'])).toEqual({
          __html:
            '<ul><li>foo</li></ul><code>alice</code><ul><li>bar</li></ul>',
        });
      });

      it('handles no closing `</li>`', () => {
        const html = '<li>foo<li>bar';
        expect(sanitizeHTML(html, ['li', 'ul', 'p'])).toEqual({
          __html: '<ul><li>foo</li><li>bar</li></ul>',
        });
      });

      it('does not mess ordering`', () => {
        const html = 'Before <li>foo</li><li>bar</li> After';
        expect(sanitizeHTML(html, ['li', 'ul', 'p'])).toEqual({
          __html: 'Before <ul><li>foo</li><li>bar</li></ul> After',
        });
      });
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
      const filename = 'tests/unit/amo/utils/test_index.js';

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

  describe('getClientAppAndLangFromPath', () => {
    const clientApp = CLIENT_APP_FIREFOX;
    const lang = 'en-US';

    it.each([
      `/${lang}/${clientApp}/`,
      `/${lang}/${clientApp}/extensions/`,
      `/${lang}/${clientApp}/search/?q=test`,
    ])('extracts a lang and clientApp from a URL: %s', (urlString) => {
      expect(getClientAppAndLangFromPath(urlString)).toEqual({
        clientApp,
        lang,
      });
    });
  });

  describe('makeQueryStringWithUTM', () => {
    it('adds additional query params if provided', () => {
      const anotherParam = 'some-other-param';

      expect(makeQueryStringWithUTM({ anotherParam })).toEqual(
        `?anotherParam=some-other-param&utm_campaign=${DOWNLOAD_FIREFOX_UTM_CAMPAIGN}&utm_medium=${DEFAULT_UTM_MEDIUM}&utm_source=${DEFAULT_UTM_SOURCE}`,
      );
    });
  });
});
