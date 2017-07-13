/* global window */
import { oneLine } from 'common-tags';

import { Tracking, isDoNotTrackEnabled, getAction } from 'core/tracking';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  TRACKING_TYPE_EXTENSION,
  TRACKING_TYPE_THEME,
} from 'core/constants';


describe('Tracking', () => {
  let tracking;

  beforeEach(() => {
    tracking = new Tracking({
      trackingId: 'whatever',
      trackingEnabled: true,
      _log: {
        info: sinon.stub(),
      },
    });
    window.ga = sinon.stub();
  });

  it('should log OFF when not enabled', () => {
    tracking = new Tracking({
      trackingId: 'whatever',
      trackingEnabled: false,
      _log: {
        info: sinon.stub(),
      },
    });
    expect(tracking._log.info.calledWith(sinon.match(/OFF/), 'Tracking init')).toBe(true);
  });

  it('should log OFF when not enabled due to missing id', () => {
    tracking = new Tracking({
      trackingId: undefined,
      trackingEnabled: true,
      _log: {
        info: sinon.stub(),
      },
    });
    expect(
      tracking._log.info.secondCall.calledWith(sinon.match(/OFF/), 'Missing tracking id')
    ).toBe(true);
  });

  it('should log OFF when not enabled due to Do Not Track', () => {
    tracking = new Tracking({
      _isDoNotTrackEnabled: () => true,
      _log: {
        info: sinon.stub(),
      },
      trackingEnabled: true,
      trackingId: 'whatever',
    });
    sinon.assert.calledWith(tracking._log.info, sinon.match(/OFF/));
  });

  it('should send initial page view when enabled', () => {
    tracking = new Tracking({
      trackingId: 'whatever',
      trackingEnabled: true,
      trackingSendInitPageView: true,
      _log: {
        info: sinon.stub(),
      },
    });
    expect(window.ga.calledWith('send', 'pageview')).toBe(true);
  });

  it('should not send initial page view when disabled', () => {
    tracking = new Tracking({
      trackingId: 'whatever',
      trackingEnabled: true,
      trackingSendInitPageView: false,
      _log: {
        info: sinon.stub(),
      },
    });
    expect(window.ga.calledWith('send', 'pageview')).toBe(false);
  });

  it('should throw if page not set', () => {
    expect(() => {
      tracking.setPage();
    }).toThrowError(/page is required/);
  });

  it('should call ga with setPage', () => {
    tracking.setPage('whatever');
    expect(window.ga.called).toBe(true);
  });

  it('should throw if category not set', () => {
    expect(() => {
      tracking.sendEvent();
    }).toThrowError(/category is required/);
  });

  it('should throw if action not set', () => {
    expect(() => {
      tracking.sendEvent({
        category: 'whatever',
      });
    }).toThrowError(/action is required/);
  });

  it('should call _ga with sendEvent', () => {
    tracking.sendEvent({
      category: 'whatever',
      action: 'some-action',
    });
    expect(window.ga.called).toBe(true);
  });

  it('should call _ga when pageView is called', () => {
    const data = {
      dimension1: 'whatever',
      dimension2: 'whatever2',
    };
    tracking.pageView(data);
    expect(window.ga.calledWith('send', 'pageview', data)).toBe(true);
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

    sinon.assert.calledWith(fakeLog.log, oneLine`[TRACKING]: Do Not Track
      Enabled; Google Analytics not loaded and tracking disabled.`);
    sinon.assert.calledOnce(fakeLog.log);

    // Check with `window.doNotTrack` as well, just for completeness.
    fakeLog.log.reset();
    isDoNotTrackEnabled({
      _log: fakeLog,
      _navigator: {},
      _window: { doNotTrack: '1' },
    });

    sinon.assert.calledWith(fakeLog.log, oneLine`[TRACKING]: Do Not Track
      Enabled; Google Analytics not loaded and tracking disabled.`);
    sinon.assert.calledOnce(fakeLog.log);
  });
});
