import config from 'config';
import { mount, shallow } from 'enzyme';
import * as React from 'react';
import { compose } from 'redux';
import UAParser from 'ua-parser-js';

import { createInternalVersion, loadVersions } from 'core/reducers/versions';
import { setInstallError, setInstallState } from 'core/actions/installations';
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
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import { showInfoDialog } from 'core/reducers/infoDialog';
import {
  createFakeLocation,
  createFakeTracking,
  dispatchClientMetadata,
  fakeAddon,
  fakePlatformFile,
  fakeVersion,
  getFakeAddonManagerWrapper,
  getFakeLogger,
  shallowUntilTarget,
  userAgentsByPlatform,
} from 'tests/unit/helpers';
import {
  WithInstallHelpers,
  findInstallURL,
  makeProgressHandler,
  withInstallHelpers,
} from 'core/installAddon';
import { getAddonTypeForTracking, getAddonEventCategory } from 'core/tracking';

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
  addon = createInternalAddon(fakeAddon),
  defaultInstallSource = 'some-install-source',
  location = createFakeLocation(),
  store = dispatchClientMetadata().store,
  ...overrides
} = {}) => {
  sinon.stub(store, 'dispatch');

  return {
    _addonManager,
    addon,
    defaultInstallSource,
    location,
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
    const addon = createInternalAddon(fakeAddon);

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
      addon: createInternalAddon(fakeAddon),
      store,
    });
    _addonManager.getAddon.resetHistory();

    const newAddon = createInternalAddon({ ...fakeAddon, guid: '@new-guid' });
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

    const newAddon = createInternalAddon({
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
    const addon = createInternalAddon(fakeAddon);

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

  describe('findInstallURL', () => {
    const _findInstallURL = ({
      url = '',
      location = createFakeLocation(),
      userAgent = userAgentsByPlatform.windows.firefox40,
      ...params
    } = {}) => {
      const _findFileForPlatform = sinon
        .stub()
        .returns({ ...fakePlatformFile, url });
      const userAgentInfo =
        userAgent && UAParser(userAgentsByPlatform.windows.firefox40);
      const { platformFiles } = createInternalVersion(fakeVersion);

      return findInstallURL({
        _findFileForPlatform,
        location,
        platformFiles,
        userAgentInfo,
        ...params,
      });
    };

    it('adds a default source to the install URL', () => {
      const url = 'https://a.m.o/files/addon.xpi';
      expect(
        _findInstallURL({
          url,
          defaultInstallSource: 'homepage',
        }),
      ).toEqual(`${url}?src=homepage`);
    });

    it('only adds a source to the URL when defined', () => {
      const url = 'https://a.m.o/files/addon.xpi';
      expect(
        _findInstallURL({
          url,
          defaultInstallSource: null,
        }),
      ).toEqual(url);
    });

    it('prefers an external source over the default', () => {
      const url = 'https://a.m.o/files/addon.xpi';
      const externalSource = 'my-reddit-post';
      expect(
        _findInstallURL({
          url,
          location: createFakeLocation({ query: { src: externalSource } }),
          defaultInstallSource: 'default-source',
        }),
      ).toEqual(`${url}?src=${externalSource}`);
    });

    it('requires a location when appending a source', () => {
      expect(() => _findInstallURL({ location: null })).toThrow(
        /location parameter is required/,
      );
    });

    it('allows undefined locations when not appending a source', () => {
      const url = 'https://a.m.o/files/addon.xpi';
      expect(
        _findInstallURL({
          appendSource: false,
          location: null,
          url,
        }),
      ).toEqual(url);
    });

    it('preserves the install URL query string', () => {
      const url = _findInstallURL({
        url: 'https://a.m.o/files/mac.xpi?lang=he',
        defaultInstallSource: 'homepage',
      });

      expect(url).toMatch(/src=homepage/);
      expect(url).toMatch(/lang=he/);
    });
  });

  describe('withInstallHelpers', () => {
    const defaultInstallSource = 'some-install-source';

    it('accepts a `null` add-on', () => {
      const { root } = renderWithInstallHelpers({ addon: null });

      expect(root).toHaveLength(1);
    });

    describe('isAddonEnabled', () => {
      it('returns true when the add-on is enabled', async () => {
        const fakeAddonManager = getFakeAddonManagerWrapper();
        const addon = createInternalAddon(fakeAddon);

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
          addon: createInternalAddon(fakeAddon),
          _addonManager: fakeAddonManager,
          _log,
        });

        const { isAddonEnabled } = root.instance().props;
        const isEnabled = await isAddonEnabled();

        expect(isEnabled).toEqual(false);

        sinon.assert.calledWith(
          _log.error,
          'could not determine whether the add-on was enabled',
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
        return createInternalAddon({ ...fakeAddon, type });
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
          defaultInstallSource: null,
          store,
        });
        const { setCurrentStatus } = root.instance().props;

        return setCurrentStatus().then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
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
          defaultInstallSource: null,
          store,
        });

        const { setCurrentStatus } = root.instance().props;
        dispatch.resetHistory();

        return setCurrentStatus({ addon }).then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
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
          defaultInstallSource: null,
          store,
        });
        const { setCurrentStatus } = root.instance().props;

        return setCurrentStatus().then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
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
          defaultInstallSource: null,
          store,
        });
        const { setCurrentStatus } = root.instance().props;

        return setCurrentStatus().then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
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
          defaultInstallSource: null,
          store,
        });
        const { setCurrentStatus } = root.instance().props;

        return setCurrentStatus().then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
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
          defaultInstallSource: null,
          store,
        });
        const { setCurrentStatus } = root.instance().props;

        return setCurrentStatus().then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
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
          defaultInstallSource: null,
          store,
        });
        const { setCurrentStatus } = root.instance().props;

        return setCurrentStatus().then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
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
          defaultInstallSource: null,
          store,
        });
        const { setCurrentStatus } = root.instance().props;

        return setCurrentStatus().then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
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
          defaultInstallSource: null,
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

      it('adds defaultInstallSource to the URL', () => {
        const installURL = 'http://the.url/';
        const addon = getAddon();
        loadVersionWithInstallUrl(installURL);

        const { root, dispatch } = renderWithInstallHelpers({
          addon,
          defaultInstallSource,
          store,
        });
        const { setCurrentStatus } = root.instance().props;

        return setCurrentStatus().then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
              guid: addon.guid,
              status: ENABLED,
              url: `${installURL}?src=${defaultInstallSource}`,
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
          label: name,
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
          label: name,
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
        const addon = createInternalAddon({
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
            label: addon.name,
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
        const addon = createInternalAddon({
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
        const addon = createInternalAddon(fakeAddon);

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
        const addon = createInternalAddon(fakeAddon);
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
        const addon = createInternalAddon(fakeAddon);

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
          defaultInstallSource,
          store,
        });
        const { install } = root.instance().props;

        return install().then(() => {
          sinon.assert.calledWith(
            fakeAddonManager.install,
            `${installURL}?src=${defaultInstallSource}`,
            sinon.match.func,
            { src: defaultInstallSource, hash },
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
          defaultInstallSource,
          store,
          version: createInternalVersion({
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
            `${versionInstallURL}?src=${defaultInstallSource}`,
            sinon.match.func,
            { src: defaultInstallSource, hash: versionHash },
          );
        });
      });

      it('passes an undefined hash when installURL is not found', () => {
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

        const fakeAddonManager = getFakeAddonManagerWrapper();
        const { root } = renderWithInstallHelpers({
          _addonManager: fakeAddonManager,
          defaultInstallSource,
          store,
        });
        const { install } = root.instance().props;

        return install().then(() => {
          sinon.assert.calledWith(
            fakeAddonManager.install,
            undefined,
            sinon.match.func,
            { src: defaultInstallSource, hash: undefined },
          );
        });
      });

      it('tracks the start of an addon install', () => {
        _loadVersions({ store });

        const addon = createInternalAddon(fakeAddon);
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
            label: addon.name,
          });
          sinon.assert.calledOnce(fakeTracking.sendEvent);
        });
      });

      it('tracks an addon install', () => {
        _loadVersions({ store });

        const addon = createInternalAddon(fakeAddon);
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
            label: addon.name,
          });
        });
      });

      it('tracks the start of a static theme install', () => {
        _loadVersions({ store });

        const addon = createInternalAddon({
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
            label: addon.name,
          });
        });
      });

      it('tracks a static theme addon install', () => {
        _loadVersions({ store });

        const addon = createInternalAddon({
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
            label: addon.name,
          });
        });
      });

      it('should dispatch START_DOWNLOAD', () => {
        _loadVersions({ store });

        const addon = createInternalAddon(fakeAddon);
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
        const addon = createInternalAddon({
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
        const addon = createInternalAddon({
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

        const addon = createInternalAddon(fakeAddon);
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
        const addon = createInternalAddon(fakeAddon);
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
        const addon = createInternalAddon(fakeAddon);
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
        const addon = createInternalAddon(fakeAddon);
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
            label: addon.name,
          });
        });
      });

      it('tracks a static theme addon uninstall', () => {
        const fakeAddonManager = getFakeAddonManagerWrapper();
        const fakeTracking = createFakeTracking();
        const addon = createInternalAddon({
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
            label: addon.name,
          });
        });
      });

      it('tracks a unknown type uninstall', () => {
        const fakeAddonManager = getFakeAddonManagerWrapper();
        const fakeTracking = createFakeTracking();
        const addon = createInternalAddon({
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
            label: addon.name,
          });
        });
      });
    });
  });
});
