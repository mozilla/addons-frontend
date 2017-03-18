import config from 'config';
import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';

import createStore from 'amo/store';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  CLOSE_INFO,
  DISABLED,
  DOWNLOAD_FAILED,
  DOWNLOAD_PROGRESS,
  ENABLED,
  ERROR,
  FATAL_ERROR,
  FATAL_INSTALL_ERROR,
  FATAL_UNINSTALL_ERROR,
  INSTALL_CATEGORY,
  INSTALL_FAILED,
  INSTALL_STATE,
  INSTALLED,
  SET_ENABLE_NOT_AVAILABLE,
  SHOW_INFO,
  START_DOWNLOAD,
  THEME_INSTALL,
  THEME_PREVIEW,
  THEME_RESET_PREVIEW,
  TRACKING_TYPE_EXTENSION,
  TRACKING_TYPE_THEME,
  UNINSTALL_CATEGORY,
  UNINSTALLED,
  UNINSTALLING,
} from 'core/constants';
import {
  getFakeAddonManagerWrapper, shallowRender,
} from 'tests/client/helpers';
import * as installAddon from 'core/installAddon';
import * as themePreview from 'core/themePreview';

const {
  WithInstallHelpers, installTheme, makeProgressHandler, makeMapDispatchToProps,
  mapStateToProps, withInstallHelpers,
} = installAddon;


describe('withInstallHelpers', () => {
  it('connects mapDispatchToProps for the component', () => {
    const _makeMapDispatchToProps = sinon.spy();
    const WrappedComponent = sinon.stub();
    withInstallHelpers({ src: 'Howdy', _makeMapDispatchToProps })(WrappedComponent);
    assert.ok(_makeMapDispatchToProps.calledWith({ WrappedComponent, src: 'Howdy' }));
  });

  it('wraps the component in WithInstallHelpers', () => {
    const _makeMapDispatchToProps = sinon.spy();
    const Component = withInstallHelpers({ src: 'Howdy', _makeMapDispatchToProps })(() => {});
    const store = createStore();
    const root = shallowRender(<Component store={store} />);
    assert.equal(root.type, WithInstallHelpers);
  });

  it('throws without a src', () => {
    assert.throws(() => {
      withInstallHelpers({})(() => {});
    }, /src is required/);
  });

  it('sets the current status in componentDidMount with an addonManager', () => {
    const setCurrentStatus = sinon.spy();
    renderIntoDocument(
      <WithInstallHelpers WrappedComponent={() => <div />} hasAddonManager
      setCurrentStatus={setCurrentStatus} />);
    assert.ok(setCurrentStatus.called);
  });

  it('does not set the current status in componentDidMount without an addonManager', () => {
    const setCurrentStatus = sinon.spy();
    renderIntoDocument(
      <WithInstallHelpers WrappedComponent={() => <div />} hasAddonManager={false}
      setCurrentStatus={setCurrentStatus} />);
    assert.notOk(setCurrentStatus.called);
  });
});

