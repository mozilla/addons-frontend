import { oneLine } from 'common-tags';
import UAParser from 'ua-parser-js';

import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  INCOMPATIBLE_FIREFOX_FOR_IOS,
  INCOMPATIBLE_NO_OPENSEARCH,
  INCOMPATIBLE_NOT_FIREFOX,
  INCOMPATIBLE_OVER_MAX_VERSION,
  INCOMPATIBLE_UNDER_MIN_VERSION,
  INCOMPATIBLE_UNSUPPORTED_PLATFORM,
  OS_ALL,
  OS_ANDROID,
  OS_LINUX,
  OS_MAC,
  OS_WINDOWS,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import {
  FACEBOOK_CONTAINER_ADDON_GUID,
  FACEBOOK_CONTAINER_DOWNLOAD_URL,
  getCompatibleVersions,
  getClientCompatibility,
  isCompatibleWithUserAgent,
  isQuantumCompatible,
} from 'core/utils/compatibility';
import {
  createFakeAddon,
  fakeAddon,
} from 'tests/unit/amo/helpers';
import {
  createFakeMozWindow,
  userAgents,
  userAgentsByPlatform,
} from 'tests/unit/helpers';


describe(__filename, () => {
  describe('isCompatibleWithUserAgent', () => {
    it('should throw if no userAgentInfo supplied', () => {
      expect(() => {
        isCompatibleWithUserAgent({ userAgent: null, reason: null });
      }).toThrowError('userAgentInfo is required');
    });

    it('is incompatible with Android/webkit', () => {
      userAgents.androidWebkit.forEach((userAgent) => {
        expect(isCompatibleWithUserAgent({ userAgentInfo: UAParser(userAgent) }))
          .toEqual({ compatible: false, reason: INCOMPATIBLE_NOT_FIREFOX });
      });
    });

    it('is incompatible with Chrome Android', () => {
      userAgents.chromeAndroid.forEach((userAgent) => {
        expect(isCompatibleWithUserAgent({ userAgentInfo: UAParser(userAgent) }))
          .toEqual({ compatible: false, reason: INCOMPATIBLE_NOT_FIREFOX });
      });
    });

    it('is incompatible with Chrome desktop', () => {
      userAgents.chrome.forEach((userAgent) => {
        expect(isCompatibleWithUserAgent({ userAgentInfo: UAParser(userAgent) }))
          .toEqual({ compatible: false, reason: INCOMPATIBLE_NOT_FIREFOX });
      });
    });

    it('is compatible with Firefox desktop', () => {
      userAgents.firefox.forEach((userAgent) => {
        expect(isCompatibleWithUserAgent({
          addon: createInternalAddon(fakeAddon),
          userAgentInfo: UAParser(userAgent),
        }))
          .toEqual({ compatible: true, reason: null });
      });
    });

    it('is compatible with Firefox Android', () => {
      userAgents.firefoxAndroid.forEach((userAgent) => {
        expect(isCompatibleWithUserAgent({
          addon: createInternalAddon(fakeAddon),
          userAgentInfo: UAParser(userAgent),
        }))
          .toEqual({ compatible: true, reason: null });
      });
    });

    it('is compatible with Firefox OS', () => {
      userAgents.firefoxOS.forEach((userAgent) => {
        expect(isCompatibleWithUserAgent({
          addon: createInternalAddon(fakeAddon),
          userAgentInfo: UAParser(userAgent),
        }))
          .toEqual({ compatible: true, reason: null });
      });
    });

    it('is incompatible with Firefox iOS', () => {
      userAgents.firefoxIOS.forEach((userAgent) => {
        expect(isCompatibleWithUserAgent({
          addon: createInternalAddon(fakeAddon),
          userAgentInfo: UAParser(userAgent),
        }))
          .toEqual({ compatible: false, reason: INCOMPATIBLE_FIREFOX_FOR_IOS });
      });
    });

    it(oneLine`should use a Firefox for iOS reason code even if minVersion is
      also not met`, () => {
        const userAgentInfo = {
          browser: { name: 'Firefox', version: '8.0' },
          os: { name: 'iOS' },
        };
        expect(isCompatibleWithUserAgent({
          addon: createInternalAddon(fakeAddon),
          minVersion: '9.0',
          userAgentInfo,
        }))
          .toEqual({ compatible: false, reason: INCOMPATIBLE_FIREFOX_FOR_IOS });
      });

    it('should mark Firefox without window.external as incompatible', () => {
      const userAgentInfo = {
        browser: { name: 'Firefox' },
        os: { name: 'Windows' },
      };
      const fakeOpenSearchAddon = createInternalAddon({
        ...fakeAddon, type: ADDON_TYPE_OPENSEARCH,
      });
      const fakeWindow = {};

      expect(isCompatibleWithUserAgent({
        _window: fakeWindow, addon: fakeOpenSearchAddon, userAgentInfo }))
        .toEqual({ compatible: false, reason: INCOMPATIBLE_NO_OPENSEARCH });
    });

    it('should mark Firefox without OpenSearch support as incompatible', () => {
      const userAgentInfo = {
        browser: { name: 'Firefox' },
        os: { name: 'Windows' },
      };
      const fakeOpenSearchAddon = createInternalAddon({
        ...fakeAddon, type: ADDON_TYPE_OPENSEARCH,
      });
      const fakeWindow = { external: {} };

      expect(isCompatibleWithUserAgent({
        _window: fakeWindow, addon: fakeOpenSearchAddon, userAgentInfo }))
        .toEqual({ compatible: false, reason: INCOMPATIBLE_NO_OPENSEARCH });
    });

    it('should mark Firefox with OpenSearch support as compatible', () => {
      const userAgentInfo = {
        browser: { name: 'Firefox' },
        os: { name: 'Windows' },
      };
      const fakeOpenSearchAddon = createInternalAddon({
        ...fakeAddon, type: ADDON_TYPE_OPENSEARCH,
      });
      const fakeWindow = createFakeMozWindow();

      expect(isCompatibleWithUserAgent({
        _window: fakeWindow, addon: fakeOpenSearchAddon, userAgentInfo }))
        .toEqual({ compatible: true, reason: null });
    });

    it('should mark non-Firefox UAs as incompatible', () => {
      const userAgentInfo = { browser: { name: 'Chrome' } };
      expect(isCompatibleWithUserAgent({
        addon: createInternalAddon(fakeAddon), userAgentInfo,
      }))
        .toEqual({ compatible: false, reason: INCOMPATIBLE_NOT_FIREFOX });
    });

    it('should mark Firefox 10 as incompatible with a minVersion of 10.1', () => {
      const userAgentInfo = {
        browser: { name: 'Firefox', version: '10.0' },
        os: { name: 'Windows' },
      };
      expect(isCompatibleWithUserAgent({
        addon: createInternalAddon(fakeAddon),
        minVersion: '10.1',
        userAgentInfo,
      }))
        .toEqual({ compatible: false, reason: INCOMPATIBLE_UNDER_MIN_VERSION });
    });

    it('should mark Firefox 24 as compatible with a maxVersion of 8', () => {
      // https://github.com/mozilla/addons-frontend/issues/2074
      const userAgentInfo = {
        browser: { name: 'Firefox', version: '24.0' },
        os: { name: 'Windows' },
      };
      expect(isCompatibleWithUserAgent({
        addon: createInternalAddon({
          ...fakeAddon,
          current_version: {
            ...fakeAddon.current_version,
            is_strict_compatibility_enabled: false,
          },
        }),
        maxVersion: '8',
        userAgentInfo,
      })).toEqual({ compatible: true, reason: null });
    });

    it('should mark Firefox as compatible when no min or max version', () => {
      const userAgentInfo = {
        browser: { name: 'Firefox', version: '10.0' },
        os: { name: 'Windows' },
      };
      expect(isCompatibleWithUserAgent({
        addon: createInternalAddon(fakeAddon), userAgentInfo,
      }))
        .toEqual({ compatible: true, reason: null });
    });

    it('should mark Firefox as compatible with maxVersion of "*"', () => {
      // WebExtensions are marked as having a maxVersion of "*" by addons-server
      // if their manifests don't contain explicit version information.
      const userAgentInfo = {
        browser: { name: 'Firefox', version: '54.0' },
        os: { name: 'Windows' },
      };
      expect(isCompatibleWithUserAgent({
        addon: createInternalAddon(fakeAddon),
        maxVersion: '*',
        userAgentInfo,
      }))
        .toEqual({ compatible: true, reason: null });
    });

    it('should log warning when minVersion is "*"', () => {
      // Note that this should never happen as addons-server will mark a
      // WebExtension with no minVersion as having a minVersion of "48".
      // Still, we accept it (but it will log a warning).
      const fakeLog = { error: sinon.stub() };
      const userAgentInfo = {
        browser: { name: 'Firefox', version: '54.0' },
        os: { name: 'Windows' },
      };
      expect(isCompatibleWithUserAgent({
        _log: fakeLog,
        addon: createInternalAddon(fakeAddon),
        minVersion: '*',
        userAgentInfo,
      }))
        .toEqual({ compatible: false, reason: INCOMPATIBLE_UNDER_MIN_VERSION });
      expect(fakeLog.error.firstCall.args[0])
        .toContain('minVersion of "*" was passed to isCompatibleWithUserAgent()');
    });

    it('is incompatible with empty user agent values', () => {
      const userAgentInfo = { browser: { name: '' } };
      expect(isCompatibleWithUserAgent({
        addon: createInternalAddon(fakeAddon), userAgentInfo,
      }))
        .toEqual({ compatible: false, reason: INCOMPATIBLE_NOT_FIREFOX });
    });

    it('is incompatible with non-string user agent values', () => {
      const userAgentInfo = { browser: { name: null }, os: { name: null } };
      expect(isCompatibleWithUserAgent({
        addon: createInternalAddon(fakeAddon), userAgentInfo,
      }))
        .toEqual({ compatible: false, reason: INCOMPATIBLE_NOT_FIREFOX });
    });

    it('is incompatible if no matching platform file exists', () => {
      const addon = createInternalAddon({
        ...fakeAddon,
        current_version: {
          ...fakeAddon.current_version,
          files: [{
            ...fakeAddon.current_version.files[0],
            platform: OS_MAC,
          }],
        },
      });
      const userAgentInfo =
        UAParser(userAgentsByPlatform.windows.firefox40);

      expect(isCompatibleWithUserAgent({ addon, userAgentInfo }))
        .toEqual({
          compatible: false,
          reason: INCOMPATIBLE_UNSUPPORTED_PLATFORM,
        });
    });

    it('allows non-extensions to have mismatching platform files', () => {
      const addon = createInternalAddon({
        ...fakeAddon,
        current_version: {
          ...fakeAddon.current_version,
          files: [{
            ...fakeAddon.current_version.files[0],
            platform: OS_MAC,
          }],
        },
        type: ADDON_TYPE_THEME,
      });
      const userAgentInfo =
        UAParser(userAgentsByPlatform.windows.firefox40);

      expect(isCompatibleWithUserAgent({ addon, userAgentInfo }))
        .toMatchObject({ compatible: true });
    });
  });

  describe('getCompatibleVersions', () => {
    it('gets the min and max versions', () => {
      const addon = createInternalAddon({
        ...fakeAddon,
        current_version: {
          ...fakeAddon.current_version,
          compatibility: {
            firefox: {
              max: '20.0.*',
              min: '11.0.1',
            },
          },
        },
      });
      const { maxVersion, minVersion } = getCompatibleVersions({
        addon, clientApp: CLIENT_APP_FIREFOX });

      expect(maxVersion).toEqual('20.0.*');
      expect(minVersion).toEqual('11.0.1');
    });

    it('gets null if the clientApp does not match', () => {
      const addon = createInternalAddon({
        ...fakeAddon,
        current_version: {
          ...fakeAddon.current_version,
          compatibility: {
            firefox: {
              max: '20.0.*',
              min: '11.0.1',
            },
          },
        },
      });
      const { maxVersion, minVersion } = getCompatibleVersions({
        addon, clientApp: CLIENT_APP_ANDROID });

      expect(maxVersion).toEqual(null);
      expect(minVersion).toEqual(null);
    });

    it('returns null if clientApp has no compatibility', () => {
      const addon = createInternalAddon({
        ...fakeAddon,
        current_version: {
          ...fakeAddon.current_version,
          compatibility: {},
        },
      });
      const { maxVersion, minVersion } = getCompatibleVersions({
        addon, clientApp: CLIENT_APP_FIREFOX });

      expect(maxVersion).toEqual(null);
      expect(minVersion).toEqual(null);
    });

    it('returns null if current_version does not exist', () => {
      const addon = createInternalAddon({
        ...fakeAddon,
        current_version: null,
      });
      const { maxVersion, minVersion } = getCompatibleVersions({
        addon, clientApp: CLIENT_APP_FIREFOX });

      expect(maxVersion).toEqual(null);
      expect(minVersion).toEqual(null);
    });

    it('returns null if addon is null', () => {
      const { maxVersion, minVersion } = getCompatibleVersions({
        addon: null, clientApp: CLIENT_APP_FIREFOX });

      expect(maxVersion).toEqual(null);
      expect(minVersion).toEqual(null);
    });

    it('marks clientApp as unsupported without compatibility', () => {
      const addon = createInternalAddon({
        ...fakeAddon,
        current_version: {
          ...fakeAddon.current_version,
          // This add-on is not compatible with any client apps.
          compatibility: {},
        },
        type: ADDON_TYPE_EXTENSION,
      });
      const { supportsClientApp } = getCompatibleVersions({
        addon, clientApp: CLIENT_APP_FIREFOX,
      });

      expect(supportsClientApp).toEqual(false);
    });

    it('marks clientApp as supported with compatibility', () => {
      const clientApp = CLIENT_APP_ANDROID;
      const addon = createInternalAddon({
        ...fakeAddon,
        current_version: {
          ...fakeAddon.current_version,
          compatibility: {
            [clientApp]: {
              min: '48.0',
              max: '*',
            },
          },
        },
        type: ADDON_TYPE_EXTENSION,
      });
      const { supportsClientApp } = getCompatibleVersions({
        addon, clientApp,
      });

      expect(supportsClientApp).toEqual(true);
    });
  });

  describe('getClientCompatibility', () => {
    it('returns true for Firefox (reason undefined when compatibile)', () => {
      const {
        browser, os,
      } = UAParser(userAgentsByPlatform.mac.firefox57);
      const userAgentInfo = { browser, os };
      const clientApp = CLIENT_APP_FIREFOX;
      const addon = createInternalAddon({
        ...fakeAddon,
        current_version: {
          ...fakeAddon.current_version,
          compatibility: {
            [clientApp]: {
              min: '48.0',
              max: '*',
            },
          },
        },
      });

      expect(getClientCompatibility({
        addon,
        clientApp,
        userAgentInfo,
      })).toEqual({
        compatible: true,
        maxVersion: addon.current_version.compatibility[clientApp].max,
        minVersion: addon.current_version.compatibility[clientApp].min,
        reason: null,
      });
    });

    it('returns maxVersion when set', () => {
      const { browser, os } = UAParser(userAgents.firefox[0]);
      const userAgentInfo = { browser, os };

      expect(getClientCompatibility({
        addon: createInternalAddon({
          ...fakeAddon,
          current_version: {
            ...fakeAddon.current_version,
            compatibility: {
              firefox: { max: '200.0', min: null },
            },
          },
        }),
        clientApp: CLIENT_APP_FIREFOX,
        userAgentInfo,
      })).toEqual({
        compatible: true,
        maxVersion: '200.0',
        minVersion: null,
        reason: null,
      });
    });

    it('returns minVersion when set', () => {
      const { browser, os } = UAParser(userAgents.firefox[0]);
      const userAgentInfo = { browser, os };

      expect(getClientCompatibility({
        addon: createInternalAddon({
          ...fakeAddon,
          current_version: {
            ...fakeAddon.current_version,
            compatibility: {
              firefox: { max: null, min: '2.0' },
            },
          },
        }),
        clientApp: CLIENT_APP_FIREFOX,
        userAgentInfo,
      })).toEqual({
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
      const addon = createInternalAddon({
        ...fakeAddon,
        current_version: {
          ...fakeAddon.current_version,
          compatibility: {
            [clientApp]: {
              min: '*',
              max: '57.0',
            },
          },
        },
      });

      expect(getClientCompatibility({
        addon,
        clientApp,
        userAgentInfo,
      })).toEqual({
        compatible: false,
        maxVersion: addon.current_version.compatibility[clientApp].max,
        minVersion: addon.current_version.compatibility[clientApp].min,
        reason: INCOMPATIBLE_NOT_FIREFOX,
      });
    });

    it('returns a special-case downloadUrl for Facebook Container', () => {
      const { browser, os } = UAParser(userAgentsByPlatform.mac.chrome41);
      const userAgentInfo = { browser, os };
      const clientApp = CLIENT_APP_FIREFOX;
      const addon = createInternalAddon({
        ...fakeAddon,
        guid: FACEBOOK_CONTAINER_ADDON_GUID,
      });

      expect(getClientCompatibility({
        addon,
        clientApp,
        userAgentInfo,
      })).toEqual({
        compatible: false,
        downloadUrl: FACEBOOK_CONTAINER_DOWNLOAD_URL,
        maxVersion: addon.current_version.compatibility[clientApp].max,
        minVersion: addon.current_version.compatibility[clientApp].min,
        reason: INCOMPATIBLE_NOT_FIREFOX,
      });
    });

    it('returns compatible if strict compatibility is off', () => {
      const { browser, os } = UAParser(userAgents.firefox[4]);
      const userAgentInfo = { browser, os };

      expect(getClientCompatibility({
        addon: createInternalAddon({
          ...fakeAddon,
          current_version: {
            ...fakeAddon.current_version,
            compatibility: {
              ...fakeAddon.current_version.compatibility,
              [CLIENT_APP_FIREFOX]: {
                max: '56.*',
                min: '24.0',
              },
            },
            files: [{
              ...fakeAddon.current_version.files[0],
              is_webextension: true,
            }],
            is_strict_compatibility_enabled: false,
          },
        }),
        clientApp: CLIENT_APP_FIREFOX,
        userAgentInfo,
      })).toMatchObject({ compatible: true });
    });

    it('returns incompatible if strict compatibility enabled', () => {
      const { browser, os } = UAParser(userAgents.firefox[5]);
      const userAgentInfo = { browser, os };

      expect(getClientCompatibility({
        addon: createInternalAddon({
          ...fakeAddon,
          current_version: {
            ...fakeAddon.current_version,
            compatibility: {
              ...fakeAddon.current_version.compatibility,
              [CLIENT_APP_FIREFOX]: {
                max: '56.*',
                min: '24.0',
              },
            },
            files: [{
              ...fakeAddon.current_version.files[0],
              is_webextension: false,
            }],
            is_strict_compatibility_enabled: true,
          },
        }),
        clientApp: CLIENT_APP_FIREFOX,
        userAgentInfo,
      })).toMatchObject({
        compatible: false,
        reason: INCOMPATIBLE_OVER_MAX_VERSION,
      });
    });

    it('returns incompatible when add-on does not support client app', () => {
      const {
        browser, os,
      } = UAParser(userAgentsByPlatform.mac.firefox57);
      const userAgentInfo = { browser, os };
      const addon = createInternalAddon({
        ...fakeAddon,
        current_version: {
          ...fakeAddon.current_version,
          // The clientApp is not supported:
          compatibility: {},
        },
      });

      expect(getClientCompatibility({
        addon,
        clientApp: CLIENT_APP_FIREFOX,
        userAgentInfo,
      })).toEqual({
        compatible: false,
        maxVersion: null,
        minVersion: null,
        reason: INCOMPATIBLE_UNSUPPORTED_PLATFORM,
      });
    });
  });

  describe('isQuantumCompatible', () => {
    it('returns `true` when webextension is compatible', () => {
      const addon = createInternalAddon(createFakeAddon({
        files: [{
          is_mozilla_signed_extension: false,
          is_webextension: true,
          platform: OS_ALL,
        }],
        name: 'Some Quantum WebExtension',
        compatibility: {
          [CLIENT_APP_FIREFOX]: {
            max: '*',
            min: '53.0',
          },
        },
        is_strict_compatibility_enabled: false,
      }));

      expect(isQuantumCompatible({ addon })).toEqual(true);
    });

    it('returns `true` when mozilla extension is compatible', () => {
      const addon = createInternalAddon(createFakeAddon({
        files: [{
          is_mozilla_signed_extension: true,
          is_webextension: false,
          platform: OS_ALL,
        }],
        name: 'Firefox Multi-Account Containers',
        compatibility: {
          [CLIENT_APP_FIREFOX]: {
            max: '*',
            min: '53.0',
          },
        },
        is_strict_compatibility_enabled: false,
      }));

      expect(isQuantumCompatible({ addon })).toEqual(true);
    });

    it('returns `true` for windows-only mozilla extensions', () => {
      const addon = createInternalAddon(createFakeAddon({
        files: [{
          is_mozilla_signed_extension: true,
          is_webextension: false,
          platform: OS_WINDOWS,
        }],
        name: 'Windows only mozilla extension',
        compatibility: {
          [CLIENT_APP_FIREFOX]: {
            max: '*',
            min: '53.0',
          },
        },
        is_strict_compatibility_enabled: false,
      }));

      expect(isQuantumCompatible({ addon })).toEqual(true);
    });

    it('returns `true` for linux-only mozilla extensions', () => {
      const addon = createInternalAddon(createFakeAddon({
        files: [{
          is_mozilla_signed_extension: true,
          is_webextension: false,
          platform: OS_LINUX,
        }],
        name: 'Linux only mozilla extension',
        compatibility: {
          [CLIENT_APP_FIREFOX]: {
            max: '*',
            min: '53.0',
          },
        },
        is_strict_compatibility_enabled: false,
      }));

      expect(isQuantumCompatible({ addon })).toEqual(true);
    });

    it('returns `false` when non-webextesion is not compatible', () => {
      const addon = createInternalAddon(createFakeAddon({
        files: [{
          is_mozilla_signed_extension: false,
          is_webextension: false,
          platform: OS_ALL,
        }],
        name: 'Firebug',
        compatibility: {
          [CLIENT_APP_FIREFOX]: {
            max: '56.*',
            min: '30.0a1',
          },
        },
        is_strict_compatibility_enabled: true,
      }));

      expect(isQuantumCompatible({ addon })).toEqual(false);
    });

    it('returns `false` for add-ons without a current version', () => {
      const addon = createInternalAddon(createFakeAddon({
        current_version: null,
      }));

      expect(isQuantumCompatible({ addon })).toEqual(false);
    });

    it('returns `true` when Android webextension is compatible', () => {
      const addon = createInternalAddon(createFakeAddon({
        files: [{
          is_webextension: true,
          platform: OS_ANDROID,
        }],
        compatibility: {
          // This platform is not compatible...
          [CLIENT_APP_FIREFOX]: {
            max: '56.*',
            min: '30.0a1',
          },
          // ...but this platform is compatible.
          [CLIENT_APP_ANDROID]: {
            max: '57.0',
            min: '53.0',
          },
        },
        is_strict_compatibility_enabled: true,
      }));

      expect(isQuantumCompatible({ addon })).toEqual(true);
    });
  });
});
