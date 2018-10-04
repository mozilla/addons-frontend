import * as addonManager from 'core/addonManager';
import {
  GLOBAL_EVENTS,
  GLOBAL_EVENT_STATUS_MAP,
  INSTALL_EVENT_LIST,
  ON_OPERATION_CANCELLED_EVENT,
  SET_ENABLE_NOT_AVAILABLE,
} from 'core/constants';
import { unexpectedSuccess } from 'tests/unit/helpers';

const fakeClientAddon = (overrides = {}) => ({
  canUninstall: false,
  description: 'some desc',
  id: 'some@guid',
  isActive: true,
  isEnabled: true,
  name: 'addon name',
  setEnabled: sinon.stub(),
  type: 'extension',
  uninstall: sinon.stub(),
  version: '1.2.3',
  ...overrides,
});

describe(__filename, () => {
  let fakeCallback;
  let fakeInstallObj;
  let fakeInstallUrl;
  let fakeMozAddonManager;

  beforeEach(() => {
    fakeCallback = sinon.stub();
    fakeInstallUrl = 'https://fake-install-url/foo.xpi';
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
      expect(
        addonManager.hasAddonManager({ navigator: { mozAddonManager: {} } }),
      ).toBeTruthy();
    });

    it('is false if mozAddonManager is not in navigator', () => {
      expect(addonManager.hasAddonManager()).toEqual(false);
    });
  });

  describe('hasPermissionPromptsEnabled', () => {
    it('is undefined if mozAddonManager is not available', () => {
      expect(addonManager.hasPermissionPromptsEnabled()).toEqual(undefined);
    });

    it('is undefined if permissionPromptsEnabled is undefined', () => {
      expect(
        addonManager.hasPermissionPromptsEnabled({
          navigator: {
            mozAddonManager: {},
          },
        }),
      ).toEqual(undefined);
    });

    it('is false if hasPermissionPromptsEnabled is false', () => {
      expect(
        addonManager.hasPermissionPromptsEnabled({
          navigator: {
            mozAddonManager: {
              permissionPromptsEnabled: false,
            },
          },
        }),
      ).toEqual(false);
    });

    it('is true if hasPermissionPromptsEnabled is true', () => {
      expect(
        addonManager.hasPermissionPromptsEnabled({
          navigator: {
            mozAddonManager: {
              permissionPromptsEnabled: true,
            },
          },
        }),
      ).toEqual(true);
    });
  });

  describe('getAddon()', () => {
    it('should call mozAddonManager.getAddonByID() with id', async () => {
      const fakeAddon = { ...fakeClientAddon };
      fakeMozAddonManager.getAddonByID.returns(Promise.resolve(fakeAddon));

      await addonManager.getAddon('test-id', {
        _mozAddonManager: fakeMozAddonManager,
      });

      sinon.assert.calledWith(fakeMozAddonManager.getAddonByID, 'test-id');
    });

    it('should reject if mozAddonManager.getAddonByID() resolves with falsey addon', () => {
      fakeMozAddonManager.getAddonByID.returns(Promise.resolve(false));
      return addonManager
        .getAddon('test-id', { _mozAddonManager: fakeMozAddonManager })
        .then(unexpectedSuccess, (err) =>
          expect(err.message).toEqual('Addon not found'),
        );
    });

    it('rejects if thre is no addon manager', () => {
      sinon.stub(addonManager, 'hasAddonManager').returns(false);
      return addonManager
        .getAddon('foo')
        .then(unexpectedSuccess, (err) =>
          expect(err.message).toEqual('Cannot check add-on status'),
        );
    });
  });

  describe('install()', () => {
    it('should call mozAddonManager.createInstall() with url', async () => {
      await addonManager.install(fakeInstallUrl, fakeCallback, {
        _mozAddonManager: fakeMozAddonManager,
        src: 'home',
      });

      sinon.assert.calledWith(fakeMozAddonManager.createInstall, {
        url: `${fakeInstallUrl}?src=home`,
        hash: undefined,
      });
    });

    it('passes the hash to createInstall() if provided', async () => {
      const hash = 'some-sha-hash';

      await addonManager.install(fakeInstallUrl, fakeCallback, {
        _mozAddonManager: fakeMozAddonManager,
        src: 'home',
        hash,
      });

      sinon.assert.calledWith(fakeMozAddonManager.createInstall, {
        url: `${fakeInstallUrl}?src=home`,
        hash,
      });
    });

    it('should call installObj.addEventListener to setup events', async () => {
      await addonManager.install(fakeInstallUrl, fakeCallback, {
        _mozAddonManager: fakeMozAddonManager,
        src: 'home',
      });

      // It registers an extra onInstallFailed and onInstallEnded listener.
      sinon.assert.callCount(
        fakeInstallObj.addEventListener,
        INSTALL_EVENT_LIST.length + 2,
      );
    });

    it('should call installObj.install()', async () => {
      await addonManager.install(fakeInstallUrl, fakeCallback, {
        _mozAddonManager: fakeMozAddonManager,
        src: 'home',
      });

      sinon.assert.called(fakeInstallObj.install);
    });

    it('rejects if the install fails', () => {
      fakeInstallObj.install = sinon.spy(function install() {
        this.onInstallFailedListener();
      });

      return (
        addonManager
          .install(fakeInstallUrl, fakeCallback, {
            _mozAddonManager: fakeMozAddonManager,
            src: 'home',
          })
          // The second argument is the reject function.
          .then(unexpectedSuccess, () => {
            sinon.assert.calledOnce(fakeInstallObj.install);
          })
      );
    });

    it('passes the installObj, the event and the id to the callback', async () => {
      const fakeEvent = { type: 'fakeEvent' };

      await addonManager.install(fakeInstallUrl, fakeCallback, {
        _mozAddonManager: fakeMozAddonManager,
        src: 'home',
      });

      fakeInstallObj.onDownloadProgressListener(fakeEvent);

      sinon.assert.calledWith(fakeCallback, fakeInstallObj, fakeEvent);
    });

    it('requires a src', () => {
      return addonManager
        .install(fakeInstallUrl, fakeCallback, {
          _mozAddonManager: fakeMozAddonManager,
        })
        .then(unexpectedSuccess, (e) => {
          expect(e.message).toEqual('No src for add-on install');
        });
    });
  });

  describe('uninstall()', () => {
    it('should reject if getAddonByID resolves with falsey value', () => {
      fakeMozAddonManager.getAddonByID.returns(Promise.resolve(false));
      // If the code doesn't resolve this will blow up.
      return addonManager
        .uninstall('test-id', { _mozAddonManager: fakeMozAddonManager })
        .then(unexpectedSuccess, (err) =>
          expect(err.message).toEqual('Addon not found'),
        );
    });

    it('should reject if addon.uninstall resolves with false', () => {
      const fakeAddon = fakeClientAddon({
        uninstall: sinon.stub().resolves(false),
      });
      fakeMozAddonManager.getAddonByID.returns(Promise.resolve(fakeAddon));
      return addonManager
        .uninstall('test-id', { _mozAddonManager: fakeMozAddonManager })
        .then(unexpectedSuccess, (err) =>
          expect(err.message).toEqual('Uninstall failed'),
        );
    });

    it('should resolve if addon.uninstall resolves with true', () => {
      const fakeAddon = fakeClientAddon({
        uninstall: sinon.stub().resolves(true),
      });
      fakeMozAddonManager.getAddonByID.returns(Promise.resolve(fakeAddon));
      // If the code doesn't resolve this will blow up.
      return addonManager.uninstall('test-id', {
        _mozAddonManager: fakeMozAddonManager,
      });
    });

    it('should resolve if addon.uninstall just resolves', () => {
      const fakeAddon = fakeClientAddon({
        uninstall: sinon.stub().resolves(),
      });
      fakeMozAddonManager.getAddonByID.returns(Promise.resolve(fakeAddon));
      // If the code doesn't resolve this will blow up.
      return addonManager.uninstall('test-id', {
        _mozAddonManager: fakeMozAddonManager,
      });
    });
  });

  describe('addChangeListener', () => {
    const fakeEventCallback = sinon.stub();

    beforeEach(() => {
      fakeEventCallback.resetHistory();
    });

    describe('global events', () => {
      const handleChangeEvent = addonManager.addChangeListeners(
        fakeEventCallback,
        fakeMozAddonManager,
      );

      GLOBAL_EVENTS.forEach((event) => {
        const status = GLOBAL_EVENT_STATUS_MAP[event];

        it(`calls callback with status ${status}`, async () => {
          const id = 'foo@whatever';
          const needsRestart = false;

          await handleChangeEvent({ id, needsRestart, type: event });

          sinon.assert.calledWith(fakeEventCallback, {
            guid: id,
            needsRestart,
            status,
          });
        });
      });
    });

    it('throws on unknown event', () => {
      const handleChangeEvent = addonManager.addChangeListeners(
        fakeEventCallback,
        fakeMozAddonManager,
      );

      expect(() => {
        handleChangeEvent({ type: 'whatevs' });
      }).toThrowError(/Unknown global event/);
    });

    it('listens to onOperationCancelled', () => {
      addonManager.addChangeListeners(fakeEventCallback, fakeMozAddonManager);

      sinon.assert.calledWith(
        fakeMozAddonManager.addEventListener,
        ON_OPERATION_CANCELLED_EVENT,
      );
    });

    it('calls the callback when onOperationCancelled is received', async () => {
      const _log = {
        info: sinon.stub(),
        error: sinon.spy(),
      };
      const fakeAddon = fakeClientAddon();
      fakeMozAddonManager.getAddonByID.resolves(fakeAddon);

      const handleChangeEvent = addonManager.addChangeListeners(
        fakeEventCallback,
        fakeMozAddonManager,
        { _log },
      );

      const guid = 'foo@whatever';
      const needsRestart = false;

      await handleChangeEvent({
        id: guid,
        needsRestart,
        type: ON_OPERATION_CANCELLED_EVENT,
      });

      sinon.assert.calledWith(fakeEventCallback, {
        guid,
        needsRestart,
        status: addonManager.getAddonStatus({ addon: fakeAddon }),
      });
      sinon.assert.notCalled(_log.error);
    });

    it('logs an error when onOperationCancelled has failed', async () => {
      const _log = {
        info: sinon.stub(),
        error: sinon.spy(),
      };
      fakeMozAddonManager.getAddonByID.resolves(null);

      const handleChangeEvent = addonManager.addChangeListeners(
        fakeEventCallback,
        fakeMozAddonManager,
        { _log },
      );

      const guid = 'foo@whatever';
      const needsRestart = false;

      await handleChangeEvent({
        id: guid,
        needsRestart,
        type: ON_OPERATION_CANCELLED_EVENT,
      });

      sinon.assert.notCalled(fakeEventCallback);
      sinon.assert.calledOnce(_log.error);
    });
  });

  describe('enable()', () => {
    it('should call addon.setEnable()', async () => {
      const fakeAddon = fakeClientAddon();
      fakeMozAddonManager.getAddonByID.returns(Promise.resolve(fakeAddon));

      await addonManager.enable('whatever', {
        _mozAddonManager: fakeMozAddonManager,
      });

      sinon.assert.calledWith(fakeAddon.setEnabled, true);
    });

    it('should throw if addon.setEnabled does not exist', () => {
      const fakeAddon = fakeClientAddon({
        setEnabled: undefined,
      });
      fakeMozAddonManager.getAddonByID.returns(Promise.resolve(fakeAddon));

      return addonManager
        .enable('whatevs', { _mozAddonManager: fakeMozAddonManager })
        .then(unexpectedSuccess, (err) => {
          expect(err.message).toEqual(SET_ENABLE_NOT_AVAILABLE);
        });
    });
  });
});
