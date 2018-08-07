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
  INSTALL_ACTION,
  INSTALL_EXTENSION_CATEGORY,
  INSTALL_EXTENSION_STARTED_CATEGORY,
  INSTALL_STARTED_ACTION,
  INSTALL_THEME_CATEGORY,
  INSTALL_THEME_STARTED_CATEGORY,
  TRACKING_TYPE_EXTENSION,
  TRACKING_TYPE_INVALID,
  TRACKING_TYPE_STATIC_THEME,
  TRACKING_TYPE_THEME,
  UNINSTALL_ACTION,
  UNINSTALL_EXTENSION_CATEGORY,
  UNINSTALL_THEME_CATEGORY,
} from 'core/constants';

describe(__filename, () => {
  describe('Tracking', () => {
    function stubConfig(overrides = {}) {
      const config = {
        trackingEnabled: true,
        trackingId: 'sample-tracking-id',
        ...overrides,
      };
      return { get: sinon.spy((key) => config[key]) };
    }

    function createTracking(overrides = {}) {
      return new Tracking({
        _isDoNotTrackEnabled: () => false,
        _config: stubConfig(),
        ...overrides,
      });
    }

    beforeEach(() => {
      window.ga = sinon.stub();
    });

    it('should not enable GA when configured off', () => {
      createTracking({
        _config: stubConfig({ trackingEnabled: false }),
      });
      sinon.assert.notCalled(window.ga);
    });

    it('should not send events when tracking is configured off', () => {
      const tracking = createTracking({
        _config: stubConfig({ trackingEnabled: false }),
      });
      tracking.sendEvent({
        category: 'whatever',
        action: 'some-action',
      });
      sinon.assert.notCalled(window.ga);
    });

    it('should disable GA due to missing id', () => {
      createTracking({
        _isDoNotTrackEnabled: () => false,
        _config: stubConfig({
          trackingEnabled: true,
          trackingId: null,
        }),
      });
      sinon.assert.notCalled(window.ga);
    });

    it('should disable GA due to Do Not Track', () => {
      createTracking({
        _isDoNotTrackEnabled: () => true,
        _config: stubConfig({ trackingEnabled: true }),
        trackingEnabled: true,
      });
      sinon.assert.notCalled(window.ga);
    });

    it('should send initial page view when enabled', () => {
      createTracking({
        _config: stubConfig({ trackingSendInitPageView: true }),
      });
      sinon.assert.calledWith(window.ga, 'send', 'pageview');
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
      createTracking({ trackingSendInitPageView: false });
      // Make sure only 'create' and 'set' were called, not 'send'.
      sinon.assert.calledWith(window.ga, 'create');
      sinon.assert.calledWith(
        window.ga,
        'set',
        'dimension3',
        'addons-frontend',
      );
      sinon.assert.callCount(window.ga, 2);
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
      ).toEqual(INSTALL_EXTENSION_STARTED_CATEGORY);
    });

    it('returns the expected category when type is lightweight theme and installAction is install started', () => {
      expect(
        getAddonEventCategory(ADDON_TYPE_THEME, INSTALL_STARTED_ACTION),
      ).toEqual(INSTALL_THEME_STARTED_CATEGORY);
    });

    it('returns the expected category when type is static theme and installAction is install started', () => {
      expect(
        getAddonEventCategory(ADDON_TYPE_STATIC_THEME, INSTALL_STARTED_ACTION),
      ).toEqual(INSTALL_THEME_STARTED_CATEGORY);
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
      const fakeLog = { info: sinon.stub() };
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
});
