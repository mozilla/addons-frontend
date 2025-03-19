import UAParser from 'ua-parser-js';

import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  ALL_PROMOTED_CATEGORIES,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  INCOMPATIBLE_ANDROID_UNSUPPORTED,
  INCOMPATIBLE_FIREFOX_FOR_IOS,
  INCOMPATIBLE_NOT_FIREFOX,
  INCOMPATIBLE_OLD_ROOT_CERT_VERSION,
  INCOMPATIBLE_OVER_MAX_VERSION,
  INCOMPATIBLE_UNDER_MIN_VERSION,
  INCOMPATIBLE_UNSUPPORTED_PLATFORM,
  OS_MAC,
  RECOMMENDED,
  validAddonTypes,
} from 'amo/constants';
import {
  correctedLocationForPlatform,
  getCompatibleVersions,
  getClientCompatibility,
  getMobileHomepageLink,
  isAndroidInstallable,
  isCompatibleWithUserAgent,
  isDesktop,
  isFirefox,
  isFirefoxForAndroid,
  isFirefoxForIOS,
  isFirefoxWithOldRootCerts,
} from 'amo/utils/compatibility';
import {
  createFakeLocation,
  createInternalAddonWithLang,
  createInternalVersionWithLang,
  fakeAddon,
  fakeVersion,
  getFakeLogger,
  userAgents,
  userAgentsByPlatform,
} from 'tests/unit/helpers';

