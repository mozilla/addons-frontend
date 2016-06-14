import * as addonManager from 'disco/addonManager';
import { unexpectedSuccess } from 'tests/client/helpers';
import {
  globalEventStatusMap,
  installEventList,
} from 'disco/constants';


describe('addonManager', () => {
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
      addEventListener: sinon.stub(),
    };
    fakeMozAddonManager.createInstall.returns(Promise.resolve(fakeInstallObj));
  });

  describe('getAddon()', () => {
    it('should call mozAddonManager.getAddonByID() with id', () => {
      fakeMozAddonManager.getAddonByID.returns(Promise.resolve(fakeAddon));
      return addonManager.getAddon('test-id', { _mozAddonManager: fakeMozAddonManager })
        .then(() => {
          assert.ok(fakeMozAddonManager.getAddonByID.calledWith('test-id'));
        });
    });

    it('should reject if mozAddonManager.getAddonByID() resolves with falsey addon', () => {
      fakeMozAddonManager.getAddonByID.returns(Promise.resolve(false));
      return addonManager.getAddon('test-id', { _mozAddonManager: fakeMozAddonManager })
        .then(unexpectedSuccess,
          (err) => assert.equal(err.message, 'Addon not found'));
    });
  });

  describe('install()', () => {
    it('should call mozAddonManager.createInstall() with url', () => {
      addonManager.install(fakeInstallUrl, fakeCallback, { _mozAddonManager: fakeMozAddonManager });
      assert.ok(fakeMozAddonManager.createInstall.calledWith({ url: fakeInstallUrl }));
    });

    it('should call installObj.addEventListener to setup events', () => addonManager.install(
      fakeInstallUrl, fakeCallback, { _mozAddonManager: fakeMozAddonManager })
        .then(() => {
          assert.equal(fakeInstallObj.addEventListener.callCount, installEventList.length);
        }));

    it('should call installObj.install()', () => addonManager.install(
      fakeInstallUrl, fakeCallback, { _mozAddonManager: fakeMozAddonManager })
        .then(() => {
          assert.ok(fakeInstallObj.install.called);
        }));

    it('passes the installObj, the event and the id to the callback', () => {
      const fakeEvent = { type: 'fakeEvent' };
      let callback;
      fakeInstallObj.addEventListener = (event, cb) => { callback = cb; };
      return addonManager.install(
        fakeInstallUrl, fakeCallback, { _mozAddonManager: fakeMozAddonManager })
          .then(() => {
            callback(fakeEvent);
            assert.ok(fakeCallback.calledWith(fakeInstallObj, fakeEvent));
          });
    });
  });

  describe('uninstall()', () => {
    it('should reject if getAddonByID resolves with falsey value', () => {
      fakeMozAddonManager.getAddonByID.returns(Promise.resolve(false));
      // If the code doesn't resolve this will blow up.
      return addonManager.uninstall('test-id', { _mozAddonManager: fakeMozAddonManager })
        .then(unexpectedSuccess,
          (err) => assert.equal(err.message, 'Addon not found'));
    });

    it('should reject if addon.uninstall resolves with false', () => {
      fakeAddon.uninstall.returns(Promise.resolve(false));
      fakeMozAddonManager.getAddonByID.returns(Promise.resolve(fakeAddon));
      return addonManager.uninstall('test-id', { _mozAddonManager: fakeMozAddonManager })
        .then(unexpectedSuccess,
          (err) => assert.equal(err.message, 'Uninstall failed'));
    });

    it('should resolve if addon.uninstall resolves with true', () => {
      fakeAddon.uninstall.returns(Promise.resolve(true));
      fakeMozAddonManager.getAddonByID.returns(Promise.resolve(fakeAddon));
      // If the code doesn't resolve this will blow up.
      return addonManager.uninstall('test-id', { _mozAddonManager: fakeMozAddonManager });
    });

    it('should resolve if addon.uninstall just resolves', () => {
      fakeAddon.uninstall.returns(Promise.resolve());
      fakeMozAddonManager.getAddonByID.returns(Promise.resolve(fakeAddon));
      // If the code doesn't resolve this will blow up.
      return addonManager.uninstall('test-id', { _mozAddonManager: fakeMozAddonManager });
    });
  });

  describe('addChangeListener', () => {
    const fakeEventCallback = sinon.stub();
    fakeMozAddonManager = {
      addEventListener: sinon.stub(),
    };

    const handleChangeEvent =
      addonManager.addChangeListeners(fakeEventCallback, fakeMozAddonManager);

    Object.keys(globalEventStatusMap).forEach((event) => {
      const status = globalEventStatusMap[event];
      it(`calls callback with status ${status}`, () => {
        const id = 'foo@whatever';
        const needsRestart = false;
        handleChangeEvent({ id, needsRestart, type: event });
        assert.ok(fakeEventCallback.calledWith({ guid: id, needsRestart, status }),
          `Calls callback with "${status}" for "${event}"`);
      });
    });

    it('throws on unknown event', () => assert.throws(() => {
      handleChangeEvent({ type: 'whatevs' });
    }, Error, /Unknown global event/));
  });
});
