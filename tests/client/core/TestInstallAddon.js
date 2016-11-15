import config from 'config';

import {
  DISABLED,
  DOWNLOAD_FAILED,
  DOWNLOAD_PROGRESS,
  ENABLED,
  ERROR,
  EXTENSION_TYPE,
  FATAL_ERROR,
  FATAL_INSTALL_ERROR,
  FATAL_UNINSTALL_ERROR,
  INSTALL_FAILED,
  INSTALL_STATE,
  START_DOWNLOAD,
  THEME_TYPE,
  UNINSTALLED,
  UNINSTALLING,
} from 'core/constants';
import {
  CLOSE_INFO,
  INSTALL_CATEGORY,
  SET_ENABLE_NOT_AVAILABLE,
  SHOW_INFO,
  UNINSTALL_CATEGORY,
} from 'disco/constants';
import {
  getFakeAddonManagerWrapper, getFakeI18nInst,
} from 'tests/client/helpers';
import { makeProgressHandler, mapDispatchToProps } from 'core/installAddon';


describe('withInstallHelpers', () => {
  describe('setCurrentStatus', () => {
    it('sets the status to ENABLED when an enabled add-on found', () => {
      const dispatch = sinon.spy();
      const guid = '@foo';
      const installURL = 'http://the.url';
      const { setCurrentStatus } = mapDispatchToProps(
        dispatch, { _addonManager: getFakeAddonManagerWrapper(), guid, installURL });
      return setCurrentStatus()
        .then(() => {
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: { guid, status: ENABLED, url: installURL },
          }));
        });
    });

    it('sets the status to DISABLED when a disabled add-on found', () => {
      const dispatch = sinon.spy();
      const guid = '@foo';
      const installURL = 'http://the.url';
      const { setCurrentStatus } = mapDispatchToProps(dispatch, {
        _addonManager: getFakeAddonManagerWrapper({
          getAddon: Promise.resolve({ type: EXTENSION_TYPE, isActive: false, isEnabled: false }),
        }),
        guid,
        installURL,
      });
      return setCurrentStatus()
        .then(() => {
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: { guid, status: DISABLED, url: installURL },
          }));
        });
    });

    it('sets the status to DISABLED when an inactive add-on found', () => {
      const dispatch = sinon.spy();
      const guid = '@foo';
      const installURL = 'http://the.url';
      const { setCurrentStatus } = mapDispatchToProps(dispatch, {
        _addonManager: getFakeAddonManagerWrapper({
          getAddon: Promise.resolve({ type: EXTENSION_TYPE, isActive: false, isEnabled: true }),
        }),
        guid,
        installURL,
      });
      return setCurrentStatus()
        .then(() => {
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: { guid, status: DISABLED, url: installURL },
          }));
        });
    });

    it('sets the status to ENABLED when an enabled theme is found', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper({
        getAddon: Promise.resolve({ type: THEME_TYPE, isActive: true, isEnabled: true }),
      });
      const dispatch = sinon.spy();
      const guid = '@foo';
      const installURL = 'http://the.url';
      const { setCurrentStatus } =
        mapDispatchToProps(dispatch, { _addonManager: fakeAddonManager, guid, installURL });
      return setCurrentStatus()
        .then(() => {
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: { guid, status: ENABLED, url: installURL },
          }));
        });
    });

    it('sets the status to DISABLED when an inactive theme is found', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper({
        getAddon: Promise.resolve({ type: THEME_TYPE, isActive: false, isEnabled: true }),
      });
      const dispatch = sinon.spy();
      const guid = '@foo';
      const installURL = 'http://the.url';
      const { setCurrentStatus } =
        mapDispatchToProps(dispatch, { _addonManager: fakeAddonManager, guid, installURL });
      return setCurrentStatus()
        .then(() => {
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: { guid, status: DISABLED, url: installURL },
          }));
        });
    });

    it('sets the status to DISABLED when a disabled theme is found', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper({
        getAddon: Promise.resolve({ type: THEME_TYPE, isActive: true, isEnabled: false }),
      });
      const dispatch = sinon.spy();
      const guid = '@foo';
      const installURL = 'http://the.url';
      const { setCurrentStatus } =
        mapDispatchToProps(dispatch, { _addonManager: fakeAddonManager, guid, installURL });
      return setCurrentStatus()
        .then(() => {
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: { guid, status: DISABLED, url: installURL },
          }));
        });
    });

    it('sets the status to UNINSTALLED when not found', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper({ getAddon: Promise.reject() });
      const dispatch = sinon.spy();
      const guid = '@foo';
      const installURL = 'http://the.url';
      const { setCurrentStatus } =
        mapDispatchToProps(dispatch, { _addonManager: fakeAddonManager, guid, installURL });
      return setCurrentStatus()
        .then(() => {
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: { guid, status: UNINSTALLED, url: installURL },
          }));
        });
    });

    it('dispatches error when setCurrentStatus then() gets exception', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper({ getAddon: Promise.resolve() });
      const guid = '@foo';
      const installURL = 'http://the.url';
      const dispatch = sinon.stub();
      dispatch.onFirstCall().returns(Promise.reject());
      const { setCurrentStatus } =
        mapDispatchToProps(dispatch, { _addonManager: fakeAddonManager, guid, installURL });
      return setCurrentStatus()
        .then(() => {
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: { guid, status: ERROR, error: FATAL_ERROR },
          }), 'dispatch was not called with FATAL_ERROR');
        });
    });
  });

  describe('makeProgressHandler', () => {
    it('sets the download progress on STATE_DOWNLOADING', () => {
      const dispatch = sinon.spy();
      const guid = 'foo@addon';
      const handler = makeProgressHandler(dispatch, guid);
      handler({ state: 'STATE_DOWNLOADING', progress: 300, maxProgress: 990 });
      assert(dispatch.calledWith({
        type: DOWNLOAD_PROGRESS,
        payload: { downloadProgress: 30, guid },
      }));
    });

    it('sets status to error on onDownloadFailed', () => {
      const dispatch = sinon.spy();
      const guid = '{my-addon}';
      const i18n = getFakeI18nInst();
      const handler = makeProgressHandler(dispatch, guid, i18n);
      handler({ state: 'STATE_SOMETHING' }, { type: 'onDownloadFailed' });
      assert(dispatch.calledWith({
        type: 'INSTALL_ERROR',
        payload: { guid, error: DOWNLOAD_FAILED },
      }));
    });

    it('sets status to error on onInstallFailed', () => {
      const dispatch = sinon.spy();
      const guid = '{my-addon}';
      const i18n = getFakeI18nInst();
      const handler = makeProgressHandler(dispatch, guid, i18n);
      handler({ state: 'STATE_SOMETHING' }, { type: 'onInstallFailed' });
      assert(dispatch.calledWith({
        type: 'INSTALL_ERROR',
        payload: { guid, error: INSTALL_FAILED },
      }));
    });
  });

  describe('enable', () => {
    const guid = '@enable';
    const name = 'whatever addon';
    const iconUrl = 'something.jpg';

    it('calls addonManager.enable()', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const dispatch = sinon.spy();
      const i18n = getFakeI18nInst();
      const { enable } = mapDispatchToProps(
        dispatch,
        { name, iconUrl, guid, _addonManager: fakeAddonManager, i18n });
      const fakeShowInfo = sinon.stub();
      return enable({ _showInfo: fakeShowInfo })
        .then(() => {
          assert.ok(fakeAddonManager.enable.calledWith(guid));
          assert.ok(fakeShowInfo.calledWith({ name, i18n, iconUrl }));
        });
    });

    it('dispatches a FATAL_ERROR', () => {
      const fakeAddonManager = {
        enable: sinon.stub().returns(Promise.reject(new Error('hai'))),
      };
      const dispatch = sinon.spy();
      const i18n = getFakeI18nInst();
      const { enable } = mapDispatchToProps(
        dispatch,
        { name, iconUrl, guid, _addonManager: fakeAddonManager, i18n });
      return enable()
        .then(() => {
          assert.ok(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: { guid, status: ERROR, error: FATAL_ERROR },
          }));
        });
    });

    it('does not dispatch a FATAL_ERROR when setEnabled is missing', () => {
      const fakeAddonManager = {
        enable: sinon.stub().returns(Promise.reject(new Error(SET_ENABLE_NOT_AVAILABLE))),
      };
      const dispatch = sinon.spy();
      const i18n = getFakeI18nInst();
      const { enable } = mapDispatchToProps(
        dispatch,
        { name, iconUrl, guid, _addonManager: fakeAddonManager, i18n });
      return enable()
        .then(() => {
          assert.notOk(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: { guid, status: ERROR, error: FATAL_ERROR },
          }));
        });
    });
  });

  describe('install', () => {
    const guid = '@install';
    const installURL = 'https://mysite.com/download.xpi';

    it('calls addonManager.install()', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const dispatch = sinon.spy();
      const i18n = getFakeI18nInst();
      const { install } = mapDispatchToProps(
        dispatch,
        { _addonManager: fakeAddonManager, i18n, installURL });
      return install({ guid, installURL })
        .then(() => {
          assert(fakeAddonManager.install.calledWith(installURL, sinon.match.func));
        });
    });

    it('tracks an addon install', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const name = 'hai-addon';
      const type = 'extension';
      const i18n = getFakeI18nInst();
      const dispatch = sinon.spy();
      const fakeTracking = {
        sendEvent: sinon.spy(),
      };
      const { install } = mapDispatchToProps(
        dispatch,
        { _tracking: fakeTracking, _addonManager: fakeAddonManager, i18n, name });
      return install({ guid, installURL, name, type })
        .then(() => {
          assert(fakeTracking.sendEvent.calledWith({
            action: 'addon',
            category: INSTALL_CATEGORY,
            label: 'hai-addon',
          }));
        });
    });

    it('should dispatch START_DOWNLOAD', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const i18n = getFakeI18nInst();
      const dispatch = sinon.spy();
      const { install } = mapDispatchToProps(
        dispatch,
        { _addonManager: fakeAddonManager, guid, i18n });
      return install({ guid, installURL })
        .then(() => assert(dispatch.calledWith({
          type: START_DOWNLOAD,
          payload: { guid },
        })));
    });

    it('should dispatch SHOW_INFO', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const i18n = getFakeI18nInst();
      const dispatch = sinon.spy();
      const iconUrl = 'whatevs';
      const name = 'test-addon';

      const fakeConfig = {
        has: sinon.stub().withArgs('useUiTour').returns(false),
      };
      const { install } = mapDispatchToProps(
        dispatch,
        {
          _addonManager: fakeAddonManager,
          _config: fakeConfig,
          i18n,
          iconUrl,
          name,
        });
      return install({ guid, installURL })
        .then(() => {
          assert(dispatch.calledWith({
            type: SHOW_INFO,
            payload: {
              addonName: 'test-addon',
              imageURL: iconUrl,
              closeAction: sinon.match.func,
            },
          }));

          // Grab the first arg of second call.
          const arg = dispatch.getCall(1).args[0];
          // Prove we're looking at the SHOW_INFO dispatch.
          assert.equal(arg.type, SHOW_INFO);

          // Test that close action dispatches.
          arg.payload.closeAction();
          assert(dispatch.calledWith({
            type: CLOSE_INFO,
          }));
        });
    });

    it('should use uiTour', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const i18n = getFakeI18nInst();
      const dispatch = sinon.spy();
      const iconUrl = 'whatevs';
      const name = 'test-addon';

      const fakeConfig = {
        has: sinon.stub().withArgs('useUiTour').returns(true),
        get: sinon.stub().withArgs('useUiTour').returns(true),
      };
      const fakeDispatchEvent = sinon.stub();
      const { install } = mapDispatchToProps(
        dispatch,
        {
          _addonManager: fakeAddonManager,
          _dispatchEvent: fakeDispatchEvent,
          _config: fakeConfig,
          i18n,
          iconUrl,
          name,
        });
      return install({ guid, installURL })
        .then(() => assert.ok(fakeDispatchEvent.called));
    });

    it('dispatches error when addonManager.install throws', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      fakeAddonManager.install = sinon.stub().returns(Promise.reject());
      const i18n = getFakeI18nInst();
      const dispatch = sinon.stub();
      const { install } = mapDispatchToProps(
        dispatch,
        { _addonManager: fakeAddonManager, guid, i18n });

      return install({ guid, installURL })
        .then(() => {
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: { guid, status: ERROR, error: FATAL_INSTALL_ERROR },
          }), 'dispatch was not called with FATAL_INSTALL_ERROR');
        });
    });
  });

  describe('uninstall', () => {
    const guid = '@uninstall';
    const installURL = 'https://mysite.com/download.xpi';

    it('calls addonManager.uninstall()', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const dispatch = sinon.spy();
      const { uninstall } = mapDispatchToProps(dispatch, { _addonManager: fakeAddonManager });
      return uninstall({ guid, installURL })
        .then(() => {
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: {
              guid,
              status: UNINSTALLING,
            },
          }));
          assert(fakeAddonManager.uninstall.calledWith(guid));
        });
    });

    it('dispatches error when addonManager.uninstall throws', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      fakeAddonManager.uninstall = sinon.stub().returns(Promise.reject());
      const dispatch = sinon.spy();
      const { uninstall } = mapDispatchToProps(dispatch, { _addonManager: fakeAddonManager });
      return uninstall({ guid, installURL })
        .then(() => {
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: {
              guid,
              status: UNINSTALLING,
            },
          }));
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: { guid, status: ERROR, error: FATAL_UNINSTALL_ERROR },
          }), 'dispatch was not called with FATAL_UNINSTALL_ERROR');
        });
    });

    it('tracks an addon uninstall', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const dispatch = sinon.spy();
      const name = 'whatevs';
      const type = 'extension';
      const fakeTracking = {
        sendEvent: sinon.spy(),
      };
      const { uninstall } = mapDispatchToProps(dispatch,
        { _tracking: fakeTracking, _addonManager: fakeAddonManager });
      return uninstall({ guid, installURL, name, type })
        .then(() => {
          assert.ok(fakeTracking.sendEvent.calledWith({
            action: 'addon',
            category: UNINSTALL_CATEGORY,
            label: 'whatevs',
          }), 'correctly called');
        });
    });

    it('tracks a theme uninstall', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const dispatch = sinon.spy();
      const name = 'whatevs';
      const fakeTracking = {
        sendEvent: sinon.spy(),
      };
      const { uninstall } = mapDispatchToProps(dispatch,
        { _tracking: fakeTracking, _addonManager: fakeAddonManager });
      return uninstall({ guid, installURL, name, type: THEME_TYPE })
        .then(() => {
          assert(fakeTracking.sendEvent.calledWith({
            action: 'theme',
            category: UNINSTALL_CATEGORY,
            label: 'whatevs',
          }));
        });
    });

    it('tracks a unknown type uninstall', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const dispatch = sinon.spy();
      const name = 'whatevs';
      const type = 'foo';
      const fakeTracking = {
        sendEvent: sinon.spy(),
      };
      const { uninstall } = mapDispatchToProps(dispatch,
        { _tracking: fakeTracking, _addonManager: fakeAddonManager });
      return uninstall({ guid, installURL, name, type })
        .then(() => {
          assert(fakeTracking.sendEvent.calledWith({
            action: 'invalid',
            category: UNINSTALL_CATEGORY,
            label: 'whatevs',
          }));
        });
    });
  });

  describe('mapDispatchToProps', () => {
    it('is empty when there is no navigator', () => {
      const configStub = sinon.stub(config, 'get').returns(true);
      assert.deepEqual(mapDispatchToProps(sinon.spy()), {});
      assert(configStub.calledOnce);
      assert(configStub.calledWith('server'));
    });
  });
});