describe('withInstallHelpers inner functions', () => {
  const src = 'TestInstallAddon';
  const WrappedComponent = sinon.stub();
  let mapDispatchToProps;

  function getMapStateToProps({ _tracking, installations = {}, state = {} } = {}) {
    return mapStateToProps({ installations, addons: {} }, state, { _tracking });
  }

  before(() => {
    mapDispatchToProps = makeMapDispatchToProps({ WrappedComponent, src });
  });

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
          getAddon: Promise.resolve({
            isActive: false,
            isEnabled: false,
            type: ADDON_TYPE_EXTENSION,
          }),
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
          getAddon: Promise.resolve({
            isActive: false,
            isEnabled: true,
            type: ADDON_TYPE_EXTENSION,
          }),
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
        getAddon: Promise.resolve({ type: ADDON_TYPE_THEME, isActive: true, isEnabled: true }),
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
        getAddon: Promise.resolve({
          isActive: false,
          isEnabled: true,
          type: ADDON_TYPE_THEME,
        }),
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
        getAddon: Promise.resolve({
          isActive: true,
          isEnabled: false,
          type: ADDON_TYPE_THEME,
        }),
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
      const handler = makeProgressHandler(dispatch, guid);
      handler({ state: 'STATE_SOMETHING' }, { type: 'onDownloadFailed' });
      assert(dispatch.calledWith({
        type: 'INSTALL_ERROR',
        payload: { guid, error: DOWNLOAD_FAILED },
      }));
    });

    it('sets status to error on onInstallFailed', () => {
      const dispatch = sinon.spy();
      const guid = '{my-addon}';
      const handler = makeProgressHandler(dispatch, guid);
      handler({ state: 'STATE_SOMETHING' }, { type: 'onInstallFailed' });
      assert(dispatch.calledWith({
        type: 'INSTALL_ERROR',
        payload: { guid, error: INSTALL_FAILED },
      }));
    });

    it('does nothing on unknown events', () => {
      const dispatch = sinon.spy();
      const guid = 'foo@addon';
      const handler = makeProgressHandler(dispatch, guid);
      handler({ state: 'WAT' }, { type: 'onNothingPerformed' });
      assert.notOk(dispatch.called);
    });
  });

  describe('enable', () => {
    const guid = '@enable';
    const name = 'whatever addon';
    const iconUrl = 'something.jpg';

    it('calls addonManager.enable() and content notification', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper({
        permissionPromptsEnabled: false,
      });
      const dispatch = sinon.spy();
      const { enable } = mapDispatchToProps(
        dispatch,
        { name, iconUrl, guid, _addonManager: fakeAddonManager });
      const fakeShowInfo = sinon.stub();
      return enable({ _showInfo: fakeShowInfo })
        .then(() => {
          assert.ok(fakeAddonManager.enable.calledWith(guid));
          assert.ok(fakeShowInfo.calledWith({ name, iconUrl }));
        });
    });

    it('calls addonManager.enable() without content notification', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper({
        permissionPromptsEnabled: true,
      });
      const dispatch = sinon.spy();
      const { enable } = mapDispatchToProps(
        dispatch,
        { name, iconUrl, guid, _addonManager: fakeAddonManager });
      const fakeShowInfo = sinon.stub();
      return enable({ _showInfo: fakeShowInfo })
        .then(() => {
          assert.ok(fakeAddonManager.enable.calledWith(guid));
          assert.ok(fakeShowInfo.neverCalledWith({ name, iconUrl }));
        });
    });

    it('dispatches a FATAL_ERROR', () => {
      const fakeAddonManager = {
        enable: sinon.stub().returns(Promise.reject(new Error('hai'))),
      };
      const dispatch = sinon.spy();
      const { enable } = mapDispatchToProps(
        dispatch,
        { name, iconUrl, guid, _addonManager: fakeAddonManager });
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
      const { enable } = mapDispatchToProps(
        dispatch,
        { name, iconUrl, guid, _addonManager: fakeAddonManager });
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
      const { install } = mapDispatchToProps(
        dispatch,
        { _addonManager: fakeAddonManager, installURL });
      return install({ guid, installURL })
        .then(() => {
          assert(fakeAddonManager.install.calledWith(installURL, sinon.match.func, { src }));
        });
    });

    it('tracks an addon install', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const name = 'hai-addon';
      const type = ADDON_TYPE_EXTENSION;
      const dispatch = sinon.spy();
      const fakeTracking = {
        sendEvent: sinon.spy(),
      };
      const { install } = mapDispatchToProps(
        dispatch,
        { _tracking: fakeTracking, _addonManager: fakeAddonManager, name });
      return install({ guid, installURL, name, type })
        .then(() => {
          assert(fakeTracking.sendEvent.calledWith({
            action: TRACKING_TYPE_EXTENSION,
            category: INSTALL_CATEGORY,
            label: 'hai-addon',
          }));
        });
    });

    it('should dispatch START_DOWNLOAD', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const dispatch = sinon.spy();
      const { install } = mapDispatchToProps(
        dispatch,
        { _addonManager: fakeAddonManager, guid });
      return install({ guid, installURL })
        .then(() => assert(dispatch.calledWith({
          type: START_DOWNLOAD,
          payload: { guid },
        })));
    });

    it('should dispatch SHOW_INFO if permissionPromptsEnabled is false', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper({ permissionPromptsEnabled: false });
      const dispatch = sinon.spy();
      const iconUrl = 'whatevs';
      const name = 'test-addon';

      const { install } = mapDispatchToProps(
        dispatch,
        {
          _addonManager: fakeAddonManager,
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

    it('should not dispatch SHOW_INFO if permissionPromptsEnabled is true', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper({ permissionPromptsEnabled: true });
      const dispatch = sinon.spy();
      const iconUrl = 'whatevs';
      const name = 'test-addon';

      const { install } = mapDispatchToProps(
        dispatch,
        {
          _addonManager: fakeAddonManager,
          iconUrl,
          name,
        });
      return install({ guid, installURL })
        .then(() => {
          assert(dispatch.neverCalledWith({
            type: SHOW_INFO,
            payload: {
              addonName: 'test-addon',
              imageURL: iconUrl,
              closeAction: sinon.match.func,
            },
          }));
        });
    });

    it('dispatches error when addonManager.install throws', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      fakeAddonManager.install = sinon.stub().returns(Promise.reject());
      const dispatch = sinon.stub();
      const { install } = mapDispatchToProps(
        dispatch,
        { _addonManager: fakeAddonManager, guid });

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
            action: TRACKING_TYPE_EXTENSION,
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
      return uninstall({ guid, installURL, name, type: ADDON_TYPE_THEME })
        .then(() => {
          assert(fakeTracking.sendEvent.calledWith({
            action: TRACKING_TYPE_THEME,
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
      assert.deepEqual(mapDispatchToProps(sinon.spy()), { WrappedComponent });
      assert(configStub.calledOnce);
      assert(configStub.calledWith('server'));
    });

    it('requires an installURL for extensions', () => {
      assert.throws(() => {
        makeMapDispatchToProps({})(sinon.spy(), { type: ADDON_TYPE_EXTENSION });
      }, /installURL is required/);
      assert.doesNotThrow(() => {
        makeMapDispatchToProps({})(sinon.spy(), {
          installURL: 'foo.com',
          type: ADDON_TYPE_EXTENSION,
        });
      });
      assert.doesNotThrow(() => {
        makeMapDispatchToProps({})(sinon.spy(), { type: ADDON_TYPE_THEME });
      });
    });

    describe('previewTheme', () => {
      it('calls theme action with THEME_PREVIEW', () => {
        const dispatchSpy = sinon.spy();
        const { previewTheme } = makeMapDispatchToProps({})(dispatchSpy, {
          type: ADDON_TYPE_THEME,
          guid: 'fake-guid@whatever',
        });
        const themeAction = sinon.spy();
        const node = sinon.stub();
        previewTheme(node, themeAction);
        assert.ok(themeAction.calledWith(node, THEME_PREVIEW));
        assert.ok(dispatchSpy.calledWith({
          type: THEME_PREVIEW,
          payload: {
            guid: 'fake-guid@whatever',
            themePreviewNode: node,
          },
        }));
      });
    });

    describe('resetThemePreview', () => {
      it('calls theme action with THEME_RESET_PREVIEW', () => {
        const dispatchSpy = sinon.spy();
        const { resetThemePreview } = makeMapDispatchToProps({})(dispatchSpy, {
          type: ADDON_TYPE_THEME,
          guid: 'fake-guid@whatever',
        });
        const themeAction = sinon.spy();
        const node = sinon.stub();
        resetThemePreview(node, themeAction);
        assert.ok(themeAction.calledWith(node, THEME_RESET_PREVIEW));
        assert.ok(dispatchSpy.calledWith({
          type: THEME_RESET_PREVIEW,
          payload: {
            guid: 'fake-guid@whatever',
          },
        }));
      });
    });
  });

  describe('installTheme', () => {
    const baseAddon = {
      name: 'hai-theme',
      guid: '{install-theme}',
      status: UNINSTALLED,
      type: ADDON_TYPE_THEME,
    };

    function installThemeStubs() {
      return {
        _themeAction: sinon.spy(),
        _tracking: {
          sendEvent: sinon.spy(),
        },
      };
    }

    it('installs the theme when it is not installed', () => {
      const addon = { ...baseAddon };
      const node = sinon.stub();
      const stubs = installThemeStubs();
      installTheme(node, addon, stubs);
      assert(stubs._themeAction.calledWith(node, THEME_INSTALL));
    });

    it('tracks a theme install', () => {
      const addon = { ...baseAddon };
      const node = sinon.stub();
      const stubs = installThemeStubs();
      installTheme(node, addon, stubs);
      assert(stubs._tracking.sendEvent.calledWith({
        action: TRACKING_TYPE_THEME,
        category: INSTALL_CATEGORY,
        label: 'hai-theme',
      }));
    });

    it('does not try to install theme if INSTALLED', () => {
      const addon = { ...baseAddon, status: INSTALLED };
      const node = sinon.stub();
      const stubs = installThemeStubs();
      installTheme(node, addon, stubs);
      assert.notOk(stubs._tracking.sendEvent.called);
      assert.notOk(stubs._themeAction.called);
    });

    it('does not try to install theme if it is an extension', () => {
      const addon = { ...baseAddon, type: ADDON_TYPE_EXTENSION };
      const node = sinon.stub();
      const stubs = installThemeStubs();
      installTheme(node, addon, stubs);
      assert.notOk(stubs._tracking.sendEvent.called);
      assert.notOk(stubs._themeAction.called);
    });
  });

  describe('getBrowserThemeData', () => {
    it('formats the browser theme data', () => {
      const { getBrowserThemeData } = getMapStateToProps();
      sinon.stub(themePreview, 'getThemeData').returns({ foo: 'wat' });
      assert.equal(getBrowserThemeData({ some: 'data' }), '{"foo":"wat"}');
    });
  });

  describe('toggleThemePreview', () => {
    it('calls previewTheme if theme is not enabled', () => {
      const fakeLog = {
        info: sinon.spy(),
      };
      const themeAction = sinon.spy();
      const node = 'fake-node';
      const guid = 'foo@bar.com';
      const props = mapStateToProps({
        installations: {
          [guid]: {
            status: UNINSTALLED,
            guid,
          },
        },
      }, {
        guid,
      });
      props.previewTheme = sinon.spy();
      props.toggleThemePreview(node, themeAction, fakeLog);
      assert.ok(props.previewTheme.calledWith(node, themeAction));
    });

    it('calls previewTheme if theme is not enabled', () => {
      const fakeLog = {
        info: sinon.spy(),
      };
      const themeAction = sinon.spy();
      const node = 'fake-node';
      const guid = 'foo@bar.com';
      const props = mapStateToProps({
        installations: {
          [guid]: {
            status: UNINSTALLED,
            isPreviewingTheme: true,
            guid,
          },
        },
      }, {
        guid,
      });
      props.resetThemePreview = sinon.spy();
      props.toggleThemePreview(node, themeAction, fakeLog);
      assert.ok(props.resetThemePreview.calledWith(node, themeAction));
    });

    it('logs if theme is not available', () => {
      const fakeLog = {
        info: sinon.spy(),
      };
      const themeAction = sinon.spy();
      const node = 'fake-node';
      const guid = 'foo@bar.com';
      const props = mapStateToProps({
        installations: {
          [guid]: {
            status: UNINSTALLED,
            isPreviewingTheme: true,
          },
        },
      }, {
        guid,
      });
      props.resetThemePreview = sinon.spy();
      props.toggleThemePreview(node, themeAction, fakeLog);
      assert.ok(fakeLog.info.calledWith('Theme foo@bar.com could not be found'));
    });

    it('logs if theme is already enabled', () => {
      const fakeLog = {
        info: sinon.spy(),
      };
      const themeAction = sinon.spy();
      const node = 'fake-node';
      const guid = 'foo@bar.com';
      const props = mapStateToProps({
        installations: {
          [guid]: {
            status: ENABLED,
            isPreviewingTheme: true,
            guid,
          },
        },
      }, {
        guid,
      });
      props.resetThemePreview = sinon.spy();
      props.toggleThemePreview(node, themeAction, fakeLog);
      assert.ok(fakeLog.info.calledWith(sinon.match('Theme foo@bar.com is already enabled')));
    });
  });
});
