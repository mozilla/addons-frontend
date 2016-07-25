import { Tracking } from 'core/tracking';


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

  it('should throw if page not set', () => {
    assert.throws(() => {
      tracking.setPage();
    }, Error, /page is required/);
  });

  it('should call ga', () => {
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

  it('should call _ga', () => {
    tracking.sendEvent({
      category: 'whatever',
      action: 'some-action',
    });
    assert.ok(window.ga.called);
  });
});
