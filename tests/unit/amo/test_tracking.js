/* global window */
import {
  Tracking,
  isDoNotTrackEnabled,
  getAddonEventCategory,
  getAddonNameParam,
  getAddonEventParams,
} from 'amo/tracking';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  CLICK_CATEGORY,
  ENABLE_ACTION,
  ENABLE_EXTENSION_CATEGORY,
  ENABLE_THEME_CATEGORY,
  INSTALL_CANCELLED_ACTION,
  INSTALL_CANCELLED_EXTENSION_CATEGORY,
  INSTALL_CANCELLED_THEME_CATEGORY,
  INSTALL_DOWNLOAD_FAILED_ACTION,
  INSTALL_DOWNLOAD_FAILED_EXTENSION_CATEGORY,
  INSTALL_DOWNLOAD_FAILED_THEME_CATEGORY,
  INSTALL_EXTENSION_CATEGORY,
  INSTALL_STARTED_ACTION,
  INSTALL_STARTED_EXTENSION_CATEGORY,
  INSTALL_STARTED_THEME_CATEGORY,
  INSTALL_THEME_CATEGORY,
  UNINSTALL_ACTION,
  UNINSTALL_EXTENSION_CATEGORY,
  UNINSTALL_THEME_CATEGORY,
} from 'amo/constants';
import {
  fakeTrackingEvent,
  getFakeConfig,
  getFakeLoggerWithJest as getFakeLogger,
} from 'tests/unit/helpers';

const gtmContainerId = 'GTM-WVHFHF6';

function createTracking({ paramOverrides = {}, configOverrides = {} } = {}) {
  return new Tracking({
    _isDoNotTrackEnabled: () => false,
    _config: getFakeConfig({
      gtmContainerId,
      server: false,
      trackingEnabled: true,
      ...configOverrides,
    }),
    ...paramOverrides,
  });
}

