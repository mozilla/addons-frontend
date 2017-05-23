/* global window */

import { Tracking, getAction } from 'core/tracking';
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
    expect(tracking._log.info.calledWith(sinon.match(/OFF/), 'Tracking init')).toBeTruthy();
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
    ).toBeTruthy();
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
    expect(window.ga.calledWith('send', 'pageview')).toBeTruthy();
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
    expect(window.ga.calledWith('send', 'pageview')).toBeFalsy();
  });

  it('should throw if page not set', () => {
    expect(() => {
      tracking.setPage();
    }).toThrow();
  });

  it('should call ga with setPage', () => {
    tracking.setPage('whatever');
    expect(window.ga.called).toBeTruthy();
  });

  it('should throw if category not set', () => {
    expect(() => {
      tracking.sendEvent();
    }).toThrow();
  });

  it('should throw if action not set', () => {
    expect(() => {
      tracking.sendEvent({
        category: 'whatever',
      });
    }).toThrow();
  });

  it('should call _ga with sendEvent', () => {
    tracking.sendEvent({
      category: 'whatever',
      action: 'some-action',
    });
    expect(window.ga.called).toBeTruthy();
  });

  it('should call _ga when pageView is called', () => {
    const data = {
      dimension1: 'whatever',
      dimension2: 'whatever2',
    };
    tracking.pageView(data);
    expect(window.ga.calledWith('send', 'pageview', data)).toBeTruthy();
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
