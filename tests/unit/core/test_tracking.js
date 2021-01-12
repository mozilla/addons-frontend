/* global window */
import {
  SPONSORED_INSTALL_CONVERSION_INFO_KEY,
  Tracking,
  isDoNotTrackEnabled,
  formatDataForBeacon,
  getAddonEventCategory,
  getAddonTypeForTracking,
  sendBeacon,
  sendSponsoredEventBeacon,
  storeConversionInfo,
  trackConversion,
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

  describe('sendSponsoredEventBeacon', () => {
    it('calls sendBeacon with the expected data and URL', () => {
      const apiPath = 'some/path/';
      const apiVersion = 'someVersion';
      const _config = getFakeConfig({ apiPath, apiVersion });
      const _sendBeacon = sinon.spy();
      const data = 'some data';
      const type = 'click';

      const expectedURL = `${apiPath}${apiVersion}/shelves/sponsored/event/`;
      const formattedData = formatDataForBeacon({ data, key: 'data', type });

      sendSponsoredEventBeacon({ _config, _sendBeacon, data, type });
      sinon.assert.calledWith(_sendBeacon, {
        data: formattedData,
        urlString: expectedURL,
      });
    });
  });

  describe('Conversion info', () => {
    let _window;

    beforeEach(() => {
      _window = {
        sessionStorage: {
          getItem: sinon.stub(),
          setItem: sinon.spy(),
          removeItem: sinon.spy(),
        },
      };
    });

    describe('storeConversionInfo', () => {
      it('stores a stringified version of the info', () => {
        const addonId = 123;
        const data = 'some data';

        storeConversionInfo({ _window, addonId, data });
        sinon.assert.calledWith(
          _window.sessionStorage.setItem,
          SPONSORED_INSTALL_CONVERSION_INFO_KEY,
          JSON.stringify({ addonId, data }),
        );
      });

      it('ignores a non-strinifyable value', () => {
        // This is a BigInt, which fails JSON.stringify.
        const addonId = 9007199254740991n;
        const data = 'some data';
        const _log = getFakeLogger();

        storeConversionInfo({ _log, _window, addonId, data });
        sinon.assert.notCalled(_window.sessionStorage.setItem);
        sinon.assert.calledWith(
          _log.warn,
          'data not stringifyable as JSON. Not storing conversion info.',
        );
      });

      it('can handle a missing window.sessionStorage object', () => {
        const _log = getFakeLogger();
        _window.sessionStorage = undefined;

        storeConversionInfo({
          _log,
          _window,
          addonId: 123,
          data: 'some data',
        });
        sinon.assert.calledWith(
          _log.warn,
          'window.sessionStorage does not exist. Not storing conversion info.',
        );
      });
    });

    describe('trackConversion', () => {
      const addonId = 1;
      const data = 'some data';

      it('calls window.sessionStorage to check for stored info', () => {
        trackConversion({ _window, addonId });
        sinon.assert.called(_window.sessionStorage.getItem);
      });

      it('sends a beacon if the addonId matches that in storage', () => {
        const _sendSponsoredEventBeacon = sinon.spy();
        const info = JSON.stringify({ addonId, data });
        _window.sessionStorage.getItem.returns(info);

        trackConversion({ _sendSponsoredEventBeacon, _window, addonId });
        sinon.assert.calledWith(_sendSponsoredEventBeacon, {
          data,
          type: 'conversion',
        });
      });

      it('clears sessionStorage if the addonId matches that in storage', () => {
        const info = JSON.stringify({ addonId, data });
        _window.sessionStorage.getItem.returns(info);

        trackConversion({ _window, addonId });
        sinon.assert.calledWith(
          _window.sessionStorage.removeItem,
          SPONSORED_INSTALL_CONVERSION_INFO_KEY,
        );
      });

      it('does not send a beacon if window.sessionStorage does not exist', () => {
        const _sendSponsoredEventBeacon = sinon.spy();
        _window.sessionStorage = undefined;

        trackConversion({ _sendSponsoredEventBeacon, _window, addonId });
        sinon.assert.notCalled(_sendSponsoredEventBeacon);
      });

      it('does not send a beacon or clear storage if the stored data fails to parse', () => {
        const _sendSponsoredEventBeacon = sinon.spy();
        // Not parseable as JSON:
        _window.sessionStorage.getItem.returns({});

        trackConversion({ _sendSponsoredEventBeacon, _window, addonId });
        sinon.assert.notCalled(_sendSponsoredEventBeacon);
        sinon.assert.notCalled(_window.sessionStorage.removeItem);
      });

      it('does not send a beacon or clear storage if the addonId does not match', () => {
        const _sendSponsoredEventBeacon = sinon.spy();
        const info = JSON.stringify({ addonId, data });
        _window.sessionStorage.getItem.returns(info);

        trackConversion({
          _sendSponsoredEventBeacon,
          _window,
          addonId: addonId + 1,
        });
        sinon.assert.notCalled(_sendSponsoredEventBeacon);
        sinon.assert.notCalled(_window.sessionStorage.removeItem);
      });

      it('does not send a beacon or clear storage if nothing is stored', () => {
        const _sendSponsoredEventBeacon = sinon.spy();
        _window.sessionStorage.getItem.returns(undefined);

        trackConversion({ _sendSponsoredEventBeacon, _window, addonId });
        sinon.assert.notCalled(_sendSponsoredEventBeacon);
        sinon.assert.notCalled(_window.sessionStorage.removeItem);
      });

      it('does not send a beacon or clear storage if data is empty', () => {
        const _sendSponsoredEventBeacon = sinon.spy();
        const info = JSON.stringify({ addonId, data: null });
        _window.sessionStorage.getItem.returns(info);

        trackConversion({ _sendSponsoredEventBeacon, _window, addonId });
        sinon.assert.notCalled(_sendSponsoredEventBeacon);
        sinon.assert.notCalled(_window.sessionStorage.removeItem);
      });
    });
  });
});