describe(__filename, () => {
  describe('isFirefox', () => {
    it('returns false for Android/webkit', () => {
      userAgents.androidWebkit.forEach((userAgent) => {
        expect(isFirefox({ userAgentInfo: UAParser(userAgent) })).toEqual(
          false,
        );
      });
    });

    it('returns false for Chrome Android', () => {
      userAgents.chromeAndroid.forEach((userAgent) => {
        expect(isFirefox({ userAgentInfo: UAParser(userAgent) })).toEqual(
          false,
        );
      });
    });

    it('returns false for Chrome desktop', () => {
      userAgents.chrome.forEach((userAgent) => {
        expect(isFirefox({ userAgentInfo: UAParser(userAgent) })).toEqual(
          false,
        );
      });
    });

    it('returns true for Firefox desktop', () => {
      userAgents.firefox.forEach((userAgent) => {
        expect(isFirefox({ userAgentInfo: UAParser(userAgent) })).toEqual(true);
      });
    });

    it('returns true for Firefox Android', () => {
      userAgents.firefoxAndroid.forEach((userAgent) => {
        expect(isFirefox({ userAgentInfo: UAParser(userAgent) })).toEqual(true);
      });
    });

    it('returns true for Firefox OS', () => {
      userAgents.firefoxOS.forEach((userAgent) => {
        expect(isFirefox({ userAgentInfo: UAParser(userAgent) })).toEqual(true);
      });
    });

    it('returns true for Firefox iOS', () => {
      userAgents.firefoxIOS.forEach((userAgent) => {
        expect(isFirefox({ userAgentInfo: UAParser(userAgent) })).toEqual(true);
      });
    });
  });

  describe('isFirefoxWithOldRootCerts', () => {
    it.each([
      ...userAgents.androidWebkit,
      ...userAgents.chromeAndroid,
      ...userAgents.chrome,
    ])('returns false for %s', (userAgent) => {
      expect(
        isFirefoxWithOldRootCerts({ userAgentInfo: UAParser(userAgent) }),
      ).toEqual(false);
    });

    it.each([
      userAgentsByPlatform.windows.firefox115,
      userAgentsByPlatform.mac.firefox128,
      userAgentsByPlatform.mac.firefox136,
      userAgentsByPlatform.android.firefox136,
    ])('returns false for %s', (userAgent) => {
      expect(
        isFirefoxWithOldRootCerts({ userAgentInfo: UAParser(userAgent) }),
      ).toEqual(false);
    });

    it.each([
      userAgentsByPlatform.windows.firefox40,
      userAgentsByPlatform.mac.firefox69,
      userAgentsByPlatform.linux.firefox10,
      userAgentsByPlatform.android.firefox70,
    ])('returns true for %s', (userAgent) => {
      expect(
        isFirefoxWithOldRootCerts({ userAgentInfo: UAParser(userAgent) }),
      ).toEqual(true);
    });
  });

  describe('isDesktop', () => {
    it.each([...userAgents.chrome, ...userAgents.firefox])(
      'returns true for %s',
      (userAgent) => {
        expect(isDesktop({ userAgentInfo: UAParser(userAgent) })).toEqual(true);
      },
    );

    it.each([
      ...userAgents.androidWebkit,
      ...userAgents.chromeAndroid,
      ...userAgents.firefoxAndroid,
      ...userAgents.firefoxIOS,
    ])('returns false for %s', (userAgent) => {
      expect(isDesktop({ userAgentInfo: UAParser(userAgent) })).toEqual(false);
    });
  });

  describe('isCompatibleWithUserAgent', () => {
    const _isCompatibleWithUserAgent = ({
      addon = createInternalAddonWithLang(fakeAddon),
      currentVersion = createInternalVersionWithLang(fakeAddon.current_version),
      userAgentInfo = UAParser(userAgentsByPlatform.windows.firefox115),
      ...rest
    }) => {
      return isCompatibleWithUserAgent({
        addon,
        currentVersion,
        userAgentInfo,
        ...rest,
      });
    };

    it('is compatible with Firefox', () => {
      expect(
        _isCompatibleWithUserAgent({
          userAgentInfo: UAParser(userAgentsByPlatform.windows.firefox115),
        }),
      ).toEqual({ compatible: true, reason: null });
    });

    it('is incompatible with Firefox iOS', () => {
      userAgents.firefoxIOS.forEach((userAgent) => {
        expect(
          _isCompatibleWithUserAgent({
            userAgentInfo: UAParser(userAgent),
          }),
        ).toEqual({ compatible: false, reason: INCOMPATIBLE_FIREFOX_FOR_IOS });
      });
    });

    it('is compatible with Firefox >= 128', () => {
      expect(
        _isCompatibleWithUserAgent({
          userAgentInfo: UAParser(userAgentsByPlatform.mac.firefox128),
        }),
      ).toEqual({ compatible: true, reason: null });
    });

    it('should use a Firefox for iOS reason code even if minVersion is also not met', () => {
      const userAgentInfo = {
        browser: { name: 'Firefox', version: '8.0' },
        os: { name: 'iOS' },
      };
      expect(
        _isCompatibleWithUserAgent({
          minVersion: '9.0',
          userAgentInfo,
        }),
      ).toEqual({ compatible: false, reason: INCOMPATIBLE_FIREFOX_FOR_IOS });
    });

    it('should mark non-Firefox UAs as incompatible', () => {
      const userAgentInfo = { browser: { name: 'Chrome' } };
      expect(
        _isCompatibleWithUserAgent({
          userAgentInfo,
        }),
      ).toEqual({ compatible: false, reason: INCOMPATIBLE_NOT_FIREFOX });
    });

    it('should mark Firefox 128 as incompatible with a minVersion of 128.1', () => {
      const userAgentInfo = {
        browser: { name: 'Firefox', version: '128.0' },
        os: { name: 'Windows' },
      };
      expect(
        _isCompatibleWithUserAgent({
          minVersion: '128.1',
          userAgentInfo,
        }),
      ).toEqual({ compatible: false, reason: INCOMPATIBLE_UNDER_MIN_VERSION });
    });

    it('should mark Firefox 115 as compatible with a maxVersion of 8', () => {
      // https://github.com/mozilla/addons-frontend/issues/2074
      const userAgentInfo = {
        browser: { name: 'Firefox', version: '115.0' },
        os: { name: 'Windows' },
      };
      expect(
        _isCompatibleWithUserAgent({
          currentVersion: createInternalVersionWithLang({
            ...fakeVersion,
            is_strict_compatibility_enabled: false,
          }),
          maxVersion: '8',
          userAgentInfo,
        }),
      ).toEqual({ compatible: true, reason: null });
    });

    it('should mark Firefox as compatible when no min or max version', () => {
      const userAgentInfo = {
        browser: { name: 'Firefox', version: '128.0' },
        os: { name: 'Windows' },
      };
      expect(
        _isCompatibleWithUserAgent({
          userAgentInfo,
        }),
      ).toEqual({ compatible: true, reason: null });
    });

    it('should mark Firefox as compatible with maxVersion of "*"', () => {
      // WebExtensions are marked as having a maxVersion of "*" by addons-server
      // if their manifests don't contain explicit version information.
      const userAgentInfo = {
        browser: { name: 'Firefox', version: '128.0' },
        os: { name: 'Windows' },
      };
      expect(
        _isCompatibleWithUserAgent({
          maxVersion: '*',
          userAgentInfo,
        }),
      ).toEqual({ compatible: true, reason: null });
    });

    it('should log warning when minVersion is "*"', () => {
      // Note that this should never happen as addons-server will mark a
      // WebExtension with no minVersion as having a minVersion of "48".
      // Still, we accept it (but it will log a warning).
      const fakeLog = getFakeLogger();
      expect(
        _isCompatibleWithUserAgent({
          _log: fakeLog,
          minVersion: '*',
        }),
      ).toEqual({ compatible: false, reason: INCOMPATIBLE_UNDER_MIN_VERSION });
      expect(fakeLog.error.firstCall.args[0]).toContain(
        'minVersion of "*" was passed to isCompatibleWithUserAgent()',
      );
    });

    it('is incompatible with empty user agent values', () => {
      const userAgentInfo = { browser: { name: '' } };
      expect(
        _isCompatibleWithUserAgent({
          userAgentInfo,
        }),
      ).toEqual({ compatible: false, reason: INCOMPATIBLE_NOT_FIREFOX });
    });

    it('is incompatible with non-string user agent values', () => {
      const userAgentInfo = { browser: { name: null }, os: { name: null } };
      expect(
        _isCompatibleWithUserAgent({
          userAgentInfo,
        }),
      ).toEqual({ compatible: false, reason: INCOMPATIBLE_NOT_FIREFOX });
    });

    it('is incompatible if currentVersion is null', () => {
      expect(
        _isCompatibleWithUserAgent({
          currentVersion: null,
        }),
      ).toEqual({
        compatible: false,
        reason: INCOMPATIBLE_UNSUPPORTED_PLATFORM,
      });
    });

    it('allows non-extensions to have mismatching platform files', () => {
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        type: ADDON_TYPE_STATIC_THEME,
      });
      const currentVersion = createInternalVersionWithLang({
        ...fakeVersion,
        file: {
          ...fakeAddon.current_version.file,
          platform: OS_MAC,
        },
      });

      expect(
        _isCompatibleWithUserAgent({ addon, currentVersion }),
      ).toMatchObject({ compatible: true });
    });

    it('is incompatible with Firefox on Android if no compatibility info exists for `android`, even if promoted', () => {
      const currentVersion = createInternalVersionWithLang({
        ...fakeVersion,
        compatibility: {
          firefox: {
            max: '57',
            min: '1',
          },
        },
      });

      expect(
        _isCompatibleWithUserAgent({
          addon: createInternalAddonWithLang({
            ...fakeAddon,
            promoted: { category: RECOMMENDED, apps: [CLIENT_APP_ANDROID] },
          }),
          currentVersion,
          userAgentInfo: UAParser(userAgentsByPlatform.android.firefox136),
        }),
      ).toEqual({
        compatible: false,
        reason: INCOMPATIBLE_ANDROID_UNSUPPORTED,
      });
    });

    it('is incompatible with Firefox < 128 because of root cert expiration', () => {
      const userAgentInfo = {
        browser: { name: 'Firefox', version: '127.0' },
        os: { name: 'Windows' },
      };
      // Would normally be considered compatible, but because Firefox is < 128
      // (and not 115, see test below) it's not.
      expect(
        _isCompatibleWithUserAgent({
          minVersion: '57.0',
          userAgentInfo,
        }),
      ).toEqual({
        compatible: false,
        reason: INCOMPATIBLE_OLD_ROOT_CERT_VERSION,
      });
    });

    it('is still compatible with Firefox 115', () => {
      const userAgentInfo = {
        browser: { name: 'Firefox', version: '115.0' },
        os: { name: 'Windows' },
      };
      expect(
        _isCompatibleWithUserAgent({
          minVersion: '57.0',
          userAgentInfo,
        }),
      ).toEqual({ compatible: true, reason: null });
    });
  });

  describe('getCompatibleVersions', () => {
    const _getCompatibleVersions = ({
      addon = createInternalAddonWithLang(fakeAddon),
      currentVersion = createInternalVersionWithLang(fakeVersion),
      ...rest
    }) => {
      return getCompatibleVersions({
        addon,
        currentVersion,
        ...rest,
      });
    };

    it('gets the min and max versions', () => {
      const currentVersion = createInternalVersionWithLang({
        ...fakeVersion,
        compatibility: {
          firefox: {
            max: '20.0.*',
            min: '11.0.1',
          },
        },
      });

      const { maxVersion, minVersion } = _getCompatibleVersions({
        clientApp: CLIENT_APP_FIREFOX,
        currentVersion,
      });

      expect(maxVersion).toEqual('20.0.*');
      expect(minVersion).toEqual('11.0.1');
    });

    it('gets null if the clientApp does not match', () => {
      const currentVersion = createInternalVersionWithLang({
        ...fakeVersion,
        compatibility: {
          firefox: {
            max: '20.0.*',
            min: '11.0.1',
          },
        },
      });

      const { maxVersion, minVersion } = _getCompatibleVersions({
        clientApp: CLIENT_APP_ANDROID,
        currentVersion,
      });

      expect(maxVersion).toEqual(null);
      expect(minVersion).toEqual(null);
    });

    it('returns null if clientApp has no compatibility', () => {
      const currentVersion = createInternalVersionWithLang({
        ...fakeVersion,
        compatibility: {},
      });

      const { maxVersion, minVersion } = _getCompatibleVersions({
        clientApp: CLIENT_APP_FIREFOX,
        currentVersion,
      });

      expect(maxVersion).toEqual(null);
      expect(minVersion).toEqual(null);
    });

    it('returns nulls if currentVersion is null', () => {
      const { maxVersion, minVersion, supportsClientApp } =
        _getCompatibleVersions({
          clientApp: CLIENT_APP_FIREFOX,
          currentVersion: null,
        });

      expect(supportsClientApp).toEqual(false);
      expect(maxVersion).toEqual(null);
      expect(minVersion).toEqual(null);
    });

    it('marks clientApp as unsupported without compatibility', () => {
      const currentVersion = createInternalVersionWithLang({
        ...fakeVersion,
        // This add-on is not compatible with any client apps.
        compatibility: {},
      });

      const { supportsClientApp } = _getCompatibleVersions({
        currentVersion,
        clientApp: CLIENT_APP_FIREFOX,
      });

      expect(supportsClientApp).toEqual(false);
    });

    it('marks clientApp as supported with compatibility', () => {
      const clientApp = CLIENT_APP_ANDROID;
      const currentVersion = createInternalVersionWithLang({
        ...fakeVersion,
        compatibility: {
          [clientApp]: {
            min: '48.0',
            max: '*',
          },
        },
      });

      const { supportsClientApp } = _getCompatibleVersions({
        clientApp,
        currentVersion,
      });

      expect(supportsClientApp).toEqual(true);
    });
  });

  describe('getClientCompatibility', () => {
    const _getClientCompatibility = ({
      addon = createInternalAddonWithLang(fakeAddon),
      currentVersion = createInternalVersionWithLang(fakeVersion),
      ...rest
    }) => {
      return getClientCompatibility({
        addon,
        currentVersion,
        ...rest,
      });
    };

    it('returns true for Firefox (reason undefined when compatibile)', () => {
      const { browser, os } = UAParser(userAgentsByPlatform.mac.firefox136);
      const userAgentInfo = { browser, os };
      const clientApp = CLIENT_APP_FIREFOX;
      const currentVersion = createInternalVersionWithLang({
        ...fakeVersion,
        compatibility: {
          [clientApp]: {
            min: '48.0',
            max: '*',
          },
        },
      });

      expect(
        _getClientCompatibility({
          clientApp,
          currentVersion,
          userAgentInfo,
        }),
      ).toEqual({
        compatible: true,
        maxVersion: currentVersion.compatibility[clientApp].max,
        minVersion: currentVersion.compatibility[clientApp].min,
        reason: null,
      });
    });

    it('returns maxVersion when set', () => {
      const { browser, os } = UAParser(userAgentsByPlatform.mac.firefox136);
      const userAgentInfo = { browser, os };

      expect(
        _getClientCompatibility({
          clientApp: CLIENT_APP_FIREFOX,
          currentVersion: createInternalVersionWithLang({
            ...fakeVersion,
            compatibility: {
              firefox: { max: '200.0', min: null },
            },
          }),
          userAgentInfo,
        }),
      ).toEqual({
        compatible: true,
        maxVersion: '200.0',
        minVersion: null,
        reason: null,
      });
    });

    it('returns minVersion when set', () => {
      const { browser, os } = UAParser(userAgentsByPlatform.mac.firefox136);
      const userAgentInfo = { browser, os };

      expect(
        _getClientCompatibility({
          clientApp: CLIENT_APP_FIREFOX,
          currentVersion: createInternalVersionWithLang({
            ...fakeVersion,
            compatibility: {
              firefox: { max: null, min: '2.0' },
            },
          }),
          userAgentInfo,
        }),
      ).toEqual({
        compatible: true,
        maxVersion: null,
        minVersion: '2.0',
        reason: null,
      });
    });

    it('returns incompatible for non-Firefox UA', () => {
      const { browser, os } = UAParser(userAgentsByPlatform.mac.chrome41);
      const userAgentInfo = { browser, os };
      const clientApp = CLIENT_APP_FIREFOX;
      const currentVersion = createInternalVersionWithLang({
        ...fakeVersion,
        compatibility: {
          [clientApp]: {
            min: '*',
            max: '57.0',
          },
        },
      });

      expect(
        _getClientCompatibility({
          clientApp,
          currentVersion,
          userAgentInfo,
        }),
      ).toEqual({
        compatible: false,
        maxVersion: currentVersion.compatibility[clientApp].max,
        minVersion: currentVersion.compatibility[clientApp].min,
        reason: INCOMPATIBLE_NOT_FIREFOX,
      });
    });

    it('returns incompatible when currentVersion is null', () => {
      const { browser, os } = UAParser(userAgentsByPlatform.mac.firefox136);
      const userAgentInfo = { browser, os };
      const clientApp = CLIENT_APP_FIREFOX;

      expect(
        _getClientCompatibility({
          clientApp,
          currentVersion: null,
          userAgentInfo,
        }),
      ).toEqual({
        compatible: false,
        maxVersion: null,
        minVersion: null,
        reason: INCOMPATIBLE_UNSUPPORTED_PLATFORM,
      });
    });

    it('returns compatible if strict compatibility is off', () => {
      const { browser, os } = UAParser(userAgentsByPlatform.mac.firefox136);
      const userAgentInfo = { browser, os };

      expect(
        _getClientCompatibility({
          clientApp: CLIENT_APP_FIREFOX,
          currentVersion: createInternalVersionWithLang({
            ...fakeVersion,
            compatibility: {
              ...fakeAddon.current_version.compatibility,
              [CLIENT_APP_FIREFOX]: {
                max: '135.*',
                min: '24.0',
              },
            },
            file: fakeAddon.current_version.file,
            is_strict_compatibility_enabled: false,
          }),
          userAgentInfo,
        }),
      ).toMatchObject({ compatible: true });
    });

    it('returns incompatible if strict compatibility enabled', () => {
      const { browser, os } = UAParser(userAgentsByPlatform.mac.firefox136);
      const userAgentInfo = { browser, os };

      expect(
        _getClientCompatibility({
          clientApp: CLIENT_APP_FIREFOX,
          currentVersion: createInternalVersionWithLang({
            ...fakeVersion,
            compatibility: {
              ...fakeAddon.current_version.compatibility,
              [CLIENT_APP_FIREFOX]: {
                max: '135.*',
                min: '24.0',
              },
            },
            file: fakeAddon.current_version.file,
            is_strict_compatibility_enabled: true,
          }),
          userAgentInfo,
        }),
      ).toMatchObject({
        compatible: false,
        reason: INCOMPATIBLE_OVER_MAX_VERSION,
      });
    });

    it('returns incompatible when add-on does not support client app', () => {
      const { browser, os } = UAParser(userAgentsByPlatform.mac.firefox136);
      const userAgentInfo = { browser, os };

      expect(
        _getClientCompatibility({
          clientApp: CLIENT_APP_FIREFOX,
          currentVersion: createInternalVersionWithLang({
            ...fakeVersion,
            compatibility: {},
          }),
          userAgentInfo,
        }),
      ).toEqual({
        compatible: false,
        maxVersion: null,
        minVersion: null,
        reason: INCOMPATIBLE_UNSUPPORTED_PLATFORM,
      });
    });

    it('returns correct reason when add-on is incompatible with android', () => {
      const { browser, os } = UAParser(userAgentsByPlatform.android.firefox136);
      const userAgentInfo = { browser, os };

      expect(
        _getClientCompatibility({
          clientApp: CLIENT_APP_ANDROID,
          currentVersion: createInternalVersionWithLang({
            ...fakeVersion,
            compatibility: {},
          }),
          userAgentInfo,
        }),
      ).toMatchObject({
        reason: INCOMPATIBLE_ANDROID_UNSUPPORTED,
      });
    });
  });

  describe('correctedLocationForPlatform', () => {
    const _correctedLocationForPlatform = ({
      clientApp = CLIENT_APP_FIREFOX,
      isHomePage = false,
      lang = 'en-US',
      location = createFakeLocation(),
      userAgentInfo,
    }) => {
      return correctedLocationForPlatform({
        clientApp,
        isHomePage,
        lang,
        location,
        userAgentInfo,
      });
    };

    it('returns null when on Firefox for iOS', () => {
      expect(
        _correctedLocationForPlatform({
          userAgentInfo: UAParser(userAgentsByPlatform.ios.firefox1iPhone),
        }),
      ).toEqual(null);
    });

    it('returns null when on a non-Firefox browser', () => {
      expect(
        _correctedLocationForPlatform({
          userAgentInfo: UAParser(userAgentsByPlatform.mac.chrome41),
        }),
      ).toEqual(null);
    });

    it('returns a link to the mobile homepage when on Firefox for Android and clientApp is firefox', () => {
      const lang = 'fr';
      expect(
        _correctedLocationForPlatform({
          clientApp: CLIENT_APP_FIREFOX,
          lang,
          userAgentInfo: UAParser(userAgentsByPlatform.android.firefox136),
        }),
      ).toEqual(getMobileHomepageLink(lang));
    });

    it('returns null when on Firefox for Android and clientApp is android for most pages', () => {
      const lang = 'fr';
      expect(
        _correctedLocationForPlatform({
          clientApp: CLIENT_APP_ANDROID,
          isHomePage: false,
          lang,
          location: createFakeLocation({ pathname: '/some/path' }),
          userAgentInfo: UAParser(userAgentsByPlatform.android.firefox136),
        }),
      ).toEqual(null);
    });

    it('returns null when on Firefox for Android and clientApp is android for the home page', () => {
      expect(
        _correctedLocationForPlatform({
          clientApp: CLIENT_APP_ANDROID,
          isHomePage: true,
          location: createFakeLocation({ pathname: '/some/path' }),
          userAgentInfo: UAParser(userAgentsByPlatform.android.firefox136),
        }),
      ).toEqual(null);
    });

    it('returns null when on Firefox for Android and clientApp is android for the search page', () => {
      expect(
        _correctedLocationForPlatform({
          clientApp: CLIENT_APP_ANDROID,
          isHomePage: false,
          location: createFakeLocation({ pathname: '/search/' }),
          userAgentInfo: UAParser(userAgentsByPlatform.android.firefox136),
        }),
      ).toEqual(null);
    });

    it('returns a link with `CLIENT_APP_ANDROID` replaced with `CLIENT_APP_FIREFOX` when on Firefox desktop', () => {
      const pathname = `/en-US/${CLIENT_APP_ANDROID}/addon/slug/`;
      const search = '?src=featured';

      expect(
        _correctedLocationForPlatform({
          clientApp: CLIENT_APP_ANDROID,
          location: createFakeLocation({ pathname, search }),
          userAgentInfo: UAParser(userAgentsByPlatform.mac.firefox136),
        }),
      ).toEqual(`/en-US/${CLIENT_APP_FIREFOX}/addon/slug/${search}`);
    });

    it('defaults isHomePage to `false`', () => {
      // This is the same test as above, but without passing an explicit
      // `isHomePage` (which is included in _correctedLocationForPlatform).
      const pathname = `/en-US/${CLIENT_APP_ANDROID}/addon/slug/`;
      const search = '?src=featured';

      expect(
        correctedLocationForPlatform({
          clientApp: CLIENT_APP_ANDROID,
          lang: 'en-US',
          location: createFakeLocation({ pathname, search }),
          userAgentInfo: UAParser(userAgentsByPlatform.mac.firefox136),
        }),
      ).toEqual(`/en-US/${CLIENT_APP_FIREFOX}/addon/slug/${search}`);
    });

    it('maintains the word `android` in a slug for an add-on when switching platforms', () => {
      const pathname = `/en-US/${CLIENT_APP_ANDROID}/addon/awesome-android-extension/`;

      expect(
        _correctedLocationForPlatform({
          clientApp: CLIENT_APP_ANDROID,
          location: createFakeLocation({ pathname }),
          userAgentInfo: UAParser(userAgentsByPlatform.mac.firefox136),
        }),
      ).toEqual(
        `/en-US/${CLIENT_APP_FIREFOX}/addon/awesome-android-extension/`,
      );
    });

    it('returns null if clientApp is `CLIENT_APP_FIREFOX` on desktop', () => {
      expect(
        _correctedLocationForPlatform({
          clientApp: CLIENT_APP_FIREFOX,
          userAgentInfo: UAParser(userAgentsByPlatform.mac.firefox136),
        }),
      ).toEqual(null);
    });
  });

  describe('getMobileHomepageLink', () => {
    it('uses the lang and CLIENT_APP_ANDROID to build the link', () => {
      const lang = 'fr';
      expect(getMobileHomepageLink(lang)).toEqual(
        `/${lang}/${CLIENT_APP_ANDROID}/`,
      );
    });
  });

  describe('isFirefoxForAndroid', () => {
    it('returns false for Android/webkit', () => {
      userAgents.androidWebkit.forEach((userAgent) => {
        expect(isFirefoxForAndroid(UAParser(userAgent))).toEqual(false);
      });
    });

    it('returns false for Chrome Android', () => {
      userAgents.chromeAndroid.forEach((userAgent) => {
        expect(isFirefoxForAndroid(UAParser(userAgent))).toEqual(false);
      });
    });

    it('returns false for Chrome desktop', () => {
      userAgents.chrome.forEach((userAgent) => {
        expect(isFirefoxForAndroid(UAParser(userAgent))).toEqual(false);
      });
    });

    it('returns false for Firefox desktop', () => {
      userAgents.firefox.forEach((userAgent) => {
        expect(isFirefoxForAndroid(UAParser(userAgent))).toEqual(false);
      });
    });

    it('returns true for Firefox Android', () => {
      userAgents.firefoxAndroid.forEach((userAgent) => {
        expect(isFirefoxForAndroid(UAParser(userAgent))).toEqual(true);
      });
    });

    it('returns false for Firefox OS', () => {
      userAgents.firefoxOS.forEach((userAgent) => {
        expect(isFirefoxForAndroid(UAParser(userAgent))).toEqual(false);
      });
    });

    it('returns false for Firefox iOS', () => {
      userAgents.firefoxIOS.forEach((userAgent) => {
        expect(isFirefoxForAndroid(UAParser(userAgent))).toEqual(false);
      });
    });
  });

  describe('isFirefoxForIOS', () => {
    it('returns false for Android/webkit', () => {
      userAgents.androidWebkit.forEach((userAgent) => {
        expect(isFirefoxForIOS(UAParser(userAgent))).toEqual(false);
      });
    });

    it('returns false for Chrome Android', () => {
      userAgents.chromeAndroid.forEach((userAgent) => {
        expect(isFirefoxForIOS(UAParser(userAgent))).toEqual(false);
      });
    });

    it('returns false for Chrome desktop', () => {
      userAgents.chrome.forEach((userAgent) => {
        expect(isFirefoxForIOS(UAParser(userAgent))).toEqual(false);
      });
    });

    it('returns false for Firefox desktop', () => {
      userAgents.firefox.forEach((userAgent) => {
        expect(isFirefoxForIOS(UAParser(userAgent))).toEqual(false);
      });
    });

    it('returns false for Firefox Android', () => {
      userAgents.firefoxAndroid.forEach((userAgent) => {
        expect(isFirefoxForIOS(UAParser(userAgent))).toEqual(false);
      });
    });

    it('returns false for Firefox OS', () => {
      userAgents.firefoxOS.forEach((userAgent) => {
        expect(isFirefoxForIOS(UAParser(userAgent))).toEqual(false);
      });
    });

    it('returns true for Firefox iOS', () => {
      userAgents.firefoxIOS.forEach((userAgent) => {
        expect(isFirefoxForIOS(UAParser(userAgent))).toEqual(true);
      });
    });
  });

  describe('isAndroidInstallable', () => {
    it('returns true if the add-on is recommended on android', () => {
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        promoted: { category: RECOMMENDED, apps: [CLIENT_APP_ANDROID] },
      });

      expect(isAndroidInstallable({ addon })).toEqual(true);
    });

    it('returns true if the add-on is recommended on android and desktop', () => {
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        promoted: {
          category: RECOMMENDED,
          apps: [CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX],
        },
      });

      expect(isAndroidInstallable({ addon })).toEqual(true);
    });

    it.each(validAddonTypes.filter((type) => type !== ADDON_TYPE_EXTENSION))(
      'returns false for a %s, even if the add-on is recommended on android',
      (type) => {
        const addon = createInternalAddonWithLang({
          ...fakeAddon,
          promoted: { category: RECOMMENDED, apps: [CLIENT_APP_ANDROID] },
          type,
        });

        expect(isAndroidInstallable({ addon })).toEqual(false);
      },
    );

    it.each(
      ALL_PROMOTED_CATEGORIES.filter((category) => category !== RECOMMENDED),
    )('returns true when the add-on is %s on android', (category) => {
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        promoted: { category, apps: [CLIENT_APP_ANDROID] },
      });

      expect(isAndroidInstallable({ addon })).toEqual(true);
    });

    it('returns true when add-on is not promoted', () => {
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        promoted: null,
      });

      expect(isAndroidInstallable({ addon })).toEqual(true);
    });

    it('returns false if addon is null', () => {
      expect(isAndroidInstallable({ addon: null })).toEqual(false);
    });
  });
});