describe(__filename, () => {
  describe('Tracking', () => {
    beforeEach(() => {
      window.dataLayer = [];
    });

    it('should not enable tracking when configured off', () => {
      createTracking({
        configOverrides: { trackingEnabled: false },
      });
      expect(window.dataLayer).toEqual([]);
    });

    it('should disable tracking due to missing gtmContainerId', () => {
      createTracking({
        configOverrides: { gtmContainerId: null },
        paramOverrides: {
          _isDoNotTrackEnabled: () => false,
        },
      });
      expect(window.dataLayer).toEqual([]);
    });

    it('should disable tracking due to Do Not Track', () => {
      createTracking({
        paramOverrides: {
          _isDoNotTrackEnabled: () => true,
        },
      });
      expect(window.dataLayer).toEqual([]);
    });

    it('should initialize window.dataLayer when enabled', () => {
      createTracking();
      // dataLayer should be initialized (it may be [] or an existing array)
      expect(window.dataLayer).toBeDefined();
      expect(Array.isArray(window.dataLayer)).toBe(true);
    });

    it('should push gtm.start bootstrap event to dataLayer when enabled', () => {
      const startTime = Date.now();
      createTracking();
      expect(window.dataLayer).toHaveLength(1);
      expect(window.dataLayer[0]).toMatchObject({ event: 'gtm.js' });
      expect(window.dataLayer[0]['gtm.start']).toBeGreaterThanOrEqual(
        startTime,
      );
      expect(window.dataLayer[0]['gtm.start']).toBeLessThanOrEqual(Date.now());
    });

    it('should not push a duplicate gtm.js event when a second Tracking instance is created', () => {
      createTracking();
      expect(window.dataLayer).toHaveLength(1);

      // Create a second instance — should NOT push another gtm.js event.
      createTracking();
      expect(window.dataLayer).toHaveLength(1);
      expect(window.dataLayer.filter((e) => e.event === 'gtm.js')).toHaveLength(
        1,
      );
    });

    it('should not push gtm.start when tracking is disabled', () => {
      createTracking({
        configOverrides: { trackingEnabled: false },
      });
      expect(window.dataLayer).toEqual([]);
    });

    describe('sendEvent', () => {
      it('should not send events when tracking is configured off', () => {
        const _config = getFakeConfig({ server: false });
        const tracking = createTracking({
          configOverrides: { trackingEnabled: false },
        });
        tracking.sendEvent({
          _config,
          category: 'whatever',
        });
        expect(window.dataLayer).toEqual([]);
      });

      it('should throw if category not set', () => {
        const tracking = createTracking();
        expect(() => {
          tracking.sendEvent({});
        }).toThrow(/category is required/);
      });

      it('should push event data to dataLayer on the client', () => {
        const _config = getFakeConfig({ server: false });
        const event = fakeTrackingEvent;
        const tracking = createTracking();
        tracking.sendEvent({
          _config,
          ...event,
        });
        expect(window.dataLayer).toContainEqual({
          event: event.category,
          ...event.params,
        });
      });

      it('should push event with no params when params not provided', () => {
        const _config = getFakeConfig({ server: false });
        const tracking = createTracking();
        tracking.sendEvent({
          _config,
          category: 'some_event',
        });
        expect(window.dataLayer).toContainEqual({
          event: 'some_event',
        });
      });

      it('should push two events to dataLayer when sendSecondEventWithOverrides is passed', () => {
        const _config = getFakeConfig({ server: false });
        const event = fakeTrackingEvent;
        const secondCategory = 'second-category';
        const sendSecondEventWithOverrides = { category: secondCategory };
        const tracking = createTracking();
        tracking.sendEvent({
          _config,
          sendSecondEventWithOverrides,
          ...event,
        });
        expect(window.dataLayer).toContainEqual({
          event: event.category,
          ...event.params,
        });
        expect(window.dataLayer).toContainEqual({
          event: secondCategory,
          ...event.params,
        });
        // 3 entries: gtm.start bootstrap + 2 sendEvent pushes
        expect(window.dataLayer).toHaveLength(3);
      });

      it('should merge params from sendSecondEventWithOverrides', () => {
        const _config = getFakeConfig({ server: false });
        const tracking = createTracking();
        const params = { extension_name: 'My Addon', author: 'Some Author' };
        const secondParams = { author: 'Override Author' };
        tracking.sendEvent({
          _config,
          category: 'first_category',
          params,
          sendSecondEventWithOverrides: {
            category: 'second_category',
            params: secondParams,
          },
        });
        expect(window.dataLayer).toContainEqual({
          event: 'first_category',
          ...params,
        });
        expect(window.dataLayer).toContainEqual({
          event: 'second_category',
          ...params,
          ...secondParams,
        });
      });

      it('should use original category when sendSecondEventWithOverrides has no category', () => {
        const _config = getFakeConfig({ server: false });
        const tracking = createTracking();
        tracking.sendEvent({
          _config,
          category: 'original_category',
          params: { extension_name: 'Test' },
          sendSecondEventWithOverrides: {
            params: { extra: 'param' },
          },
        });
        // Index 0 is gtm.start bootstrap, index 1 is first event, index 2 is second
        expect(window.dataLayer[2]).toEqual({
          event: 'original_category',
          extension_name: 'Test',
          extra: 'param',
        });
      });

      it('should throw an error if called on the server', () => {
        const _config = getFakeConfig({ server: true });
        const tracking = createTracking();
        expect(() => {
          tracking.sendEvent({
            _config,
            ...fakeTrackingEvent,
          });
        }).toThrow('sendEvent: cannot send tracking events on the server');
      });
    });

    describe('setUserProperties', () => {
      it('should push user properties to dataLayer', () => {
        const tracking = createTracking();
        const props = { prop1: 'value1', prop2: 'value2' };

        tracking.setUserProperties(props);

        expect(window.dataLayer).toContainEqual({
          event: 'set_user_properties',
          user_properties: props,
        });
      });
    });
  });

  describe('getAddonNameParam', () => {
    it('returns extension_name for an extension type', () => {
      const addon = { name: 'My Extension', type: ADDON_TYPE_EXTENSION };
      expect(getAddonNameParam(addon)).toEqual({
        extension_name: 'My Extension',
      });
    });

    it('returns theme_name for a static theme type', () => {
      const addon = { name: 'My Theme', type: ADDON_TYPE_STATIC_THEME };
      expect(getAddonNameParam(addon)).toEqual({ theme_name: 'My Theme' });
    });
  });

  describe('getAddonEventParams', () => {
    it('returns extension_name and author for an extension with authors', () => {
      const addon = {
        name: 'My Extension',
        type: ADDON_TYPE_EXTENSION,
        authors: [{ name: 'Author One' }],
      };
      expect(getAddonEventParams(addon)).toEqual({
        extension_name: 'My Extension',
        author: 'Author One',
      });
    });

    it('returns theme_name and author for a theme with authors', () => {
      const addon = {
        name: 'My Theme',
        type: ADDON_TYPE_STATIC_THEME,
        authors: [{ name: 'Theme Author' }],
      };
      expect(getAddonEventParams(addon)).toEqual({
        theme_name: 'My Theme',
        author: 'Theme Author',
      });
    });

    it('does not include author when authors array is empty', () => {
      const addon = {
        name: 'My Extension',
        type: ADDON_TYPE_EXTENSION,
        authors: [],
      };
      expect(getAddonEventParams(addon)).toEqual({
        extension_name: 'My Extension',
      });
    });

    it('does not include author when authors is undefined', () => {
      const addon = {
        name: 'My Extension',
        type: ADDON_TYPE_EXTENSION,
      };
      expect(getAddonEventParams(addon)).toEqual({
        extension_name: 'My Extension',
      });
    });

    it('includes page_path when pagePath is provided', () => {
      const addon = {
        name: 'My Extension',
        type: ADDON_TYPE_EXTENSION,
        authors: [{ name: 'Author One' }],
      };
      expect(
        getAddonEventParams(addon, '/en-US/firefox/addon/my-ext/'),
      ).toEqual({
        extension_name: 'My Extension',
        author: 'Author One',
        page_path: '/en-US/firefox/addon/my-ext/',
      });
    });

    it('does not include page_path when pagePath is not provided', () => {
      const addon = {
        name: 'My Extension',
        type: ADDON_TYPE_EXTENSION,
        authors: [{ name: 'Author One' }],
      };
      const result = getAddonEventParams(addon);
      expect(result).not.toHaveProperty('page_path');
    });

    it('uses the first author when there are multiple authors', () => {
      const addon = {
        name: 'My Extension',
        type: ADDON_TYPE_EXTENSION,
        authors: [{ name: 'First Author' }, { name: 'Second Author' }],
      };
      expect(getAddonEventParams(addon)).toEqual({
        extension_name: 'My Extension',
        author: 'First Author',
      });
    });

    it('returns only page_path when addon is null and pagePath is provided', () => {
      expect(getAddonEventParams(null, '/some/path/')).toEqual({
        page_path: '/some/path/',
      });
    });

    it('returns an empty object when addon is null and pagePath is not provided', () => {
      expect(getAddonEventParams(null)).toEqual({});
    });

    it('returns an empty object when addon is undefined', () => {
      expect(getAddonEventParams(undefined)).toEqual({});
    });

    it('omits author when author name is undefined', () => {
      const addon = {
        name: 'My Extension',
        type: ADDON_TYPE_EXTENSION,
        authors: [{ name: undefined }],
      };
      expect(getAddonEventParams(addon)).toEqual({
        extension_name: 'My Extension',
      });
    });

    it('omits author when author name is an empty string', () => {
      const addon = {
        name: 'My Extension',
        type: ADDON_TYPE_EXTENSION,
        authors: [{ name: '' }],
      };
      expect(getAddonEventParams(addon)).toEqual({
        extension_name: 'My Extension',
      });
    });
  });

  describe('getAddonEventCategory', () => {
    it('returns the expected category when type is extension and installAction is install started', () => {
      expect(
        getAddonEventCategory(ADDON_TYPE_EXTENSION, INSTALL_STARTED_ACTION),
      ).toEqual(INSTALL_STARTED_EXTENSION_CATEGORY);
    });

    it('returns the expected category when type is static theme and installAction is install started', () => {
      expect(
        getAddonEventCategory(ADDON_TYPE_STATIC_THEME, INSTALL_STARTED_ACTION),
      ).toEqual(INSTALL_STARTED_THEME_CATEGORY);
    });

    it('returns the expected category when type is extension and installAction is uninstall', () => {
      expect(
        getAddonEventCategory(ADDON_TYPE_EXTENSION, UNINSTALL_ACTION),
      ).toEqual(UNINSTALL_EXTENSION_CATEGORY);
    });

    it('returns the expected category when type is static theme and installAction is uninstall started', () => {
      expect(
        getAddonEventCategory(ADDON_TYPE_STATIC_THEME, UNINSTALL_ACTION),
      ).toEqual(UNINSTALL_THEME_CATEGORY);
    });

    it('returns the expected category when type is extension and installAction is the default', () => {
      expect(
        getAddonEventCategory(ADDON_TYPE_EXTENSION, 'some-default-action'),
      ).toEqual(INSTALL_EXTENSION_CATEGORY);
    });

    it('returns the expected category when type is static theme and installAction is the default', () => {
      expect(
        getAddonEventCategory(ADDON_TYPE_STATIC_THEME, 'some-default-action'),
      ).toEqual(INSTALL_THEME_CATEGORY);
    });

    it('returns the expected category when type is extension and installAction is cancelled', () => {
      expect(
        getAddonEventCategory(ADDON_TYPE_EXTENSION, INSTALL_CANCELLED_ACTION),
      ).toEqual(INSTALL_CANCELLED_EXTENSION_CATEGORY);
    });

    it('returns the expected category when type is static theme and installAction is cancelled', () => {
      expect(
        getAddonEventCategory(
          ADDON_TYPE_STATIC_THEME,
          INSTALL_CANCELLED_ACTION,
        ),
      ).toEqual(INSTALL_CANCELLED_THEME_CATEGORY);
    });

    it('returns the expected category when type is extension and installAction is enable', () => {
      expect(
        getAddonEventCategory(ADDON_TYPE_EXTENSION, ENABLE_ACTION),
      ).toEqual(ENABLE_EXTENSION_CATEGORY);
    });

    it('returns the expected category when type is static theme and installAction is enable', () => {
      expect(
        getAddonEventCategory(ADDON_TYPE_STATIC_THEME, ENABLE_ACTION),
      ).toEqual(ENABLE_THEME_CATEGORY);
    });

    it('returns the expected category when type is extension and installAction is download failed', () => {
      expect(
        getAddonEventCategory(
          ADDON_TYPE_EXTENSION,
          INSTALL_DOWNLOAD_FAILED_ACTION,
        ),
      ).toEqual(INSTALL_DOWNLOAD_FAILED_EXTENSION_CATEGORY);
    });

    it('returns the expected category when type is static theme and installAction is download failed', () => {
      expect(
        getAddonEventCategory(
          ADDON_TYPE_STATIC_THEME,
          INSTALL_DOWNLOAD_FAILED_ACTION,
        ),
      ).toEqual(INSTALL_DOWNLOAD_FAILED_THEME_CATEGORY);
    });
  });

  describe('Do Not Track', () => {
    it('should respect DNT when enabled', () => {
      expect(
        isDoNotTrackEnabled({
          _navigator: { doNotTrack: '1' },
          _window: {},
        }),
      ).toBe(true);
      expect(
        isDoNotTrackEnabled({
          _navigator: {},
          _window: { doNotTrack: '1' },
        }),
      ).toBe(true);
    });

    it('should respect not enabled DNT', () => {
      expect(
        isDoNotTrackEnabled({
          _navigator: { doNotTrack: '0' },
          _window: {},
        }),
      ).toBe(false);
      expect(
        isDoNotTrackEnabled({
          _navigator: {},
          _window: { doNotTrack: '0' },
        }),
      ).toBe(false);
    });

    it('should treat unknown values as no DNT', () => {
      expect(
        isDoNotTrackEnabled({
          _navigator: { doNotTrack: 'leave me alone' },
          _window: {},
        }),
      ).toBe(false);
      expect(
        isDoNotTrackEnabled({
          _navigator: {},
          _window: { doNotTrack: 'leave me alone' },
        }),
      ).toBe(false);
    });

    it('should handle missing navigator and window', () => {
      expect(isDoNotTrackEnabled({ _navigator: null })).toBe(false);
      expect(isDoNotTrackEnabled({ _window: null })).toBe(false);
    });

    it('should log that DNT disabled tracking', () => {
      const fakeLog = getFakeLogger();
      isDoNotTrackEnabled({
        _log: fakeLog,
        _navigator: { doNotTrack: '1' },
        _window: {},
      });

      expect(fakeLog.info).toHaveBeenCalledWith('Do Not Track is enabled');

      // Check with `window.doNotTrack` as well, just for completeness.
      fakeLog.info.mockClear();
      isDoNotTrackEnabled({
        _log: fakeLog,
        _navigator: {},
        _window: { doNotTrack: '1' },
      });

      expect(fakeLog.info).toHaveBeenCalledWith('Do Not Track is enabled');
    });
  });

  describe('Tracking constants should not be changed or it risks breaking tracking stats', () => {
    it('should not change the tracking category constants for theme installs', () => {
      expect(INSTALL_THEME_CATEGORY).toEqual('amo_theme_installs_completed');
    });

    it('should not change the tracking category constants for extension installs', () => {
      expect(INSTALL_EXTENSION_CATEGORY).toEqual(
        'amo_addon_installs_completed',
      );
    });

    it('should not change the tracking category constants for starting theme installs', () => {
      expect(INSTALL_STARTED_THEME_CATEGORY).toEqual(
        'amo_theme_installs_started',
      );
    });

    it('should not change the tracking category constants for starting extension installs', () => {
      expect(INSTALL_STARTED_EXTENSION_CATEGORY).toEqual(
        'amo_addon_installs_started',
      );
    });

    it('should not change the tracking category constants for theme uninstalls', () => {
      expect(UNINSTALL_THEME_CATEGORY).toEqual('amo_theme_uninstalls');
    });

    it('should not change the tracking category constants for extension uninstalls', () => {
      expect(UNINSTALL_EXTENSION_CATEGORY).toEqual('amo_addon_uninstalls');
    });

    it('should not change the tracking category constants for clicks', () => {
      expect(CLICK_CATEGORY).toEqual('amo_addon_theme_clicks');
    });

    it('should not change the tracking action constant for install cancelled', () => {
      expect(INSTALL_CANCELLED_ACTION).toEqual('install_cancelled');
    });

    it('should not change the tracking action constant for install download failed', () => {
      expect(INSTALL_DOWNLOAD_FAILED_ACTION).toEqual('install_download_failed');
    });

    it('should not change the tracking action constant for install started', () => {
      expect(INSTALL_STARTED_ACTION).toEqual('install_started');
    });
  });
});
