/* global window */
import {
  Tracking,
  isDoNotTrackEnabled,
  getAddonEventCategory,
  getAddonTypeForTracking,
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
  getFakeLoggerWithJest as getFakeLogger,
} from 'tests/unit/helpers';

const trackingId = 'sample-tracking-id';
const ga4PropertyId = 'sample-GA4-property-id';

function createTracking({ paramOverrides = {}, configOverrides = {} } = {}) {
  return new Tracking({
    _isDoNotTrackEnabled: () => false,
    _config: getFakeConfig({
      ga4DebugMode: true,
      ga4PropertyId,
      server: false,
      trackingEnabled: true,
      trackingId,
      ...configOverrides,
    }),
    ...paramOverrides,
  });
}

describe(__filename, () => {
  describe('Tracking', () => {
    beforeEach(() => {
      window.ga = jest.fn();
      window.dataLayer = { push: jest.fn() };
    });

    it('should not enable GA when configured off', () => {
      createTracking({
        configOverrides: { trackingEnabled: false },
      });
      expect(window.ga).not.toHaveBeenCalled();
      expect(window.dataLayer.push).not.toHaveBeenCalled();
    });

    it('should disable GA due to missing id', () => {
      createTracking({
        configOverrides: { ga4PropertyId: null, trackingId: null },
        paramOverrides: {
          _isDoNotTrackEnabled: () => false,
        },
      });
      expect(window.ga).not.toHaveBeenCalled();
      expect(window.dataLayer.push).not.toHaveBeenCalled();
    });

    it('should disable GA due to Do Not Track', () => {
      createTracking({
        paramOverrides: {
          _isDoNotTrackEnabled: () => true,
        },
      });
      expect(window.ga).not.toHaveBeenCalled();
      expect(window.dataLayer.push).not.toHaveBeenCalled();
    });

    it('should send initial page view when enabled', () => {
      createTracking({
        configOverrides: {
          trackingSendInitPageView: true,
        },
      });
      expect(window.ga).toHaveBeenCalledWith('send', 'pageview');
    });

    it('should initialize GA4 when enabled', () => {
      createTracking();

      // We need to do this due to the way `arguments` works.
      expect(Array.from(window.dataLayer.push.mock.calls[0][0])).toEqual([
        'js',
        expect.any(Date),
      ]);
      expect(Array.from(window.dataLayer.push.mock.calls[1][0])).toEqual([
        'config',
        ga4PropertyId,
        { debug_mode: true },
      ]);
    });

    it('should not configure debug_mode when ga4DebugMode is false', () => {
      createTracking({
        configOverrides: {
          ga4DebugMode: false,
        },
      });

      expect(Array.from(window.dataLayer.push.mock.calls[1][0])).toEqual([
        'config',
        ga4PropertyId,
        {},
      ]);
    });

    it('should set the transport mechanism to beacon', () => {
      createTracking();
      expect(window.ga).toHaveBeenCalledWith('set', 'transport', 'beacon');
    });

    it('should set dimension3', () => {
      createTracking();
      expect(window.ga).toHaveBeenCalledWith(
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
      expect(window.ga).toHaveBeenCalledWith('create', trackingId, 'auto');
      expect(window.ga).toHaveBeenCalledWith('set', 'transport', 'beacon');
      expect(window.ga).toHaveBeenCalledWith(
        'set',
        'dimension3',
        'addons-frontend',
      );
      expect(window.ga).toHaveBeenCalledTimes(3);
    });

    it('should throw if page not set', () => {
      const tracking = createTracking();
      expect(() => {
        tracking.setPage();
      }).toThrow(/page is required/);
    });

    it('should call ga with setPage', () => {
      const tracking = createTracking();
      const page = 'some/page/';
      tracking.setPage(page);
      expect(window.ga).toHaveBeenCalledWith('set', 'page', page);
    });

    it('should call _ga when pageView is called', () => {
      const tracking = createTracking();
      const data = {
        dimension1: 'whatever',
        dimension2: 'whatever2',
      };

      tracking.pageView(data);

      expect(window.ga).toHaveBeenCalledWith('send', {
        hitType: 'pageview',
        ...data,
      });
    });

    it('should set a custom dimension when requested', () => {
      const tracking = createTracking();
      const dimension = 'dimension1';
      const value = 'a value';
      tracking.setDimension({ dimension, value });
      expect(window.ga).toHaveBeenCalledWith('set', dimension, value);
    });

    it('should set user properties when requested', () => {
      const tracking = createTracking();
      const props = { prop1: 'value1', prop2: 'value2' };
      window.dataLayer.push.mockClear();

      tracking.setUserProperties(props);
      expect(Array.from(window.dataLayer.push.mock.calls[0][0])).toEqual([
        'set',
        'user_properties',
        props,
      ]);
    });

    it('should not send the web vitals when trackingSendWebVitals is false', () => {
      const _onCLS = jest.fn();
      const _onINP = jest.fn();
      const _onLCP = jest.fn();

      createTracking({
        configOverrides: { trackingSendWebVitals: false },
        paramOverrides: {
          _onCLS,
          _onINP,
          _onLCP,
        },
      });

      expect(_onCLS).not.toHaveBeenCalled();
      expect(_onINP).not.toHaveBeenCalled();
      expect(_onLCP).not.toHaveBeenCalled();
    });

    it('should send the web vitals when trackingSendWebVitals is true', () => {
      const _onCLS = jest.fn();
      const _onINP = jest.fn();
      const _onLCP = jest.fn();

      createTracking({
        configOverrides: { trackingSendWebVitals: true },
        paramOverrides: {
          _onCLS,
          _onINP,
          _onLCP,
        },
      });

      expect(_onCLS).toHaveBeenCalledTimes(1);
      expect(_onINP).toHaveBeenCalledTimes(1);
      expect(_onLCP).toHaveBeenCalledTimes(1);
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
        expect(window.ga).not.toHaveBeenCalled();
        expect(window.dataLayer.push).not.toHaveBeenCalled();
      });

      it('should throw if category not set', () => {
        const tracking = createTracking();
        expect(() => {
          tracking.sendEvent({
            action: 'whatever',
          });
        }).toThrow(/category is required/);
      });

      it('should throw if action not set', () => {
        const tracking = createTracking();
        expect(() => {
          tracking.sendEvent({
            category: 'whatever',
          });
        }).toThrow(/action is required/);
      });

      // This is a way to check how many times window.ga was called with the
      // arguments that signify that it was sending an event.
      const countSendEventCalls = (spy) => {
        return spy.mock.calls.filter(
          (callArray) =>
            callArray[0] === 'send' &&
            Object.prototype.hasOwnProperty.call(callArray[1], 'hitType') &&
            callArray[1].hitType === 'event',
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
        expect(window.ga).toHaveBeenCalledWith(
          'send',
          expect.objectContaining({
            eventAction: event.action,
            eventCategory: event.category,
            eventLabel: event.label,
            eventValue: event.value,
          }),
        );
        expect(countSendEventCalls(window.ga)).toEqual(1);
      });

      it('should send an event to GA4 with sendEvent on the client', () => {
        const _config = getFakeConfig({ server: false });
        const event = fakeTrackingEvent;
        const tracking = createTracking();
        window.dataLayer.push.mockClear();

        tracking.sendEvent({ _config, ...event });
        expect(Array.from(window.dataLayer.push.mock.calls[0][0])).toEqual([
          'event',
          event.category,
          {
            eventAction: event.action,
            eventCategory: event.category,
            eventLabel: event.label,
            eventValue: event.value,
            hitType: 'event',
          },
        ]);
        expect(window.dataLayer.push).toHaveBeenCalledTimes(1);
      });

      it('should call _ga twice when sendSecondEventWithOverrides is passed', () => {
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
        expect(window.ga).toHaveBeenCalledWith(
          'send',
          expect.objectContaining({
            eventAction: event.action,
            eventCategory: event.category,
            eventLabel: event.label,
            eventValue: event.value,
          }),
        );
        expect(window.ga).toHaveBeenCalledWith(
          'send',
          expect.objectContaining({
            eventAction: event.action,
            eventCategory: secondCategory,
            eventLabel: event.label,
            eventValue: event.value,
          }),
        );
        expect(countSendEventCalls(window.ga)).toEqual(2);
      });

      it('should send an event to GA4 twice when sendSecondEventWithOverrides is passed', () => {
        const _config = getFakeConfig({ server: false });
        const event = fakeTrackingEvent;
        const secondCategory = 'second-category';
        const sendSecondEventWithOverrides = { category: secondCategory };
        const tracking = createTracking();
        window.dataLayer.push.mockClear();

        tracking.sendEvent({
          _config,
          sendSecondEventWithOverrides,
          ...event,
        });
        expect(Array.from(window.dataLayer.push.mock.calls[0][0])).toEqual([
          'event',
          event.category,
          {
            eventAction: event.action,
            eventCategory: event.category,
            eventLabel: event.label,
            eventValue: event.value,
            hitType: 'event',
          },
        ]);
        expect(Array.from(window.dataLayer.push.mock.calls[1][0])).toEqual([
          'event',
          secondCategory,
          {
            eventAction: event.action,
            eventCategory: secondCategory,
            eventLabel: event.label,
            eventValue: event.value,
            hitType: 'event',
          },
        ]);
        expect(window.dataLayer.push).toHaveBeenCalledTimes(2);
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
    const fakeCLS = {
      name: 'CLS',
      id: 'some-id',
      delta: 123,
      value: 987,
    };

    it('sends web vitals data to GA', () => {
      const tracking = createTracking();

      tracking.sendWebVitalStats(fakeCLS);

      expect(window.ga).toHaveBeenCalledWith('send', 'event', {
        eventCategory: 'Web Vitals',
        eventAction: fakeCLS.name,
        eventLabel: fakeCLS.id,
        eventValue: Math.round(fakeCLS.delta * 1000),
        nonInteraction: true,
        transport: 'beacon',
      });
    });

    it('sends web vitals data to GA4', () => {
      const tracking = createTracking();
      window.dataLayer.push.mockClear();

      tracking.sendWebVitalStats(fakeCLS);

      expect(Array.from(window.dataLayer.push.mock.calls[0][0])).toEqual([
        'event',
        fakeCLS.name,
        {
          value: Math.round(fakeCLS.delta * 1000),
          metric_id: fakeCLS.id,
          metric_value: fakeCLS.value,
          metric_delta: Math.round(fakeCLS.delta * 1000),
        },
      ]);
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
});
