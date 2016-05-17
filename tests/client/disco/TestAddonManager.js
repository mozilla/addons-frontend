import { AddonManager } from 'disco/addonManager';
import { installEventList } from 'disco/constants';


describe('AddonManager', () => {
  let fakeAddon;
  let fakeCallback;
  let fakeInstallObj;
  let fakeInstallUrl;
  let fakeMozAddonManager;

  beforeEach(() => {
    fakeCallback = sinon.stub();
    fakeInstallUrl = 'https://fake-install-url';
    fakeAddon = {
      uninstall: sinon.stub(),
    };
    fakeInstallObj = {
      addEventListener: sinon.stub(),
      install: sinon.stub(),
    };
    fakeMozAddonManager = {
      createInstall: sinon.stub(),
      getAddonByID: sinon.stub(),
    };
    fakeMozAddonManager.createInstall.returns(Promise.resolve(fakeInstallObj));
  });

  it('should throw if mozAddonManager is not provided', () => {
    assert.throws(() => {
      // eslint-disable-next-line no-unused-vars
      const addonManager = new AddonManager('whatevs', fakeInstallUrl, fakeCallback);
    }, Error, /mozAddonManager not available/);
  });

  describe('handleEvent()', () => {
    it('should provide eventCallback with event and id', () => {
      const addonManager = new AddonManager('test-id', fakeInstallUrl, fakeCallback,
                                            {mozAddonManager: fakeMozAddonManager});
      const fakeEvent = {type: 'fakeEvent'};
      addonManager.handleEvent(fakeEvent);
      assert.ok(fakeCallback.calledWith(fakeEvent, 'test-id'));
    });
  });

  describe('getAddon()', () => {
    it('should call mozAddonManager.getAddonByID() with id', () => {
      const addonManager = new AddonManager('test-id', fakeInstallUrl, fakeCallback,
                                            {mozAddonManager: fakeMozAddonManager});
      fakeMozAddonManager.getAddonByID.returns(Promise.resolve(fakeAddon));
      return addonManager.getAddon()
        .then(() => {
          assert.ok(fakeMozAddonManager.getAddonByID.calledWith('test-id'));
        });
    });

    it('should reject if mozAddonManager.getAddonByID() resolves with falsey addon', () => {
      const addonManager = new AddonManager('test-id', fakeInstallUrl, fakeCallback,
                                            {mozAddonManager: fakeMozAddonManager});
      fakeMozAddonManager.getAddonByID.returns(Promise.resolve(false));
      return addonManager.getAddon()
        .then(() => {
          assert.fail('unexpected success');
        })
        .catch((err) => {
          assert.equal(err.message, 'Addon not found');
        });
    });
  });

  describe('install()', () => {
    it('should call mozAddonManager.createInstall() with url', () => {
      const addonManager = new AddonManager('test-id', fakeInstallUrl, fakeCallback,
                                            {mozAddonManager: fakeMozAddonManager});
      addonManager.install();
      assert.ok(fakeMozAddonManager.createInstall.calledWith({url: fakeInstallUrl}));
    });

    it('should call installObj.addEventListener to setup events', () => {
      const addonManager = new AddonManager('test-id', fakeInstallUrl, fakeCallback,
                                            {mozAddonManager: fakeMozAddonManager});
      return addonManager.install()
        .then(() => {
          assert.equal(fakeInstallObj.addEventListener.callCount, installEventList.length);
        });
    });

    it('should call installObj.install()', () => {
      const addonManager = new AddonManager('test-id', fakeInstallUrl, fakeCallback,
                                            {mozAddonManager: fakeMozAddonManager});
      return addonManager.install()
        .then(() => {
          assert.ok(fakeInstallObj.install.called);
        });
    });
  });

  describe('uninstall()', () => {
    it('should reject if getAddonByID resolves with falsey value', () => {
      const addonManager = new AddonManager('test-id', fakeInstallUrl, fakeCallback,
                                            {mozAddonManager: fakeMozAddonManager});
      fakeMozAddonManager.getAddonByID.returns(Promise.resolve(false));
      // If the code doesn't resolve this will blow up.
      return addonManager.uninstall()
        .then(() => {
          assert.fail('unexpected success');
        })
        .catch((err) => {
          assert.equal(err.message, 'Addon not found');
        });
    });

    it('should reject if addon.uninstall resolves with false', () => {
      const addonManager = new AddonManager('test-id', fakeInstallUrl, fakeCallback,
                                            {mozAddonManager: fakeMozAddonManager});
      fakeAddon.uninstall.returns(Promise.resolve(false));
      fakeMozAddonManager.getAddonByID.returns(Promise.resolve(fakeAddon));
      return addonManager.uninstall()
        .then(() => assert.fail('unexpected success'))
        .catch((err) => {
          assert.equal(err.message, 'Uninstall failed');
        });
    });

    it('should resolve if addon.uninstall resolves with true', () => {
      const addonManager = new AddonManager('test-id', fakeInstallUrl, fakeCallback,
                                            {mozAddonManager: fakeMozAddonManager});
      fakeAddon.uninstall.returns(Promise.resolve(true));
      fakeMozAddonManager.getAddonByID.returns(Promise.resolve(fakeAddon));
      // If the code doesn't resolve this will blow up.
      return addonManager.uninstall();
    });

    it('should resolve if addon.uninstall just resolves', () => {
      const addonManager = new AddonManager('test-id', fakeInstallUrl, fakeCallback,
                                            {mozAddonManager: fakeMozAddonManager});
      fakeAddon.uninstall.returns(Promise.resolve());
      fakeMozAddonManager.getAddonByID.returns(Promise.resolve(fakeAddon));
      // If the code doesn't resolve this will blow up.
      return addonManager.uninstall();
    });
  });
});
