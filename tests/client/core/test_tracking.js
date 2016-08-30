/* global window */

import { Tracking, getAction } from 'core/tracking';
import { EXTENSION_TYPE, THEME_TYPE } from 'core/constants';


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
    assert.ok(tracking._log.info.calledWith(sinon.match(/OFF/), 'Tracking init'));
  });

  it('should log OFF when not enabled due to missing id', () => {
    tracking = new Tracking({
      trackingId: undefined,
      trackingEnabled: true,
      _log: {
        info: sinon.stub(),
      },
    });
    assert.ok(tracking._log.info.secondCall.calledWith(sinon.match(/OFF/), 'Missing tracking id'));
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
    assert.ok(window.ga.calledWith('send', 'pageview'));
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
    assert.notOk(window.ga.calledWith('send', 'pageview'));
  });

  it('should throw if page not set', () => {
    assert.throws(() => {
      tracking.setPage();
    }, Error, /page is required/);
  });

  it('should call ga with setPage', () => {
    tracking.setPage('whatever');
    assert.ok(window.ga.called);
  });

  it('should throw if category not set', () => {
    assert.throws(() => {
      tracking.sendEvent();
    }, Error, /category is required/);
  });

  it('should throw if action not set', () => {
    assert.throws(() => {
      tracking.sendEvent({
        category: 'whatever',
      });
    }, Error, /action is required/);
  });

  it('should call _ga with sendEvent', () => {
    tracking.sendEvent({
      category: 'whatever',
      action: 'some-action',
    });
    assert.ok(window.ga.called);
  });

  it('should call _ga when pageView is called', () => {
    const data = {
      dimension1: 'whatever',
      dimension2: 'whatever2',
    };
    tracking.pageView(data);
    assert.ok(window.ga.calledWith('send', 'pageview', data));
  });
});

describe('getAction', () => {
  it('returns addon for EXTENSION_TYPE', () => {
    assert.equal(getAction(EXTENSION_TYPE), 'addon');
  });

  it('returns theme for THEME_TYPE', () => {
    assert.equal(getAction(THEME_TYPE), 'theme');
  });

  it('returns invalid for unknown type', () => {
    assert.equal(getAction('whatever'), 'invalid');
  });
});
