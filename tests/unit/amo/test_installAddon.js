import config from 'config';
import { mount, shallow } from 'enzyme';
import * as React from 'react';
import { compose } from 'redux';

import { loadVersions } from 'amo/reducers/versions';
import { setInstallError, setInstallState } from 'amo/reducers/installations';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  DISABLED,
  DOWNLOAD_FAILED,
  DOWNLOAD_PROGRESS,
  ENABLED,
  ENABLE_ACTION,
  ERROR,
  ERROR_CORRUPT_FILE,
  FATAL_ERROR,
  FATAL_INSTALL_ERROR,
  FATAL_UNINSTALL_ERROR,
  INACTIVE,
  INSTALLING,
  INSTALL_ACTION,
  INSTALL_CANCELLED,
  INSTALL_CANCELLED_ACTION,
  INSTALL_DOWNLOAD_FAILED_ACTION,
  INSTALL_ERROR,
  INSTALL_FAILED,
  INSTALL_STARTED_ACTION,
  OS_ALL,
  OS_ANDROID,
  SET_ENABLE_NOT_AVAILABLE,
  START_DOWNLOAD,
  TRACKING_TYPE_INVALID,
  UNINSTALLED,
  UNINSTALLING,
  UNINSTALL_ACTION,
} from 'amo/constants';
import { showInfoDialog } from 'amo/reducers/infoDialog';
import {
  createFakeTracking,
  createInternalAddonWithLang,
  createInternalVersionWithLang,
  dispatchClientMetadata,
  fakeAddon,
  fakePlatformFile,
  fakeVersion,
  getFakeAddonManagerWrapper,
  getFakeLogger,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import {
  WithInstallHelpers,
  makeProgressHandler,
  withInstallHelpers,
} from 'amo/installAddon';
import { getAddonTypeForTracking, getAddonEventCategory } from 'amo/tracking';

const INVALID_TYPE = 'not-a-real-type';

// See: https://github.com/airbnb/enzyme/issues/1232.
class ComponentBase extends React.Component {
  render() {
    return <div />;
  }
}

function componentWithInstallHelpers() {
  // This simulates how a component would typically apply
  // the withInstallHelpers HOC wrapper.
  return compose(withInstallHelpers)(ComponentBase);
}

const defaultProps = ({
  _addonManager = getFakeAddonManagerWrapper(),
  addon = createInternalAddonWithLang(fakeAddon),
  store = dispatchClientMetadata().store,
  ...overrides
} = {}) => {
  sinon.stub(store, 'dispatch');

  return {
    _addonManager,
    addon,
    store,
    ...overrides,
  };
};

function render(Component, props) {
  return shallowUntilTarget(<Component {...props} />, ComponentBase);
}

function renderWithInstallHelpers({ ...customProps } = {}) {
  const Component = componentWithInstallHelpers();

  const props = defaultProps(customProps);
  const root = render(Component, props);

  return { root, dispatch: props.store.dispatch };
}

const mountWithInstallHelpers = (props = {}) => {
  const Component = componentWithInstallHelpers();
  // We use `mount` because we want to trigger all the lifecycle methods in
  // `withInstallHelpers` AND be able to inject props on the `Component`
  // component, not on `ComponentBase` so that the HOC receives those props.
  return mount(<Component {...defaultProps(props)} />);
};

const _loadVersions = ({ store, versionProps = {} }) => {
  store.dispatch(
    loadVersions({
      slug: fakeAddon.slug,
      versions: [{ ...fakeAddon.current_version, ...versionProps }],
    }),
  );
};

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  it('wraps the component in WithInstallHelpers', () => {
    const Component = componentWithInstallHelpers();

    const root = shallow(<Component {...defaultProps()} />);
    expect(root.type()).toEqual(WithInstallHelpers);
  });

  it('sets status when the component is created', () => {
    _loadVersions({ store });

    const _addonManager = getFakeAddonManagerWrapper({
      getAddon: Promise.resolve({
        isActive: true,
        isEnabled: true,
        type: ADDON_TYPE_EXTENSION,
      }),
    });
    const addon = createInternalAddonWithLang(fakeAddon);

    renderWithInstallHelpers({ _addonManager, addon, store });

    sinon.assert.calledWith(_addonManager.getAddon, addon.guid);
  });

  it('sets status when getting updated', () => {
    _loadVersions({ store });

    const _addonManager = getFakeAddonManagerWrapper({
      getAddon: Promise.resolve({
        isActive: true,
        isEnabled: true,
      }),
    });

    const root = mountWithInstallHelpers({
      _addonManager,
      addon: createInternalAddonWithLang(fakeAddon),
      store,
    });
    _addonManager.getAddon.resetHistory();

    const newAddon = createInternalAddonWithLang({
      ...fakeAddon,
      guid: '@new-guid',
    });
    root.setProps({ addon: newAddon });

    sinon.assert.calledWith(_addonManager.getAddon, newAddon.guid);
  });

  it('sets status when add-on is loaded on update', () => {
    _loadVersions({ store });

    const _addonManager = getFakeAddonManagerWrapper({
      getAddon: Promise.resolve({
        isActive: true,
        isEnabled: true,
      }),
    });

    const root = mountWithInstallHelpers({
      _addonManager,
      addon: null,
      store,
    });
    _addonManager.getAddon.resetHistory();

    const newAddon = createInternalAddonWithLang({
      ...fakeAddon,
      guid: '@new-guid',
    });
    root.setProps({ addon: newAddon });

    sinon.assert.calledWith(_addonManager.getAddon, newAddon.guid);
  });

  it('does not set status when an update is not necessary', () => {
    const _addonManager = getFakeAddonManagerWrapper({
      getAddon: Promise.resolve({
        isActive: true,
        isEnabled: true,
      }),
    });
    const addon = createInternalAddonWithLang(fakeAddon);

    const root = mountWithInstallHelpers({
      _addonManager,
      addon,
    });
    _addonManager.getAddon.resetHistory();

    // Update the component with the same props (i.e. same add-on guid) and
    // make sure the status is not set.
    root.setProps({ addon });
    sinon.assert.notCalled(_addonManager.getAddon);
  });

  it('sets the current status in componentDidMount with an addonManager', () => {
    _loadVersions({ store });

    const _addonManager = getFakeAddonManagerWrapper({
      getAddon: Promise.resolve({
        isActive: true,
        isEnabled: true,
      }),
    });

    renderWithInstallHelpers({ _addonManager, store });

    sinon.assert.called(_addonManager.getAddon);
  });

  it('does not set the current status in componentDidMount without an addonManager', () => {
    const _addonManager = getFakeAddonManagerWrapper({
      hasAddonManager: false,
    });

    renderWithInstallHelpers({ _addonManager });

    sinon.assert.notCalled(_addonManager.getAddon);
  });

  it('does not set the current status in componentDidMount without an addon', () => {
    const _addonManager = getFakeAddonManagerWrapper();

    renderWithInstallHelpers({ _addonManager, addon: null });

    sinon.assert.notCalled(_addonManager.getAddon);
  });

  describe('withInstallHelpers', () => {
    it('accepts a `null` add-on', () => {
      const { root } = renderWithInstallHelpers({ addon: null });

      expect(root).toHaveLength(1);
    });

    describe('isAddonEnabled', () => {
      it('returns true when the add-on is enabled', async () => {
        const fakeAddonManager = getFakeAddonManagerWrapper();
        const addon = createInternalAddonWithLang(fakeAddon);

        const { root } = renderWithInstallHelpers({
          addon,
          _addonManager: fakeAddonManager,
        });
        const { isAddonEnabled } = root.instance().props;
        const isEnabled = await isAddonEnabled();

        sinon.assert.calledWith(fakeAddonManager.getAddon, addon.guid);
        expect(isEnabled).toEqual(true);
      });

      it('returns false when there is an error', async () => {
        const _log = getFakeLogger();
        const fakeAddonManager = getFakeAddonManagerWrapper({
          // Resolve a null addon which will trigger an exception.
          getAddon: Promise.resolve(null),
        });

        const { root } = renderWithInstallHelpers({
          addon: createInternalAddonWithLang(fakeAddon),
          _addonManager: fakeAddonManager,
          _log,
        });

        const { isAddonEnabled } = root.instance().props;
        const isEnabled = await isAddonEnabled();

        expect(isEnabled).toEqual(false);

        sinon.assert.calledWith(
          _log.error,
          'could not determine whether the add-on was enabled: %o',
        );
      });

      it('returns false when there is no add-on', async () => {
        const _log = getFakeLogger();
        const fakeAddonManager = getFakeAddonManagerWrapper();

        const { root } = renderWithInstallHelpers({
          addon: null,
          _addonManager: fakeAddonManager,
          _log,
        });

        const { isAddonEnabled } = root.instance().props;
        const isEnabled = await isAddonEnabled();

        expect(isEnabled).toEqual(false);

        sinon.assert.calledWith(
          _log.debug,
          'no addon, assuming addon is not enabled',
        );
      });
    });

    describe('setCurrentStatus', () => {
      const getAddon = ({ type = ADDON_TYPE_EXTENSION } = {}) => {
        return createInternalAddonWithLang({ ...fakeAddon, type });
      };

      const loadVersionWithInstallUrl = (installURL) => {
        _loadVersions({
          store,
          versionProps: {
            files: [{ platform: OS_ALL, url: installURL }],
          },
        });
      };

      it('sets the status to ENABLED when an enabled add-on found', () => {
        const installURL = 'http://the.url/';
        const addon = getAddon();
        loadVersionWithInstallUrl(installURL);

        const { root, dispatch } = renderWithInstallHelpers({
          addon,
          store,
        });
        const { setCurrentStatus } = root.instance().props;

        return setCurrentStatus().then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
              canUninstall: undefined,
              guid: addon.guid,
              status: ENABLED,
              url: installURL,
            }),
          );
        });
      });

      it('lets you pass custom props to setCurrentStatus', () => {
        const installURL = 'http://the.url/';
        const addon = getAddon();
        loadVersionWithInstallUrl(installURL);

        const { root, dispatch } = renderWithInstallHelpers({
          addon,
          store,
        });

        const { setCurrentStatus } = root.instance().props;
        dispatch.resetHistory();

        return setCurrentStatus({ addon }).then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
              canUninstall: undefined,
              guid: addon.guid,
              status: ENABLED,
              url: installURL,
            }),
          );
        });
      });

      it('sets the status to DISABLED when a disabled add-on found', () => {
        const installURL = 'http://the.url/';
        const addon = getAddon();
        loadVersionWithInstallUrl(installURL);

        const { root, dispatch } = renderWithInstallHelpers({
          _addonManager: getFakeAddonManagerWrapper({
            getAddon: Promise.resolve({
              isActive: false,
              isEnabled: false,
            }),
          }),
          addon,
          store,
        });
        const { setCurrentStatus } = root.instance().props;

        return setCurrentStatus().then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
              canUninstall: undefined,
              guid: addon.guid,
              status: DISABLED,
              url: installURL,
            }),
          );
        });
      });

      it('sets the status to DISABLED when the extension is inactive and disabled', () => {
        const installURL = 'http://the.url/';
        const addon = getAddon();
        loadVersionWithInstallUrl(installURL);

        const { root, dispatch } = renderWithInstallHelpers({
          _addonManager: getFakeAddonManagerWrapper({
            getAddon: Promise.resolve({
              isActive: false,
              isEnabled: false,
            }),
          }),
          addon,
          store,
        });
        const { setCurrentStatus } = root.instance().props;

        return setCurrentStatus().then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
              canUninstall: undefined,
              guid: addon.guid,
              status: DISABLED,
              url: installURL,
            }),
          );
        });
      });

      it('sets the status to INACTIVE when an inactive extension is found', () => {
        const installURL = 'http://the.url/';
        const addon = getAddon();
        loadVersionWithInstallUrl(installURL);

        const { root, dispatch } = renderWithInstallHelpers({
          _addonManager: getFakeAddonManagerWrapper({
            getAddon: Promise.resolve({
              isActive: false,
              isEnabled: true,
            }),
          }),
          addon,
          store,
        });
        const { setCurrentStatus } = root.instance().props;

        return setCurrentStatus().then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
              canUninstall: undefined,
              guid: addon.guid,
              status: INACTIVE,
              url: installURL,
            }),
          );
        });
      });

      it('sets the status to ENABLED when an enabled theme is found', () => {
        const fakeAddonManager = getFakeAddonManagerWrapper({
          getAddon: Promise.resolve({
            isActive: true,
            isEnabled: true,
          }),
        });
        const installURL = 'http://the.url/';
        const addon = getAddon({ type: ADDON_TYPE_STATIC_THEME });
        loadVersionWithInstallUrl(installURL);

        const { root, dispatch } = renderWithInstallHelpers({
          _addonManager: fakeAddonManager,
          addon,
          store,
        });
        const { setCurrentStatus } = root.instance().props;

        return setCurrentStatus().then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
              canUninstall: undefined,
              guid: addon.guid,
              status: ENABLED,
              url: installURL,
            }),
          );
        });
      });

      it('sets the status to DISABLED when an inactive theme is found', () => {
        const fakeAddonManager = getFakeAddonManagerWrapper({
          getAddon: Promise.resolve({
            isActive: false,
            isEnabled: true,
          }),
        });
        const installURL = 'http://the.url/';
        const addon = getAddon({ type: ADDON_TYPE_STATIC_THEME });
        loadVersionWithInstallUrl(installURL);

        const { root, dispatch } = renderWithInstallHelpers({
          _addonManager: fakeAddonManager,
          addon,
          store,
        });
        const { setCurrentStatus } = root.instance().props;

        return setCurrentStatus().then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
              canUninstall: undefined,
              guid: addon.guid,
              status: DISABLED,
              url: installURL,
            }),
          );
        });
      });

      it('sets the status to DISABLED when a disabled theme is found', () => {
        const fakeAddonManager = getFakeAddonManagerWrapper({
          getAddon: Promise.resolve({
            isActive: true,
            isEnabled: false,
          }),
        });
        const installURL = 'http://the.url/';
        const addon = getAddon({ type: ADDON_TYPE_STATIC_THEME });
        loadVersionWithInstallUrl(installURL);

        const { root, dispatch } = renderWithInstallHelpers({
          _addonManager: fakeAddonManager,
          addon,
          store,
        });
        const { setCurrentStatus } = root.instance().props;

        return setCurrentStatus().then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
              canUninstall: undefined,
              guid: addon.guid,
              status: DISABLED,
              url: installURL,
            }),
          );
        });
      });

      it('sets the status to UNINSTALLED when not found', () => {
        const fakeAddonManager = getFakeAddonManagerWrapper({
          getAddon: Promise.reject(),
        });
        const installURL = 'http://the.url/';
        const addon = getAddon();
        loadVersionWithInstallUrl(installURL);

        const { root, dispatch } = renderWithInstallHelpers({
          _addonManager: fakeAddonManager,
          addon,
          store,
        });
        const { setCurrentStatus } = root.instance().props;

        return setCurrentStatus().then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
              guid: addon.guid,
              status: UNINSTALLED,
              url: installURL,
            }),
          );
        });
      });

      it('dispatches error when setCurrentStatus gets exception', () => {
        const fakeAddonManager = getFakeAddonManagerWrapper({
          // Resolve a null addon which will trigger an exception.
          getAddon: Promise.resolve(null),
        });
        const addon = getAddon();
        _loadVersions({ store });

        const { root, dispatch } = renderWithInstallHelpers({
          _addonManager: fakeAddonManager,
          addon,
          store,
        });
        const { setCurrentStatus } = root.instance().props;

        return setCurrentStatus().then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
              guid: addon.guid,
              status: ERROR,
              error: FATAL_ERROR,
            }),
          );
        });
      });

      it('does nothing when addon is `null`', () => {
        const _log = getFakeLogger();

        const { dispatch } = renderWithInstallHelpers({ _log, addon: null });

        sinon.assert.notCalled(dispatch);
        sinon.assert.calledWith(
          _log.debug,
          'no addon, aborting setCurrentStatus()',
        );
      });

      it('does nothing when currentVersion is `null`', () => {
        const _log = getFakeLogger();

        const { dispatch } = renderWithInstallHelpers({ _log });

        sinon.assert.notCalled(dispatch);
        sinon.assert.calledWith(
          _log.debug,
          'no currentVersion, aborting setCurrentStatus()',
        );
      });

      it('sets the canUninstall prop', () => {
        const installURL = 'http://the.url/';
        const addon = getAddon();
        loadVersionWithInstallUrl(installURL);

        const canUninstall = false;
        const { root, dispatch } = renderWithInstallHelpers({
          _addonManager: getFakeAddonManagerWrapper({
            getAddon: Promise.resolve({
              canUninstall,
              isActive: true,
              isEnabled: true,
            }),
          }),
          addon,
          store,
        });
        const { setCurrentStatus } = root.instance().props;

        return setCurrentStatus().then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
              canUninstall,
              guid: addon.guid,
              status: ENABLED,
              url: installURL,
            }),
          );
        });
      });
    });

    describe('makeProgressHandler', () => {
      const createProgressHandler = (props = {}) => {
        return makeProgressHandler({
          _tracking: createFakeTracking(),
          dispatch: sinon.stub(),
          guid: 'some-guid',
          name: 'some-name',
          type: ADDON_TYPE_EXTENSION,
          ...props,
        });
      };

      it('sets the download progress on STATE_DOWNLOADING', () => {
        const dispatch = sinon.spy();
        const guid = 'foo@addon';
        const handler = createProgressHandler({ dispatch, guid });

        handler({
          state: 'STATE_DOWNLOADING',
          progress: 300,
          maxProgress: 990,
        });
        sinon.assert.calledWith(dispatch, {
          type: DOWNLOAD_PROGRESS,
          payload: { downloadProgress: 30, guid },
        });
      });

      it('sets status to error on onDownloadFailed', () => {
        const _tracking = createFakeTracking();
        const dispatch = sinon.spy();
        const guid = '{my-addon}';
        const name = 'my-addon';
        const type = ADDON_TYPE_EXTENSION;
        const handler = createProgressHandler({
          _tracking,
          dispatch,
          guid,
          name,
          type,
        });

        handler({ state: 'STATE_SOMETHING' }, { type: 'onDownloadFailed' });

        sinon.assert.calledWith(dispatch, {
          type: INSTALL_ERROR,
          payload: { guid, error: DOWNLOAD_FAILED },
        });
        sinon.assert.calledWith(_tracking.sendEvent, {
          action: getAddonTypeForTracking(type),
          category: getAddonEventCategory(type, INSTALL_DOWNLOAD_FAILED_ACTION),
          label: guid,
        });
      });

      it('sets status to installing onDownloadEnded', () => {
        const dispatch = sinon.spy();
        const guid = '{my-addon}';
        const handler = createProgressHandler({ dispatch, guid });

        handler({ state: 'STATE_SOMETHING' }, { type: 'onDownloadEnded' });
        sinon.assert.calledWith(
          dispatch,
          setInstallState({
            guid,
            status: INSTALLING,
          }),
        );
      });

      it('resets status to uninstalled on onInstallCancelled', () => {
        const _tracking = createFakeTracking();
        const dispatch = sinon.spy();
        const guid = '{my-addon}';
        const name = 'my-addon';
        const type = ADDON_TYPE_EXTENSION;
        const handler = createProgressHandler({
          _tracking,
          dispatch,
          guid,
          name,
          type,
        });

        handler({ state: 'STATE_SOMETHING' }, { type: 'onInstallCancelled' });

        sinon.assert.calledWith(dispatch, {
          type: INSTALL_CANCELLED,
          payload: { guid },
        });
        sinon.assert.calledWith(_tracking.sendEvent, {
          action: getAddonTypeForTracking(type),
          category: getAddonEventCategory(type, INSTALL_CANCELLED_ACTION),
          label: guid,
        });
      });

      it('sets status to error on onInstallFailed', () => {
        const dispatch = sinon.spy();
        const guid = '{my-addon}';
        const handler = createProgressHandler({ dispatch, guid });

        handler({ state: 'STATE_SOMETHING' }, { type: 'onInstallFailed' });
        sinon.assert.calledWith(dispatch, {
          type: INSTALL_ERROR,
          payload: { guid, error: INSTALL_FAILED },
        });
      });

      it('does nothing on unknown events', () => {
        const dispatch = sinon.spy();
        const guid = 'foo@addon';
        const handler = createProgressHandler({ dispatch, guid });

        handler({ state: 'WAT' }, { type: 'onNothingPerformed' });
        sinon.assert.notCalled(dispatch);
      });

      it('sets status to error when file appears to be corrupt', () => {
        const _tracking = createFakeTracking();
        const dispatch = sinon.spy();
        const guid = '{my-addon}';
        const name = 'my-addon';
        const type = ADDON_TYPE_EXTENSION;
        const handler = createProgressHandler({
          _tracking,
          dispatch,
          guid,
          name,
          type,
        });

        handler(
          { state: 'STATE_SOMETHING' },
          { type: 'onDownloadFailed', target: { error: ERROR_CORRUPT_FILE } },
        );

        sinon.assert.calledWith(dispatch, {
          type: INSTALL_ERROR,
          payload: { guid, error: ERROR_CORRUPT_FILE },
        });
        sinon.assert.notCalled(_tracking.sendEvent);
      });
    });

    describe('enable', () => {
      it('calls addonManager.enable() and content notification', () => {
        const fakeTracking = createFakeTracking();
        const fakeAddonManager = getFakeAddonManagerWrapper({
          permissionPromptsEnabled: false,
        });
        const name = 'the-name';
        const iconUrl = `${config.get('amoCDN')}/some-icon.png`;
        const addon = createInternalAddonWithLang({
          ...fakeAddon,
          name,
          icon_url: iconUrl,
        });
        const { root, dispatch } = renderWithInstallHelpers({
          _addonManager: fakeAddonManager,
          _tracking: fakeTracking,
          addon,
        });
        const { enable } = root.instance().props;

        return enable().then(() => {
          sinon.assert.calledWith(fakeAddonManager.enable, addon.guid);
          sinon.assert.calledWith(
            dispatch,
            showInfoDialog({
              addonName: addon.name,
              imageURL: iconUrl,
            }),
          );

          sinon.assert.calledWith(fakeTracking.sendEvent, {
            action: getAddonTypeForTracking(ADDON_TYPE_EXTENSION),
            category: getAddonEventCategory(
              ADDON_TYPE_EXTENSION,
              ENABLE_ACTION,
            ),
            label: addon.guid,
          });
        });
      });

      it('does not send a tracking event when "sendTrackingEvent" is false', () => {
        const fakeTracking = createFakeTracking();
        const fakeAddonManager = getFakeAddonManagerWrapper({
          permissionPromptsEnabled: false,
        });
        const name = 'the-name';
        const iconUrl = 'https://a.m.o/some-icon.png';
        const addon = createInternalAddonWithLang({
          ...fakeAddon,
          name,
          icon_url: iconUrl,
        });
        const { root } = renderWithInstallHelpers({
          ...addon,
          _addonManager: fakeAddonManager,
          _tracking: fakeTracking,
        });
        const { enable } = root.instance().props;

        return enable({ sendTrackingEvent: false }).then(() => {
          sinon.assert.calledWith(fakeAddonManager.enable, addon.guid);
          sinon.assert.notCalled(fakeTracking.sendEvent);
        });
      });

      it('calls addonManager.enable() without content notification', () => {
        const fakeAddonManager = getFakeAddonManagerWrapper({
          permissionPromptsEnabled: true,
        });
        const addon = createInternalAddonWithLang(fakeAddon);

        const { root, dispatch } = renderWithInstallHelpers({
          _addonManager: fakeAddonManager,
          addon,
        });
        const { enable } = root.instance().props;

        return enable().then(() => {
          sinon.assert.calledWith(fakeAddonManager.enable, addon.guid);
          sinon.assert.neverCalledWith(
            dispatch,
            showInfoDialog({
              addonName: addon.name,
              imageURL: addon.icon_url,
            }),
          );
        });
      });

      it('dispatches a FATAL_ERROR', () => {
        const fakeAddonManager = getFakeAddonManagerWrapper({
          enable: sinon.stub().returns(Promise.reject(new Error('hai'))),
        });
        const addon = createInternalAddonWithLang(fakeAddon);
        const { dispatch, root } = renderWithInstallHelpers({
          _addonManager: fakeAddonManager,
          addon,
        });
        const { enable } = root.instance().props;

        return enable().then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
              guid: addon.guid,
              status: ERROR,
              error: FATAL_ERROR,
            }),
          );
        });
      });

      it('does not dispatch a FATAL_ERROR when setEnabled is missing', () => {
        const fakeAddonManager = getFakeAddonManagerWrapper({
          enable: sinon
            .stub()
            .returns(Promise.reject(new Error(SET_ENABLE_NOT_AVAILABLE))),
        });
        const addon = createInternalAddonWithLang(fakeAddon);

        const { root, dispatch } = renderWithInstallHelpers({
          _addonManager: fakeAddonManager,
          addon,
        });
        const { enable } = root.instance().props;

        return enable().then(() => {
          sinon.assert.neverCalledWith(
            dispatch,
            setInstallState({
              guid: addon.guid,
              status: ERROR,
              error: FATAL_ERROR,
            }),
          );
        });
      });

      it('does nothing when enable() is called with a `null` add-on', () => {
        const _log = getFakeLogger();

        const { root, dispatch } = renderWithInstallHelpers({
          _log,
          addon: null,
        });
        const { enable } = root.instance().props;

        return enable().then(() => {
          sinon.assert.calledWith(
            _log.debug,
            'no addon found, aborting enable().',
          );
          sinon.assert.notCalled(dispatch);
        });
      });
    });

    describe('install', () => {
      const installURL = 'https://mysite.com/download.xpi';

      it('calls addonManager.install()', () => {
        const hash = 'some-sha-hash';

        _loadVersions({
          store,
          versionProps: {
            files: [
              {
                platform: OS_ALL,
                url: installURL,
                hash,
              },
            ],
          },
        });

        const fakeAddonManager = getFakeAddonManagerWrapper();
        const { root } = renderWithInstallHelpers({
          _addonManager: fakeAddonManager,
          store,
        });
        const { install } = root.instance().props;

        return install().then(() => {
          sinon.assert.calledWith(
            fakeAddonManager.install,
            installURL,
            sinon.match.func,
            { hash },
          );
        });
      });

      it('uses a version instead of the currentVersion when one exists in props', () => {
        const currentHash = 'current-hash';
        const currentInstallURL = 'https://mysite.com/download-current.xpi';
        const versionHash = 'version-hash';
        const versionInstallURL = 'https://mysite.com/download-version.xpi';

        // This will load data for the currentVersion of the add-on.
        _loadVersions({
          store,
          versionProps: {
            files: [
              {
                platform: OS_ALL,
                url: currentInstallURL,
                hash: currentHash,
              },
            ],
          },
        });

        const fakeAddonManager = getFakeAddonManagerWrapper();
        const { root } = renderWithInstallHelpers({
          _addonManager: fakeAddonManager,
          store,
          version: createInternalVersionWithLang({
            ...fakeVersion,
            files: [
              {
                ...fakePlatformFile,
                hash: versionHash,
                url: versionInstallURL,
              },
            ],
          }),
        });
        const { install } = root.instance().props;

        return install().then(() => {
          sinon.assert.calledWith(
            fakeAddonManager.install,
            versionInstallURL,
            sinon.match.func,
            { hash: versionHash },
          );
        });
      });

      it('rejects when installURL is not found', () => {
        _loadVersions({
          store,
          versionProps: {
            files: [
              {
                platform: OS_ANDROID,
                url: installURL,
              },
            ],
          },
        });

        const addon = createInternalAddonWithLang(fakeAddon);
        const fakeAddonManager = getFakeAddonManagerWrapper();
        const { root, dispatch } = renderWithInstallHelpers({
          _addonManager: fakeAddonManager,
          addon,
          store,
        });
        const { install } = root.instance().props;

        return install().then(() => {
          sinon.assert.notCalled(fakeAddonManager.install);
          sinon.assert.calledWith(
            dispatch,
            setInstallError({
              guid: addon.guid,
              error: FATAL_INSTALL_ERROR,
            }),
          );
        });
      });

      it('tracks the start of an addon install', () => {
        _loadVersions({ store });

        const addon = createInternalAddonWithLang(fakeAddon);
        const fakeTracking = createFakeTracking();
        const { root } = renderWithInstallHelpers({
          _addonManager: getFakeAddonManagerWrapper({
            // Make the install fail so that we can be sure only
            // the 'start' event gets tracked.
            install: sinon
              .stub()
              .returns(Promise.reject(new Error('install error'))),
          }),
          _tracking: fakeTracking,
          addon,
          store,
        });
        const { install } = root.instance().props;

        return install(addon).then(() => {
          // Even though the install() promise fails, it gets caught
          // and resolved successfully.
          sinon.assert.calledWith(fakeTracking.sendEvent, {
            action: getAddonTypeForTracking(ADDON_TYPE_EXTENSION),
            category: getAddonEventCategory(
              ADDON_TYPE_EXTENSION,
              INSTALL_STARTED_ACTION,
            ),
            label: addon.guid,
          });
          sinon.assert.calledOnce(fakeTracking.sendEvent);
        });
      });

      it('tracks an addon install', () => {
        _loadVersions({ store });

        const addon = createInternalAddonWithLang(fakeAddon);
        const fakeTracking = createFakeTracking();
        const { root } = renderWithInstallHelpers({
          _tracking: fakeTracking,
          addon,
          store,
        });
        const { install } = root.instance().props;

        return install(addon).then(() => {
          sinon.assert.calledWith(fakeTracking.sendEvent, {
            action: getAddonTypeForTracking(ADDON_TYPE_EXTENSION),
            category: getAddonEventCategory(
              ADDON_TYPE_EXTENSION,
              INSTALL_ACTION,
            ),
            label: addon.guid,
          });
        });
      });

      it('tracks the start of a static theme install', () => {
        _loadVersions({ store });

        const addon = createInternalAddonWithLang({
          ...fakeAddon,
          type: ADDON_TYPE_STATIC_THEME,
        });
        const fakeTracking = createFakeTracking();
        const { root } = renderWithInstallHelpers({
          _tracking: fakeTracking,
          addon,
          store,
        });
        const { install } = root.instance().props;

        return install(addon).then(() => {
          sinon.assert.calledWith(fakeTracking.sendEvent, {
            action: getAddonTypeForTracking(ADDON_TYPE_STATIC_THEME),
            category: getAddonEventCategory(
              ADDON_TYPE_STATIC_THEME,
              INSTALL_STARTED_ACTION,
            ),
            label: addon.guid,
          });
        });
      });

      it('tracks a static theme addon install', () => {
        _loadVersions({ store });

        const addon = createInternalAddonWithLang({
          ...fakeAddon,
          type: ADDON_TYPE_STATIC_THEME,
        });
        const fakeTracking = createFakeTracking();
        const { root } = renderWithInstallHelpers({
          _tracking: fakeTracking,
          addon,
          store,
        });
        const { install } = root.instance().props;

        return install(addon).then(() => {
          sinon.assert.calledWith(fakeTracking.sendEvent, {
            action: getAddonTypeForTracking(ADDON_TYPE_STATIC_THEME),
            category: getAddonEventCategory(
              ADDON_TYPE_STATIC_THEME,
              INSTALL_ACTION,
            ),
            label: addon.guid,
          });
        });
      });

      it('should dispatch START_DOWNLOAD', () => {
        _loadVersions({ store });

        const addon = createInternalAddonWithLang(fakeAddon);
        const { root, dispatch } = renderWithInstallHelpers({ addon, store });
        const { install } = root.instance().props;

        return install(addon).then(() => {
          sinon.assert.calledWith(dispatch, {
            type: START_DOWNLOAD,
            payload: { guid: addon.guid },
          });
        });
      });

      it('should dispatch SHOW_INFO if permissionPromptsEnabled is false', () => {
        _loadVersions({ store });

        const iconUrl = `${config.get('amoCDN')}/some-icon.png`;
        const addon = createInternalAddonWithLang({
          ...fakeAddon,
          icon_url: iconUrl,
        });
        const props = {
          _addonManager: getFakeAddonManagerWrapper({
            permissionPromptsEnabled: false,
          }),
          addon,
          store,
        };
        const { root, dispatch } = renderWithInstallHelpers(props);
        const { install } = root.instance().props;

        return install(addon).then(() => {
          sinon.assert.calledWith(
            dispatch,
            showInfoDialog({
              addonName: addon.name,
              imageURL: iconUrl,
            }),
          );
        });
      });

      it('should not dispatch SHOW_INFO if permissionPromptsEnabled is true', () => {
        _loadVersions({ store });

        const iconUrl = `${config.get('amoCDN')}/some-icon.png`;
        const addon = createInternalAddonWithLang({
          ...fakeAddon,
          icon_url: iconUrl,
        });
        const props = {
          _addonManager: getFakeAddonManagerWrapper({
            permissionPromptsEnabled: true,
          }),
          addon,
          store,
        };
        const { root, dispatch } = renderWithInstallHelpers(props);
        const { install } = root.instance().props;

        return install(addon).then(() => {
          sinon.assert.neverCalledWith(
            dispatch,
            showInfoDialog({
              addonName: addon.name,
              imageURL: iconUrl,
            }),
          );
        });
      });

      it('dispatches error when addonManager.install throws', () => {
        _loadVersions({ store });

        const fakeAddonManager = getFakeAddonManagerWrapper();
        fakeAddonManager.install = sinon.stub().returns(Promise.reject());

        const addon = createInternalAddonWithLang(fakeAddon);
        const { root, dispatch } = renderWithInstallHelpers({
          ...addon,
          _addonManager: fakeAddonManager,
          store,
        });
        const { install } = root.instance().props;

        return install(addon).then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallError({
              guid: addon.guid,
              error: FATAL_INSTALL_ERROR,
            }),
          );
        });
      });

      it('does nothing when install() is called with a `null` add-on', () => {
        const _log = getFakeLogger();

        const { root, dispatch } = renderWithInstallHelpers({
          _log,
          addon: null,
        });
        const { install } = root.instance().props;

        return install().then(() => {
          sinon.assert.calledWith(
            _log.debug,
            'no addon found, aborting install().',
          );
          sinon.assert.notCalled(dispatch);
        });
      });

      it('does nothing when install() is called with no currentVersion', () => {
        const _log = getFakeLogger();

        const { root } = renderWithInstallHelpers({ _log });
        const { install } = root.instance().props;

        return install().then(() => {
          sinon.assert.calledWith(
            _log.debug,
            'no currentVersion found, aborting install().',
          );
        });
      });
    });

    describe('uninstall', () => {
      it('calls addonManager.uninstall()', () => {
        const fakeAddonManager = getFakeAddonManagerWrapper();
        const addon = createInternalAddonWithLang(fakeAddon);
        const { root, dispatch } = renderWithInstallHelpers({
          ...addon,
          _addonManager: fakeAddonManager,
        });
        const { uninstall } = root.instance().props;

        return uninstall(addon).then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({ guid: addon.guid, status: UNINSTALLING }),
          );
          sinon.assert.calledWith(fakeAddonManager.uninstall, addon.guid);
        });
      });

      it('dispatches error when addonManager.uninstall throws', () => {
        const fakeAddonManager = getFakeAddonManagerWrapper();
        fakeAddonManager.uninstall = sinon
          .stub()
          .returns(Promise.reject(new Error('Add-on Manager uninstall error')));
        const addon = createInternalAddonWithLang(fakeAddon);
        const { root, dispatch } = renderWithInstallHelpers({
          ...addon,
          _addonManager: fakeAddonManager,
        });
        const { uninstall } = root.instance().props;

        return uninstall(addon).then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({ guid: addon.guid, status: UNINSTALLING }),
          );
          sinon.assert.calledWith(
            dispatch,
            setInstallError({
              guid: addon.guid,
              error: FATAL_UNINSTALL_ERROR,
            }),
          );
        });
      });

      it('tracks an addon uninstall', () => {
        const fakeAddonManager = getFakeAddonManagerWrapper();
        const fakeTracking = createFakeTracking();
        const addon = createInternalAddonWithLang(fakeAddon);
        const { root } = renderWithInstallHelpers({
          ...addon,
          _addonManager: fakeAddonManager,
          _tracking: fakeTracking,
        });
        const { uninstall } = root.instance().props;

        return uninstall(addon).then(() => {
          sinon.assert.calledWith(fakeTracking.sendEvent, {
            action: getAddonTypeForTracking(ADDON_TYPE_EXTENSION),
            category: getAddonEventCategory(
              ADDON_TYPE_EXTENSION,
              UNINSTALL_ACTION,
            ),
            label: addon.guid,
          });
        });
      });

      it('tracks a static theme addon uninstall', () => {
        const fakeAddonManager = getFakeAddonManagerWrapper();
        const fakeTracking = createFakeTracking();
        const addon = createInternalAddonWithLang({
          ...fakeAddon,
          type: ADDON_TYPE_STATIC_THEME,
        });
        const { root } = renderWithInstallHelpers({
          ...addon,
          _addonManager: fakeAddonManager,
          _tracking: fakeTracking,
        });
        const { uninstall } = root.instance().props;

        return uninstall(addon).then(() => {
          sinon.assert.calledWith(fakeTracking.sendEvent, {
            action: getAddonTypeForTracking(ADDON_TYPE_STATIC_THEME),
            category: getAddonEventCategory(
              ADDON_TYPE_STATIC_THEME,
              UNINSTALL_ACTION,
            ),
            label: addon.guid,
          });
        });
      });

      it('tracks a unknown type uninstall', () => {
        const fakeAddonManager = getFakeAddonManagerWrapper();
        const fakeTracking = createFakeTracking();
        const addon = createInternalAddonWithLang({
          ...fakeAddon,
          type: INVALID_TYPE,
        });
        const { root } = renderWithInstallHelpers({
          ...addon,
          _addonManager: fakeAddonManager,
          _tracking: fakeTracking,
        });
        const { uninstall } = root.instance().props;

        return uninstall(addon).then(() => {
          sinon.assert.calledWith(fakeTracking.sendEvent, {
            action: TRACKING_TYPE_INVALID,
            category: getAddonEventCategory(INVALID_TYPE, UNINSTALL_ACTION),
            label: addon.guid,
          });
        });
      });
    });
  });
});
