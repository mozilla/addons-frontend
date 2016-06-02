import { Tracking } from 'core/tracking';


describe('Tracking', () => {
  it('should throw when calling setPage', () => {
    assert.throws(() => {
      const tracking = new Tracking({enabled: true});
      tracking.setPage('whateconst');
    }, /Must call init\(\) first/);
  });

  it('should throw when calling sendEvent', () => {
    assert.throws(() => {
      const tracking = new Tracking({enabled: true});
      tracking.sendEvent({
        category: 'cat',
        action: 'some-action',
      });
    }, /Must call init\(\) first/);
  });

  describe('Tracking functions', () => {
    let tracking;

    beforeEach(() => {
      tracking = new Tracking({
        id: 'whatever',
        enabled: true,
      });
      tracking.initialized = true;
      window.ga = sinon.stub();
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
        tracking.sendEvent({});
      }, Error, /opts\.category is required/);
    });

    it('should throw if action not set', () => {
      assert.throws(() => {
        tracking.sendEvent({
          category: 'whatever',
        });
      }, Error, /opts\.action is required/);
    });

    it('should call _ga', () => {
      tracking.sendEvent({
        category: 'whatever',
        action: 'some-action',
      });
      assert.ok(window.ga.called);
    });
  });
});
