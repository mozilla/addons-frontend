/* global window */
import {
  Tracking,
  isDoNotTrackEnabled,
  getAddonEventCategory,
  getAddonTypeForTracking,
} from 'core/tracking';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
  CLICK_CATEGORY,
  DISCO_NAVIGATION_CATEGORY,
  ENABLE_ACTION,
  ENABLE_EXTENSION_CATEGORY,
  ENABLE_THEME_CATEGORY,
  INSTALL_ACTION,
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
  TRACKING_TYPE_EXTENSION,
  TRACKING_TYPE_INVALID,
  TRACKING_TYPE_STATIC_THEME,
  TRACKING_TYPE_THEME,
  UNINSTALL_ACTION,
  UNINSTALL_EXTENSION_CATEGORY,
  UNINSTALL_THEME_CATEGORY,
} from 'core/constants';
import { getFakeConfig, getFakeLogger } from 'tests/unit/helpers';

function createTracking({ paramOverrides = {}, configOverrides = {} } = {}) {
  return new Tracking({
    _isDoNotTrackEnabled: () => false,
    _config: getFakeConfig({
      trackingEnabled: true,
      trackingId: 'sample-tracking-id',
      ...configOverrides,
    }),
    ...paramOverrides,
  });
}

describe(__filename, () => {
  describe('Tracking', () => {
    beforeEach(() => {
      window.ga = sinon.stub();
    });

    it('should not enable GA when configured off', () => {
      createTracking({
        configOverrides: { trackingEnabled: false },
      });
      sinon.assert.notCalled(window.ga);
    });

    it('should not send events when tracking is configured off', () => {
      const tracking = createTracking({
        configOverrides: { trackingEnabled: false },
      });
      tracking.sendEvent({
        category: 'whatever',
        action: 'some-action',
      });
      sinon.assert.notCalled(window.ga);
    });

    it('should disable GA due to missing id', () => {
      createTracking({
        configOverrides: { trackingId: null },
        paramOverrides: {
          _isDoNotTrackEnabled: () => false,
        },
      });
      sinon.assert.notCalled(window.ga);
    });

    it('should disable GA due to Do Not Track', () => {
      createTracking({
        paramOverrides: {
          _isDoNotTrackEnabled: () => true,
        },
      });
      sinon.assert.notCalled(window.ga);
    });

    it('should send initial page view when enabled', () => {
      createTracking({
        configOverrides: {
          trackingSendInitPageView: true,
        },
      });
      sinon.assert.calledWith(window.ga, 'send', 'pageview');
    });

    it('should set the transport mechanism to beacon', () => {
      createTracking();
      sinon.assert.calledWith(window.ga, 'set', 'transport', 'beacon');
    });

    it('should set dimension3', () => {
      createTracking();
      sinon.assert.calledWith(
        window.ga,
        'set',
        'dimension3',
        'addons-frontend',
      );
    });

    it('should not send initial page view when disabled', () => {
      createTracking({
        configOverrides: {
          trackingSendInitPageView: false,
        },
      });
      // Make sure only 'create' and 'set' were called, not 'send'.
      sinon.assert.calledWith(window.ga, 'create');
      sinon.assert.calledWith(window.ga, 'set', 'transport', 'beacon');
      sinon.assert.calledWith(
        window.ga,
        'set',
        'dimension3',
        'addons-frontend',
      );
      sinon.assert.callCount(window.ga, 3);
    });

    it('should throw if page not set', () => {
      const tracking = createTracking();
      expect(() => {
        tracking.setPage();
      }).toThrowError(/page is required/);
    });

    it('should call ga with setPage', () => {
      const tracking = createTracking();
      const page = 'some/page/';
      tracking.setPage(page);
      sinon.assert.calledWith(window.ga, 'set', 'page', page);
    });

    it('should throw if category not set', () => {
      const tracking = createTracking();
      expect(() => {
        tracking.sendEvent();
      }).toThrowError(/category is required/);
    });

    it('should throw if action not set', () => {
      const tracking = createTracking();
      expect(() => {
        tracking.sendEvent({
          category: 'whatever',
        });
      }).toThrowError(/action is required/);
    });

    it('should call _ga with sendEvent', () => {
      const tracking = createTracking();
      const category = 'some-category';
      const action = 'some-action';
      tracking.sendEvent({
        category,
        action,
      });
      sinon.assert.calledWithMatch(window.ga, 'send', {
        eventCategory: category,
        eventAction: action,
      });
    });

    it('should call _ga when pageView is called', () => {
      const tracking = createTracking();
      const data = {
        dimension1: 'whatever',
        dimension2: 'whatever2',
      };
      tracking.pageView(data);
      sinon.assert.calledWith(window.ga, 'send', 'pageview', data);
    });

    it('should set a custom dimension when requested', () => {
      const tracking = createTracking();
      const dimension = 'dimension1';
      const value = 'a value';
      tracking.setDimension({ dimension, value });
      sinon.assert.calledWith(window.ga, 'set', dimension, value);
    });
  });

  describe('getAddonTypeForTracking', () => {
    it('returns addon for TYPE_EXTENSION', () => {
      expect(getAddonTypeForTracking(ADDON_TYPE_EXTENSION)).toEqual(
        TRACKING_TYPE_EXTENSION,
      );
    });

    it('returns addon for TYPE_OPENSEARCH', () => {
      expect(getAddonTypeForTracking(ADDON_TYPE_OPENSEARCH)).toEqual(
        TRACKING_TYPE_EXTENSION,
      );
    });

    it('returns addon for TYPE_DICT', () => {
      expect(getAddonTypeForTracking(ADDON_TYPE_DICT)).toEqual(
        TRACKING_TYPE_EXTENSION,
      );
    });

    it('returns addon for TYPE_LANG', () => {
      expect(getAddonTypeForTracking(ADDON_TYPE_LANG)).toEqual(
        TRACKING_TYPE_EXTENSION,
      );
    });

    it('returns theme for TYPE_THEME', () => {
      expect(getAddonTypeForTracking(ADDON_TYPE_THEME)).toEqual(
        TRACKING_TYPE_THEME,
      );
    });

    it('returns addon:statictheme for TYPE_STATIC_THEME', () => {
      expect(getAddonTypeForTracking(ADDON_TYPE_STATIC_THEME)).toEqual(
        TRACKING_TYPE_STATIC_THEME,
      );
    });

    it('returns invalid for unknown type', () => {
      expect(getAddonTypeForTracking('whatever')).toEqual(
        TRACKING_TYPE_INVALID,
      );
    });
  });

  describe('getAddonEventCategory', () => {
    it('returns the expected category when type is extension and installAction is install started', () => {
      expect(
        getAddonEventCategory(ADDON_TYPE_EXTENSION, INSTALL_STARTED_ACTION),
      ).toEqual(INSTALL_STARTED_EXTENSION_CATEGORY);
    });

    it('returns the expected category when type is lightweight theme and installAction is install started', () => {
      expect(
        getAddonEventCategory(ADDON_TYPE_THEME, INSTALL_STARTED_ACTION),
      ).toEqual(INSTALL_STARTED_THEME_CATEGORY);
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

    it('returns the expected category when type is lightweight theme and installAction is uninstall started', () => {
      expect(getAddonEventCategory(ADDON_TYPE_THEME, UNINSTALL_ACTION)).toEqual(
        UNINSTALL_THEME_CATEGORY,
      );
    });

    it('returns the expected category when type is static theme and installAction is uninstall started', () => {
      expect(
        getAddonEventCategory(ADDON_TYPE_STATIC_THEME, UNINSTALL_ACTION),
      ).toEqual(UNINSTALL_THEME_CATEGORY);
    });

    it('returns the expected category when type is extension and installAction is install', () => {
      expect(
        getAddonEventCategory(ADDON_TYPE_EXTENSION, INSTALL_ACTION),
      ).toEqual(INSTALL_EXTENSION_CATEGORY);
    });

    it('returns the expected category when type is lightweight theme and installAction is install', () => {
      expect(getAddonEventCategory(ADDON_TYPE_THEME, INSTALL_ACTION)).toEqual(
        INSTALL_THEME_CATEGORY,
      );
    });

    it('returns the expected category when type is static theme and installAction is install', () => {
      expect(
        getAddonEventCategory(ADDON_TYPE_STATIC_THEME, INSTALL_ACTION),
      ).toEqual(INSTALL_THEME_CATEGORY);
    });

    it('returns the expected category when type is extension and installAction is cancelled', () => {
      expect(
        getAddonEventCategory(ADDON_TYPE_EXTENSION, INSTALL_CANCELLED_ACTION),
      ).toEqual(INSTALL_CANCELLED_EXTENSION_CATEGORY);
    });

    it('returns the expected category when type is lightweight theme and installAction is cancelled', () => {
      expect(
        getAddonEventCategory(ADDON_TYPE_THEME, INSTALL_CANCELLED_ACTION),
      ).toEqual(INSTALL_CANCELLED_THEME_CATEGORY);
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

    it('returns the expected category when type is lightweight theme and installAction is enable', () => {
      expect(getAddonEventCategory(ADDON_TYPE_THEME, ENABLE_ACTION)).toEqual(
        ENABLE_THEME_CATEGORY,
      );
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

    it('returns the expected category when type is lightweight theme and installAction is download failed', () => {
      expect(
        getAddonEventCategory(ADDON_TYPE_THEME, INSTALL_DOWNLOAD_FAILED_ACTION),
      ).toEqual(INSTALL_DOWNLOAD_FAILED_THEME_CATEGORY);
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

      sinon.assert.calledWith(fakeLog.info, 'Do Not Track is enabled');

      // Check with `window.doNotTrack` as well, just for completeness.
      fakeLog.info.resetHistory();
      isDoNotTrackEnabled({
        _log: fakeLog,
        _navigator: {},
        _window: { doNotTrack: '1' },
      });

      sinon.assert.calledWith(fakeLog.info, 'Do Not Track is enabled');
    });
  });

  describe('Tracking constants should not be changed or it risks breaking tracking stats', () => {
    it('should not change the tracking constant for invalid', () => {
      expect(TRACKING_TYPE_INVALID).toEqual('invalid');
    });

    it('should not change the tracking constant for an extension', () => {
      expect(TRACKING_TYPE_EXTENSION).toEqual('addon');
    });

    it('should not change the tracking constant for theme', () => {
      expect(TRACKING_TYPE_THEME).toEqual('theme');
    });

    it('should not change the tracking constant for static theme', () => {
      expect(TRACKING_TYPE_STATIC_THEME).toEqual('statictheme');
    });

    it('should not change the tracking category constants for theme installs', () => {
      expect(INSTALL_THEME_CATEGORY).toEqual('AMO Theme Installs');
    });

    it('should not change the tracking category constants for extension installs', () => {
      expect(INSTALL_EXTENSION_CATEGORY).toEqual('AMO Addon Installs');
    });

    it('should not change the tracking category constants for starting theme installs', () => {
      expect(INSTALL_STARTED_THEME_CATEGORY).toEqual(
        'AMO Theme Installs Started',
      );
    });

    it('should not change the tracking category constants for starting extension installs', () => {
      expect(INSTALL_STARTED_EXTENSION_CATEGORY).toEqual(
        'AMO Addon Installs Started',
      );
    });

    it('should not change the tracking category constants for theme uninstalls', () => {
      expect(UNINSTALL_THEME_CATEGORY).toEqual('AMO Theme Uninstalls');
    });

    it('should not change the tracking category constants for extension uninstalls', () => {
      expect(UNINSTALL_EXTENSION_CATEGORY).toEqual('AMO Addon Uninstalls');
    });

    it('should not change the tracking category constants for clicks', () => {
      expect(CLICK_CATEGORY).toEqual('AMO Addon / Theme Clicks');
    });

    it('should not change the tracking category constants for disco pane navigation', () => {
      expect(DISCO_NAVIGATION_CATEGORY).toEqual('Discovery Navigation');
    });
  });
});
