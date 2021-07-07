/* global window */
import {
  Tracking,
  isDoNotTrackEnabled,
  formatDataForBeacon,
  getAddonEventCategory,
  getAddonTypeForTracking,
  sendBeacon,
} from 'amo/tracking';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_STATIC_THEME,
  CLICK_CATEGORY,
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
  UNINSTALL_ACTION,
  UNINSTALL_EXTENSION_CATEGORY,
  UNINSTALL_THEME_CATEGORY,
} from 'amo/constants';
import {
  fakeTrackingEvent,
  getFakeConfig,
  getFakeLogger,
} from 'tests/unit/helpers';

function createTracking({ paramOverrides = {}, configOverrides = {} } = {}) {
  return new Tracking({
    _isDoNotTrackEnabled: () => false,
    _config: getFakeConfig({
      server: false,
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

    it('should call _ga when pageView is called', () => {
      const tracking = createTracking();
      const data = {
        dimension1: 'whatever',
        dimension2: 'whatever2',
      };

      tracking.pageView(data);

      sinon.assert.calledWith(window.ga, 'send', {
        hitType: 'pageview',
        ...data,
      });
    });

    it('should set a custom dimension when requested', () => {
      const tracking = createTracking();
      const dimension = 'dimension1';
      const value = 'a value';
      tracking.setDimension({ dimension, value });
      sinon.assert.calledWith(window.ga, 'set', dimension, value);
    });

    it('should not send the web vitals when trackingSendWebVitals is false', () => {
      const _getCLS = sinon.stub();
      const _getFID = sinon.stub();
      const _getLCP = sinon.stub();

      createTracking({
        configOverrides: { trackingSendWebVitals: false },
        paramOverrides: {
          _getCLS,
          _getFID,
          _getLCP,
        },
      });

      sinon.assert.notCalled(_getCLS);
      sinon.assert.notCalled(_getFID);
      sinon.assert.notCalled(_getLCP);
    });

    it('should send the web vitals when trackingSendWebVitals is true', () => {
      const _getCLS = sinon.stub();
      const _getFID = sinon.stub();
      const _getLCP = sinon.stub();

      createTracking({
        configOverrides: { trackingSendWebVitals: true },
        paramOverrides: {
          _getCLS,
          _getFID,
          _getLCP,
        },
      });

      sinon.assert.calledOnce(_getCLS);
      sinon.assert.calledOnce(_getFID);
      sinon.assert.calledOnce(_getLCP);
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
          action: 'some-action',
        });
        sinon.assert.notCalled(window.ga);
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

      // This is a way to check how many times window.ga was called with the
      // arguments that signify that it was sending an event.
      const countSendEventCalls = (spy) => {
        return spy
          .getCalls()
          .filter(
            (callObj) =>
              callObj.firstArg === 'send' &&
              Object.prototype.hasOwnProperty.call(
                callObj.lastArg,
                'hitType',
              ) &&
              callObj.lastArg.hitType === 'event',
          ).length;
      };

      it('should call _ga with sendEvent on the client', () => {
        const _config = getFakeConfig({ server: false });
        const event = fakeTrackingEvent;
        const tracking = createTracking();
        tracking.sendEvent({
          _config,
          ...event,
        });
        sinon.assert.calledWithMatch(window.ga, 'send', {
          eventAction: event.action,
          eventCategory: event.category,
          eventLabel: event.label,
          eventValue: event.value,
        });
        expect(countSendEventCalls(window.ga)).toEqual(1);
      });

      it('should call _ga twice when extra is passed', () => {
        const _config = getFakeConfig({ server: false });
        const event = fakeTrackingEvent;
        const extra = 'extra-data';
        const tracking = createTracking();
        tracking.sendEvent({
          _config,
          extra,
          ...event,
        });
        sinon.assert.calledWithMatch(window.ga, 'send', {
          eventAction: event.action,
          eventCategory: event.category,
          eventLabel: event.label,
          eventValue: event.value,
        });
        sinon.assert.calledWithMatch(window.ga, 'send', {
          eventAction: event.action,
          eventCategory: `${event.category}-${extra}`,
          eventLabel: event.label,
          eventValue: event.value,
        });
        expect(countSendEventCalls(window.ga)).toEqual(2);
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
  });

  describe('sendWebVitalStats', () => {
    it('sends web vitals data to GA', () => {
      const tracking = createTracking();
      const fakeCLS = {
        name: 'CLS',
        id: 'some-id',
        delta: 123,
      };

      tracking.sendWebVitalStats(fakeCLS);

      sinon.assert.calledWith(window.ga, 'send', 'event', {
        eventCategory: 'Web Vitals',
        eventAction: fakeCLS.name,
        eventLabel: fakeCLS.id,
        eventValue: Math.round(fakeCLS.delta * 1000),
        nonInteraction: true,
        transport: 'beacon',
      });
    });
  });

  describe('getAddonTypeForTracking', () => {
    it('returns addon for TYPE_EXTENSION', () => {
      expect(getAddonTypeForTracking(ADDON_TYPE_EXTENSION)).toEqual(
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

    it('returns the expected category when type is extension and installAction is install', () => {
      expect(
        getAddonEventCategory(ADDON_TYPE_EXTENSION, INSTALL_ACTION),
      ).toEqual(INSTALL_EXTENSION_CATEGORY);
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
  });

  describe('sendBeacon', () => {
    it('should send a beacon if navigator.sendBeacon exists', () => {
      const urlString = 'https://www.mozilla.org';
      const _log = getFakeLogger();
      const _navigator = { sendBeacon: sinon.spy() };

      sendBeacon({ _log, _navigator, urlString });
      sinon.assert.calledWith(_log.debug, `Sending beacon to ${urlString}`);
      sinon.assert.calledWith(_navigator.sendBeacon, urlString);
    });

    it('can include data in a beacon', () => {
      const urlString = 'https://www.mozilla.org';
      const data = 'some-data';
      const _log = getFakeLogger();
      const _navigator = { sendBeacon: sinon.spy() };

      sendBeacon({ _log, _navigator, urlString, data });
      sinon.assert.calledWith(_navigator.sendBeacon, urlString, data);
    });

    it('does not send a beacon if DNT is enabled', () => {
      const _isDoNotTrackEnabled = sinon.stub().returns(true);
      const _log = getFakeLogger();
      const _navigator = { sendBeacon: sinon.spy() };

      sendBeacon({
        _isDoNotTrackEnabled,
        _log,
        _navigator,
        urlString: 'https://www.mozilla.org',
      });
      sinon.assert.calledWith(
        _log.debug,
        'Do Not Track Enabled; Not sending a beacon.',
      );
      sinon.assert.called(_isDoNotTrackEnabled);
      sinon.assert.notCalled(_navigator.sendBeacon);
    });

    it('sends a beacon if DNT is disabled', () => {
      const _isDoNotTrackEnabled = sinon.stub().returns(false);
      const _log = getFakeLogger();
      const _navigator = { sendBeacon: sinon.spy() };

      sendBeacon({
        _isDoNotTrackEnabled,
        _log,
        _navigator,
        urlString: 'https://www.mozilla.org',
      });
      sinon.assert.called(_isDoNotTrackEnabled);
      sinon.assert.called(_navigator.sendBeacon);
    });

    it('should not send a beacon if navigator does not exist', () => {
      const urlString = 'https://www.mozilla.org';
      const _log = getFakeLogger();

      sendBeacon({ _log, _navigator: null, urlString });
      sinon.assert.calledWith(
        _log.warn,
        'navigator does not exist. Not sending a beacon.',
      );
    });

    it('should not send a beacon if navigator.sendBeacon does not exist', () => {
      const urlString = 'https://www.mozilla.org';
      const _log = getFakeLogger();

      sendBeacon({ _log, _navigator: { sendBeacon: null }, urlString });
      sinon.assert.calledWith(
        _log.warn,
        'navigator does not exist. Not sending a beacon.',
      );
    });
  });

  describe('formatDataForBeacon', () => {
    it('can create a FormData object without a type', () => {
      const data = 'some data';
      const key = 'some key';
      const expected = new FormData();
      expected.append(key, data);

      expect(formatDataForBeacon({ data, key })).toEqual(expected);
    });

    it('can create a FormData object with a type', () => {
      const data = 'some data';
      const key = 'some key';
      const type = 'some type';
      const expected = new FormData();
      expected.append(key, data);
      expected.append('type', type);

      expect(formatDataForBeacon({ data, key, type })).toEqual(expected);
    });
  });
});
