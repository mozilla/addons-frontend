/* global window */
import { Tracking, isDoNotTrackEnabled, getAction } from 'core/tracking';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  TRACKING_TYPE_EXTENSION,
  TRACKING_TYPE_THEME,
} from 'core/constants';


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

  it('should be able to call log when uninitialized without an error', () => {
    const tracking = createTracking({
      _log: null,
    });
    // This should not throw an error.
    tracking.log('A message that will never be sent');
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
    sinon.assert.calledWith(window.ga, 'set', 'dimension3', 'addons-frontend');
  });

  it('should not send initial page view when disabled', () => {
    createTracking({ trackingSendInitPageView: false });
    // Make sure only 'create' and 'set' were called, not 'send'.
    sinon.assert.calledWith(window.ga, 'create');
    sinon.assert.calledWith(window.ga, 'set', 'dimension3', 'addons-frontend');
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
});

describe('getAction', () => {
  it('returns addon for TYPE_EXTENSION', () => {
    expect(getAction(ADDON_TYPE_EXTENSION)).toEqual(TRACKING_TYPE_EXTENSION);
  });

  it('returns theme for TYPE_THEME', () => {
    expect(getAction(ADDON_TYPE_THEME)).toEqual(TRACKING_TYPE_THEME);
  });

  it('returns invalid for unknown type', () => {
    expect(getAction('whatever')).toEqual('invalid');
  });
});

describe('Do Not Track', () => {
  it('should respect DNT when enabled', () => {
    expect(isDoNotTrackEnabled({
      _navigator: { doNotTrack: '1' },
      _window: {},
    })).toBe(true);
    expect(isDoNotTrackEnabled({
      _navigator: {},
      _window: { doNotTrack: '1' },
    })).toBe(true);
  });

  it('should respect not enabled DNT', () => {
    expect(isDoNotTrackEnabled({
      _navigator: { doNotTrack: '0' },
      _window: {},
    })).toBe(false);
    expect(isDoNotTrackEnabled({
      _navigator: {},
      _window: { doNotTrack: '0' },
    })).toBe(false);
  });

  it('should treat unknown values as no DNT', () => {
    expect(isDoNotTrackEnabled({
      _navigator: { doNotTrack: 'leave me alone' },
      _window: {},
    })).toBe(false);
    expect(isDoNotTrackEnabled({
      _navigator: {},
      _window: { doNotTrack: 'leave me alone' },
    })).toBe(false);
  });

  it('should handle missing navigator and window', () => {
    expect(isDoNotTrackEnabled({ _navigator: null })).toBe(false);
    expect(isDoNotTrackEnabled({ _window: null })).toBe(false);
  });

  it('should log that DNT disabled tracking', () => {
    const fakeLog = { log: sinon.stub() };
    isDoNotTrackEnabled({
      _log: fakeLog,
      _navigator: { doNotTrack: '1' },
      _window: {},
    });

    sinon.assert.calledWith(fakeLog.log, 'Do Not Track is enabled');

    // Check with `window.doNotTrack` as well, just for completeness.
    fakeLog.log.reset();
    isDoNotTrackEnabled({
      _log: fakeLog,
      _navigator: {},
      _window: { doNotTrack: '1' },
    });

    sinon.assert.calledWith(fakeLog.log, 'Do Not Track is enabled');
  });
});
