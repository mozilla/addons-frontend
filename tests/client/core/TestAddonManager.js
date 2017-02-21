import * as addonManager from 'core/addonManager';
import {
  GLOBAL_EVENT_STATUS_MAP,
  GLOBAL_EVENTS,
  INSTALL_EVENT_LIST,
  SET_ENABLE_NOT_AVAILABLE,
} from 'core/constants';
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

  describe('hasAddonManager', () => {
    it('is true if mozAddonManager is in navigator', () => {
      assert.ok(addonManager.hasAddonManager({ navigator: { mozAddonManager: {} } }));
    });

    it('is false if mozAddonManager is not in navigator', () => {
      assert.notOk(addonManager.hasAddonManager());
    });

    it('is undefined if there is no window', () => {
      assert.equal(addonManager.hasAddonManager({ hasWindow: () => false }), undefined);
    });
  });

  describe('hasPermissionPromptsEnabled', () => {
    it('is undefined if mozAddonManager is not available', () => {
      assert.equal(addonManager.hasPermissionPromptsEnabled(), undefined);
    });

    it('is undefined if permissionPromptsEnabled is undefined', () => {
      assert.equal(addonManager.hasPermissionPromptsEnabled({
        navigator: {
          mozAddonManager: {},
        },
      }), undefined);
    });

    it('is false if hasPermissionPromptsEnabled is false', () => {
      assert.equal(addonManager.hasPermissionPromptsEnabled({
        navigator: {
          mozAddonManager: {
            permissionPromptsEnabled: false,
          },
        },
      }), false);
    });

    it('is true if hasPermissionPromptsEnabled is true', () => {
      assert.equal(addonManager.hasPermissionPromptsEnabled({
        navigator: {
          mozAddonManager: {
            permissionPromptsEnabled: true,
          },
        },
      }), true);
    });
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

    it('rejects if thre is no addon manager', () => {
      sinon.stub(addonManager, 'hasAddonManager').returns(false);
      return addonManager.getAddon('foo')
        .then(unexpectedSuccess, (err) => assert.equal(err.message, 'Cannot check add-on status'));
    });
  });

  describe('install()', () => {
    it(
      'should call mozAddonManager.createInstall() with url',
      () => addonManager.install(
        fakeInstallUrl, fakeCallback, { _mozAddonManager: fakeMozAddonManager, src: 'home' })
        .then(() => {
          assert.ok(fakeMozAddonManager.createInstall.calledWith(
            { url: `${fakeInstallUrl}?src=home` }));
        }));

    it(
      'should call installObj.addEventListener to setup events',
      () => addonManager.install(
        fakeInstallUrl, fakeCallback, { _mozAddonManager: fakeMozAddonManager, src: 'home' })
        .then(() => {
          // It registers an extra onInstallFailed and onInstallEnded listener.
          assert.equal(fakeInstallObj.addEventListener.callCount, INSTALL_EVENT_LIST.length + 2);
        }));

    it('should call installObj.install()', () => addonManager.install(
      fakeInstallUrl, fakeCallback, { _mozAddonManager: fakeMozAddonManager, src: 'home' })
      .then(() => {
        assert.ok(fakeInstallObj.install.called);
      }));

    it('rejects if the install fails', () => {
      fakeInstallObj.install = sinon.spy(function install() {
        this.onInstallFailedListener();
      });
      return addonManager.install(
        fakeInstallUrl, fakeCallback, { _mozAddonManager: fakeMozAddonManager, src: 'home' })
        .then(
          unexpectedSuccess,
          () => assert.ok(fakeInstallObj.install.called));
    });

    it('passes the installObj, the event and the id to the callback', () => {
      const fakeEvent = { type: 'fakeEvent' };
      return addonManager.install(
        fakeInstallUrl, fakeCallback, { _mozAddonManager: fakeMozAddonManager, src: 'home' })
        .then(() => {
          fakeInstallObj.onDownloadProgressListener(fakeEvent);
          assert.ok(fakeCallback.calledWith(fakeInstallObj, fakeEvent));
        });
    });

    it('requires a src', () => (
      addonManager.install(
        fakeInstallUrl, fakeCallback, { _mozAddonManager: fakeMozAddonManager })
          .then(unexpectedSuccess,
            (e) => assert.equal(e.message, 'No src for add-on install'))
    ));
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

    GLOBAL_EVENTS.forEach((event) => {
      const status = GLOBAL_EVENT_STATUS_MAP[event];
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
