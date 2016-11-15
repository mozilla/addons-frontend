import * as addonManager from 'core/addonManager';
import { installEventList } from 'core/constants';
import {
  globalEventStatusMap,
  SET_ENABLE_NOT_AVAILABLE,
} from 'disco/constants';
import { unexpectedSuccess } from 'tests/client/helpers';


describe('addonManager', () => {
  let fakeAddon;
  let fakeCallback;
  let fakeInstallObj;
  let fakeInstallUrl;
  let fakeMozAddonManager;

  beforeEach(() => {
    fakeCallback = sinon.stub();
    fakeInstallUrl = 'https://fake-install-url/foo.xpi';
    fakeAddon = {
      uninstall: sinon.stub(),
    };
    fakeInstallObj = {
      addEventListener: sinon.spy(function addEventListener(eventName, cb) {
        this[`${eventName}Listener`] = cb;
      }),
      install: sinon.spy(function install() {
        this.onInstallEndedListener();
      }),
    };
    fakeMozAddonManager = {
      createInstall: sinon.stub().returns(Promise.resolve(fakeInstallObj)),
      getAddonByID: sinon.stub(),
      addEventListener: sinon.stub(),
    };
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
    it(
      'should call mozAddonManager.createInstall() with url',
      () => addonManager.install(
        fakeInstallUrl, fakeCallback, { _mozAddonManager: fakeMozAddonManager })
        .then(() => {
          assert.ok(fakeMozAddonManager.createInstall.calledWith(
            { url: `${fakeInstallUrl}?src=discovery-promo` }));
        }));

    it(
      'should call installObj.addEventListener to setup events',
      () => addonManager.install(
        fakeInstallUrl, fakeCallback, { _mozAddonManager: fakeMozAddonManager })
        .then(() => {
          // It registers an extra onInstallFailed and onInstallEnded listener.
          assert.equal(fakeInstallObj.addEventListener.callCount, installEventList.length + 2);
        }));

    it('should call installObj.install()', () => addonManager.install(
      fakeInstallUrl, fakeCallback, { _mozAddonManager: fakeMozAddonManager })
      .then(() => {
        assert.ok(fakeInstallObj.install.called);
      }));

    it('rejects if the install fails', () => {
      fakeInstallObj.install = sinon.spy(function install() {
        this.onInstallFailedListener();
      });
      return addonManager.install(
        fakeInstallUrl, fakeCallback, { _mozAddonManager: fakeMozAddonManager })
        .then(
          unexpectedSuccess,
          () => assert.ok(fakeInstallObj.install.called));
    });

    it('passes the installObj, the event and the id to the callback', () => {
      const fakeEvent = { type: 'fakeEvent' };
      return addonManager.install(
        fakeInstallUrl, fakeCallback, { _mozAddonManager: fakeMozAddonManager })
        .then(() => {
          fakeInstallObj.onDownloadProgressListener(fakeEvent);
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

  describe('enable()', () => {
    it('should call addon.setEnable()', () => {
      fakeAddon = {
        setEnabled: sinon.stub(),
      };
      fakeMozAddonManager.getAddonByID.returns(Promise.resolve(fakeAddon));
      return addonManager.enable('whatever', { _mozAddonManager: fakeMozAddonManager })
        .then(() => {
          assert.ok(fakeAddon.setEnabled.calledWith(true));
        });
    });

    it('should throw if addon.setEnable does not exist', () => {
      fakeAddon = {};
      fakeMozAddonManager.getAddonByID.returns(Promise.resolve(fakeAddon));
      return addonManager.enable('whatevs', { _mozAddonManager: fakeMozAddonManager })
        .then(unexpectedSuccess, (err) => {
          assert.equal(err.message, SET_ENABLE_NOT_AVAILABLE);
        });
    });
  });
});
