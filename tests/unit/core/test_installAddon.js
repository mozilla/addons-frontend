import config from 'config';
import { mount, shallow } from 'enzyme';
import * as React from 'react';
import { compose } from 'redux';
import UAParser from 'ua-parser-js';

import createStore from 'amo/store';
import { setInstallError, setInstallState } from 'core/actions/installations';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
  DISABLED,
  DOWNLOAD_FAILED,
  DOWNLOAD_PROGRESS,
  ENABLED,
  ENABLE_ACTION,
  ERROR,
  FATAL_ERROR,
  FATAL_INSTALL_ERROR,
  FATAL_UNINSTALL_ERROR,
  INACTIVE,
  INSTALLED,
  INSTALLING,
  INSTALL_ACTION,
  INSTALL_CANCELLED,
  INSTALL_CANCELLED_ACTION,
  INSTALL_DOWNLOAD_FAILED_ACTION,
  INSTALL_FAILED,
  INSTALL_STARTED_ACTION,
  INSTALL_STARTED_THEME_CATEGORY,
  INSTALL_THEME_CATEGORY,
  OS_ALL,
  OS_ANDROID,
  OS_LINUX,
  OS_MAC,
  OS_WINDOWS,
  SET_ENABLE_NOT_AVAILABLE,
  START_DOWNLOAD,
  TRACKING_TYPE_INVALID,
  TRACKING_TYPE_THEME,
  UNINSTALLED,
  UNINSTALLING,
  UNINSTALL_ACTION,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import { showInfoDialog } from 'core/reducers/infoDialog';
import { createFakeAddon, fakeAddon, fakeTheme } from 'tests/unit/amo/helpers';
import {
  createFakeTracking,
  createFakeLocation,
  getFakeAddonManagerWrapper,
  getFakeConfig,
  sampleUserAgentParsed,
  shallowUntilTarget,
  userAgentsByPlatform,
} from 'tests/unit/helpers';
import {
  WithInstallHelpers,
  findInstallURL,
  installTheme,
  makeMapDispatchToProps,
  makeProgressHandler,
  withInstallHelpers,
} from 'core/installAddon';
import { getAddonTypeForTracking, getAddonEventCategory } from 'core/tracking';

const INVALID_TYPE = 'not-a-real-type';

// See: https://github.com/airbnb/enzyme/issues/1232.
class BaseComponent extends React.Component {
  render() {
    return <div />;
  }
}

function componentWithInstallHelpers({
  defaultInstallSource = 'some-src',
} = {}) {
  // This simulates how a component would typically apply
  // the withInstallHelpers() HOC wrapper.
  return compose(withInstallHelpers({ defaultInstallSource }))(BaseComponent);
}

const defaultProps = (overrides = {}) => {
  const { store } = createStore();
  sinon.stub(store, 'dispatch');

  const addon = createInternalAddon(fakeAddon);

  return {
    _addonManager: getFakeAddonManagerWrapper(),
    addon,
    dispatch: store.dispatch,
    location: createFakeLocation(),
    store,
    userAgentInfo: sampleUserAgentParsed,
    ...overrides,
  };
};

function render(Component, props) {
  return shallowUntilTarget(
    <Component {...props} />,
    BaseComponent,
    // If we do not disable these methods, `componentDidMount()` will be called
    // but in most cases we do not have a complete fakeAddonManager.
    // See: http://airbnb.io/enzyme/docs/guides/migration-from-2-to-3.html#lifecycle-methods.
    { shallowOptions: { disableLifecycleMethods: true } },
  );
}

function renderWithInstallHelpers({
  defaultInstallSource,
  ...customProps
} = {}) {
  const Component = componentWithInstallHelpers({ defaultInstallSource });

  const props = defaultProps(customProps);
  const root = render(Component, props);

  return { root, dispatch: props.store.dispatch };
}

describe(__filename, () => {
  it('connects mapDispatchToProps for the component', () => {
    const _makeMapDispatchToProps = sinon.spy();
    const WrappedComponent = sinon.stub();

    withInstallHelpers({
      defaultInstallSource: 'Howdy',
      _makeMapDispatchToProps,
    })(WrappedComponent);

    sinon.assert.calledWith(_makeMapDispatchToProps, {
      WrappedComponent,
      defaultInstallSource: 'Howdy',
    });
  });

  it('wraps the component in WithInstallHelpers', () => {
    const _makeMapDispatchToProps = sinon.spy();

    const Component = withInstallHelpers({
      defaultInstallSource: 'Howdy',
      _makeMapDispatchToProps,
    })(() => {});

    const { store } = createStore();
    const root = shallow(<Component store={store} />);
    expect(root.type()).toEqual(WithInstallHelpers);
  });

  it('sets status when the component is mounted', () => {
    const Component = componentWithInstallHelpers();
    const _addonManager = getFakeAddonManagerWrapper({
      getAddon: Promise.resolve({
        isActive: true,
        isEnabled: true,
        type: ADDON_TYPE_EXTENSION,
      }),
    });

    const addon = createInternalAddon(fakeAddon);
    const props = defaultProps({
      _addonManager,
      addon,
      // Use a spread to simulate how Addon and other components
      // do it in mapStateToProps().
      ...addon,
    });
    mount(<Component {...props} />);

    sinon.assert.calledWith(_addonManager.getAddon, addon.guid);
  });

  it('sets status when getting updated', () => {
    const Component = componentWithInstallHelpers();
    const _addonManager = getFakeAddonManagerWrapper({
      getAddon: Promise.resolve({
        isActive: true,
        isEnabled: true,
      }),
    });

    const props = defaultProps({ _addonManager });
    const root = mount(<Component {...props} />);

    const newAddon = createInternalAddon({
      ...fakeAddon,
      guid: '@new-guid',
    });
    // Use a spread to simulate how Addon and other components
    // do it in mapStateToProps().
    root.setProps({ addon: newAddon, ...newAddon });

    sinon.assert.calledWith(_addonManager.getAddon, '@new-guid');
  });

  it('sets status when add-on is loaded on update', () => {
    const Component = componentWithInstallHelpers();
    const _addonManager = getFakeAddonManagerWrapper({
      getAddon: Promise.resolve({
        isActive: true,
        isEnabled: true,
      }),
    });

    const props = defaultProps({ _addonManager, addon: null });
    const root = mount(<Component {...props} />);

    const newAddon = createInternalAddon({
      ...fakeAddon,
      guid: '@new-guid',
    });
    root.setProps({ addon: newAddon });

    sinon.assert.calledWith(_addonManager.getAddon, '@new-guid');
  });

  it('does not set status when an update is not necessary', () => {
    const Component = componentWithInstallHelpers();
    const _addonManager = getFakeAddonManagerWrapper({
      getAddon: Promise.resolve({
        isActive: true,
        isEnabled: true,
      }),
    });

    const props = {
      addon: fakeAddon,
      // Use a spread to simulate how Addon and other components
      // do it in mapStateToProps().
      ...fakeAddon,
      _addonManager,
      store: createStore().store,
    };

    const root = render(Component, props);

    // Update the component with the same props (i.e. same add-on guid)
    // and make sure the status is not set.
    root.setProps(props);
    sinon.assert.notCalled(_addonManager.getAddon);
  });

  it('throws without a defaultInstallSource', () => {
    expect(() => {
      withInstallHelpers({})(() => {});
    }).toThrowError(/defaultInstallSource is required/);
  });

  it('sets the current status in componentDidMount with an addonManager', () => {
    const _addonManager = getFakeAddonManagerWrapper({
      getAddon: Promise.resolve({
        isActive: true,
        isEnabled: true,
      }),
    });

    const props = defaultProps({ _addonManager });
    mount(<WithInstallHelpers {...props} WrappedComponent={() => <div />} />);
    sinon.assert.called(_addonManager.getAddon);
  });

  it('does not set the current status in componentDidMount without an addonManager', () => {
    const _addonManager = getFakeAddonManagerWrapper({
      hasAddonManager: false,
    });

    const props = defaultProps({ _addonManager });
    mount(<WithInstallHelpers {...props} WrappedComponent={() => <div />} />);
    sinon.assert.notCalled(_addonManager.getAddon);
  });

  it('does not set the current status in componentDidMount without an addon', () => {
    const _addonManager = getFakeAddonManagerWrapper();
    const props = defaultProps({ _addonManager, addon: null });

    mount(<WithInstallHelpers {...props} WrappedComponent={() => <div />} />);

    sinon.assert.notCalled(_addonManager.getAddon);
  });

  describe('findInstallURL', () => {
    const _findInstallURL = ({
      addonFiles = [],
      location = createFakeLocation(),
      userAgent = userAgentsByPlatform.windows.firefox40,
      ...params
    } = {}) => {
      const addon =
        addonFiles &&
        createInternalAddon(
          createFakeAddon({
            files: addonFiles,
          }),
        );
      const userAgentInfo = userAgent && UAParser(userAgent);

      return findInstallURL({
        location,
        platformFiles: addon && addon.platformFiles,
        userAgentInfo,
        ...params,
      });
    };

    it('finds a Windows install URL', () => {
      expect(
        _findInstallURL({
          addonFiles: [
            {
              platform: OS_WINDOWS,
              url: 'https://a.m.o/files/windows.xpi',
            },
            {
              platform: OS_MAC,
              url: 'https://a.m.o/files/mac.xpi',
            },
          ],
          userAgent: userAgentsByPlatform.windows.firefox40,
        }),
      ).toEqual('https://a.m.o/files/windows.xpi');
    });

    it('finds a Mac OS install URL', () => {
      expect(
        _findInstallURL({
          addonFiles: [
            {
              platform: OS_WINDOWS,
              url: 'https://a.m.o/files/windows.xpi',
            },
            {
              platform: OS_MAC,
              url: 'https://a.m.o/files/mac.xpi',
            },
          ],
          userAgent: userAgentsByPlatform.mac.firefox33,
        }),
      ).toEqual('https://a.m.o/files/mac.xpi');
    });

    it('finds a Linux install URL', () => {
      expect(
        _findInstallURL({
          addonFiles: [
            {
              platform: OS_WINDOWS,
              url: 'https://a.m.o/files/windows.xpi',
            },
            {
              platform: OS_LINUX,
              url: 'https://a.m.o/files/linux.xpi',
            },
          ],
          userAgent: userAgentsByPlatform.linux.firefox10,
        }),
      ).toEqual('https://a.m.o/files/linux.xpi');
    });

    it('finds a Linux Ubuntu install URL', () => {
      expect(
        _findInstallURL({
          addonFiles: [
            {
              platform: OS_LINUX,
              url: 'https://a.m.o/files/linux.xpi',
            },
          ],
          // This parses to the name Ubuntu instead of Linux.
          userAgent: userAgentsByPlatform.linux.firefox57Ubuntu,
        }),
      ).toEqual('https://a.m.o/files/linux.xpi');
    });

    it('gives a Linux install URL to Unix platforms', () => {
      expect(
        _findInstallURL({
          addonFiles: [
            {
              platform: OS_LINUX,
              url: 'https://a.m.o/files/linux.xpi',
            },
          ],
          userAgent: userAgentsByPlatform.unix.firefox51,
        }),
      ).toEqual('https://a.m.o/files/linux.xpi');
    });

    it('gives a Linux install URL to BSD platforms', () => {
      expect(
        _findInstallURL({
          addonFiles: [
            {
              platform: OS_LINUX,
              url: 'https://a.m.o/files/linux.xpi',
            },
          ],
          userAgent: userAgentsByPlatform.bsd.firefox40FreeBSD,
        }),
      ).toEqual('https://a.m.o/files/linux.xpi');
    });

    it('finds an Android mobile install URL', () => {
      expect(
        _findInstallURL({
          addonFiles: [
            {
              platform: OS_WINDOWS,
              url: 'https://a.m.o/files/windows.xpi',
            },
            {
              platform: OS_ANDROID,
              url: 'https://a.m.o/files/android.xpi',
            },
          ],
          userAgent: userAgentsByPlatform.android.firefox40Mobile,
        }),
      ).toEqual('https://a.m.o/files/android.xpi');
    });

    it('finds an Android tablet install URL', () => {
      expect(
        _findInstallURL({
          addonFiles: [
            {
              platform: OS_WINDOWS,
              url: 'https://a.m.o/files/windows.xpi',
            },
            {
              platform: OS_ANDROID,
              url: 'https://a.m.o/files/android.xpi',
            },
          ],
          userAgent: userAgentsByPlatform.android.firefox40Tablet,
        }),
      ).toEqual('https://a.m.o/files/android.xpi');
    });

    it('returns an all-platform URL for unsupported platforms', () => {
      expect(
        _findInstallURL({
          addonFiles: [
            {
              platform: OS_WINDOWS,
              url: 'https://a.m.o/files/windows.xpi',
            },
            {
              platform: OS_ALL,
              url: 'https://a.m.o/files/all.xpi',
            },
          ],
          // This platform is unsupported.
          userAgent: userAgentsByPlatform.firefoxOS.firefox26,
        }),
      ).toEqual('https://a.m.o/files/all.xpi');
    });

    it('gives preference to a specific platform URL', () => {
      expect(
        _findInstallURL({
          addonFiles: [
            {
              platform: OS_WINDOWS,
              url: 'https://a.m.o/files/windows.xpi',
            },
            {
              // Make sure the all-platform file doesn't win.
              platform: OS_ALL,
              url: 'https://a.m.o/files/all.xpi',
            },
          ],
          userAgent: userAgentsByPlatform.windows.firefox40,
        }),
      ).toEqual('https://a.m.o/files/windows.xpi');
    });

    it('returns undefined when nothing else matches', () => {
      expect(
        _findInstallURL({
          addonFiles: [
            {
              platform: OS_WINDOWS,
              url: 'https://a.m.o/files/windows.xpi',
            },
            {
              platform: OS_MAC,
              url: 'https://a.m.o/files/mac.xpi',
            },
          ],
          userAgent: userAgentsByPlatform.android.firefox40Tablet,
        }),
      ).toEqual(undefined);
    });

    it('returns undefined for user agents with an unknown platform', () => {
      expect(
        _findInstallURL({
          addonFiles: [
            {
              platform: OS_LINUX,
              url: 'https://a.m.o/files/linux.xpi',
            },
          ],
          userAgent: 'some-completely-wacko-user-agent-string',
        }),
      ).toEqual(undefined);
    });

    it('returns undefined when no files exist', () => {
      expect(
        _findInstallURL({
          addonFiles: [],
          userAgent: userAgentsByPlatform.windows.firefox40,
        }),
      ).toEqual(undefined);
    });

    it('requires platformFiles', () => {
      expect(() => _findInstallURL({ addonFiles: null })).toThrow(
        /platformFiles parameter is required/,
      );
    });

    it('requires userAgentInfo', () => {
      expect(() => _findInstallURL({ userAgent: null })).toThrow(
        /userAgentInfo parameter is required/,
      );
    });

    it('adds a default source to the install URL', () => {
      const baseURL = 'https://a.m.o/files/addon.xpi';
      expect(
        _findInstallURL({
          addonFiles: [{ platform: OS_ALL, url: baseURL }],
          defaultInstallSource: 'homepage',
        }),
      ).toEqual(`${baseURL}?src=homepage`);
    });

    it('only adds a source to the URL when defined', () => {
      const baseURL = 'https://a.m.o/files/addon.xpi';
      expect(
        _findInstallURL({
          addonFiles: [{ platform: OS_ALL, url: baseURL }],
          defaultInstallSource: null,
        }),
      ).toEqual(baseURL);
    });

    it('prefers an external source over the default', () => {
      const baseURL = 'https://a.m.o/files/addon.xpi';
      const externalSource = 'my-reddit-post';
      expect(
        _findInstallURL({
          addonFiles: [{ platform: OS_ALL, url: baseURL }],
          location: createFakeLocation({ query: { src: externalSource } }),
          defaultInstallSource: 'default-source',
        }),
      ).toEqual(`${baseURL}?src=${externalSource}`);
    });

    it('requires a location when appending a source', () => {
      expect(() => _findInstallURL({ location: null })).toThrow(
        /location parameter is required/,
      );
    });

    it('allows undefined locations when not appending a source', () => {
      const baseURL = 'https://a.m.o/files/addon.xpi';
      expect(
        _findInstallURL({
          appendSource: false,
          location: null,
          addonFiles: [{ platform: OS_ALL, url: baseURL }],
        }),
      ).toEqual(baseURL);
    });

    it('preserves the install URL query string', () => {
      const url = _findInstallURL({
        addonFiles: [
          {
            platform: OS_ALL,
            url: 'https://a.m.o/files/mac.xpi?lang=he',
          },
        ],
        defaultInstallSource: 'homepage',
      });

      expect(url).toMatch(/src=homepage/);
      expect(url).toMatch(/lang=he/);
    });
  });

  describe('withInstallHelpers', () => {
    const defaultInstallSource = 'some-install-source';
    const WrappedComponent = sinon.stub();

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
        const fakeAddonManager = getFakeAddonManagerWrapper({
          // Resolve a null addon which will trigger an exception.
          getAddon: Promise.resolve(null),
        });

        const { root } = renderWithInstallHelpers({
          addon: createInternalAddon(fakeAddon),
          _addonManager: fakeAddonManager,
        });

        const { isAddonEnabled } = root.instance().props;
        const isEnabled = await isAddonEnabled();

        expect(isEnabled).toEqual(false);
      });
    });

    describe('setCurrentStatus', () => {
      it('sets the status to ENABLED when an enabled add-on found', () => {
        const installURL = 'http://the.url/';
        const addon = createInternalAddon(
          createFakeAddon({
            files: [{ platform: OS_ALL, url: installURL }],
          }),
        );

        const { root, dispatch } = renderWithInstallHelpers({
          addon,
          defaultInstallSource: null,
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
        const addon = createInternalAddon(
          createFakeAddon({
            files: [{ platform: OS_ALL, url: installURL }],
          }),
        );

        const { root, dispatch } = renderWithInstallHelpers({
          addon,
          defaultInstallSource: null,
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
        const addon = createInternalAddon(
          createFakeAddon({
            files: [{ platform: OS_ALL, url: installURL }],
          }),
        );

        const { root, dispatch } = renderWithInstallHelpers({
          _addonManager: getFakeAddonManagerWrapper({
            getAddon: Promise.resolve({
              isActive: false,
              isEnabled: false,
            }),
          }),
          addon,
          defaultInstallSource: null,
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
        const addon = createInternalAddon(
          createFakeAddon({
            files: [{ platform: OS_ALL, url: installURL }],
            type: ADDON_TYPE_EXTENSION,
          }),
        );

        const { root, dispatch } = renderWithInstallHelpers({
          _addonManager: getFakeAddonManagerWrapper({
            getAddon: Promise.resolve({
              isActive: false,
              isEnabled: false,
            }),
          }),
          addon,
          defaultInstallSource: null,
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
        const addon = createInternalAddon(
          createFakeAddon({
            files: [{ platform: OS_ALL, url: installURL }],
            type: ADDON_TYPE_EXTENSION,
          }),
        );

        const { root, dispatch } = renderWithInstallHelpers({
          _addonManager: getFakeAddonManagerWrapper({
            getAddon: Promise.resolve({
              isActive: false,
              isEnabled: true,
            }),
          }),
          addon,
          defaultInstallSource: null,
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
        const addon = createInternalAddon(
          createFakeAddon({
            files: [{ platform: OS_ALL, url: installURL }],
            type: ADDON_TYPE_THEME,
          }),
        );

        const { root, dispatch } = renderWithInstallHelpers({
          _addonManager: fakeAddonManager,
          addon,
          defaultInstallSource: null,
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
        const addon = createInternalAddon(
          createFakeAddon({
            files: [{ platform: OS_ALL, url: installURL }],
            type: ADDON_TYPE_THEME,
          }),
        );

        const { root, dispatch } = renderWithInstallHelpers({
          _addonManager: fakeAddonManager,
          addon,
          defaultInstallSource: null,
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
        const addon = createInternalAddon(
          createFakeAddon({
            files: [{ platform: OS_ALL, url: installURL }],
            type: ADDON_TYPE_THEME,
          }),
        );

        const { root, dispatch } = renderWithInstallHelpers({
          _addonManager: fakeAddonManager,
          addon,
          defaultInstallSource: null,
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
        const addon = createInternalAddon(
          createFakeAddon({
            files: [{ platform: OS_ALL, url: installURL }],
          }),
        );

        const { root, dispatch } = renderWithInstallHelpers({
          _addonManager: fakeAddonManager,
          addon,
          defaultInstallSource: null,
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
        const addon = createInternalAddon(fakeAddon);

        const { root, dispatch } = renderWithInstallHelpers({
          _addonManager: fakeAddonManager,
          addon,
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
        const addon = createInternalAddon(
          createFakeAddon({
            files: [{ platform: OS_ALL, url: installURL }],
          }),
        );

        const { root, dispatch } = renderWithInstallHelpers({
          addon,
          defaultInstallSource,
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
          type: 'INSTALL_ERROR',
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
          type: 'INSTALL_ERROR',
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
        const name = 'the-name';
        const iconUrl = 'https://a.m.o/some-icon.png';
        const addon = createInternalAddon({
          ...fakeAddon,
          name,
          icon_url: iconUrl,
        });
        const { root, dispatch } = renderWithInstallHelpers({
          _addonManager: fakeAddonManager,
          addon,
        });
        const { enable } = root.instance().props;

        return enable().then(() => {
          sinon.assert.calledWith(fakeAddonManager.enable, addon.guid);
          sinon.assert.notCalled(dispatch);
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
        const { root, dispatch } = renderWithInstallHelpers({
          _addonManager: fakeAddonManager,
        });
        const { enable } = root.instance().props;

        return enable().then(() => {
          sinon.assert.notCalled(dispatch);
        });
      });
    });

    describe('install', () => {
      const installURL = 'https://mysite.com/download.xpi';

      it('calls addonManager.install()', () => {
        const hash = 'some-sha-hash';
        const addon = createInternalAddon(
          createFakeAddon({
            files: [
              {
                platform: OS_ALL,
                url: installURL,
                hash,
              },
            ],
          }),
        );
        const fakeAddonManager = getFakeAddonManagerWrapper();
        const { root } = renderWithInstallHelpers({
          _addonManager: fakeAddonManager,
          addon,
          defaultInstallSource,
        });
        const { install } = root.instance().props;

        return install(addon).then(() => {
          sinon.assert.calledWith(
            fakeAddonManager.install,
            `${installURL}?src=${defaultInstallSource}`,
            sinon.match.func,
            { src: defaultInstallSource, hash },
          );
        });
      });

      it('passes an undefined hash when installURL is not found', () => {
        const addon = createInternalAddon(
          createFakeAddon({
            files: [
              {
                platform: OS_ANDROID,
                url: installURL,
              },
            ],
          }),
        );
        const fakeAddonManager = getFakeAddonManagerWrapper();
        const { root } = renderWithInstallHelpers({
          _addonManager: fakeAddonManager,
          addon,
          defaultInstallSource,
        });
        const { install } = root.instance().props;

        return install(addon).then(() => {
          sinon.assert.calledWith(
            fakeAddonManager.install,
            undefined,
            sinon.match.func,
            { src: defaultInstallSource, hash: undefined },
          );
        });
      });

      it('tracks the start of an addon install', () => {
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
        const addon = createInternalAddon(fakeAddon);
        const fakeTracking = createFakeTracking();
        const { root } = renderWithInstallHelpers({
          _tracking: fakeTracking,
          addon,
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
        const addon = createInternalAddon({
          ...fakeAddon,
          type: ADDON_TYPE_STATIC_THEME,
        });
        const fakeTracking = createFakeTracking();
        const { root } = renderWithInstallHelpers({
          _tracking: fakeTracking,
          addon,
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
        const addon = createInternalAddon({
          ...fakeAddon,
          type: ADDON_TYPE_STATIC_THEME,
        });
        const fakeTracking = createFakeTracking();
        const { root } = renderWithInstallHelpers({
          _tracking: fakeTracking,
          addon,
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
        const addon = createInternalAddon(fakeAddon);
        const { root, dispatch } = renderWithInstallHelpers(addon);
        const { install } = root.instance().props;

        return install(addon).then(() => {
          sinon.assert.calledWith(dispatch, {
            type: START_DOWNLOAD,
            payload: { guid: addon.guid },
          });
        });
      });

      it('should dispatch SHOW_INFO if permissionPromptsEnabled is false', () => {
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
        const fakeAddonManager = getFakeAddonManagerWrapper();
        fakeAddonManager.install = sinon.stub().returns(Promise.reject());

        const addon = createInternalAddon(fakeAddon);
        const { root, dispatch } = renderWithInstallHelpers({
          ...addon,
          _addonManager: fakeAddonManager,
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

      it('tracks a theme uninstall', () => {
        const fakeAddonManager = getFakeAddonManagerWrapper();
        const fakeTracking = createFakeTracking();
        const addon = createInternalAddon(fakeTheme);
        const { root } = renderWithInstallHelpers({
          ...addon,
          _addonManager: fakeAddonManager,
          _tracking: fakeTracking,
        });
        const { uninstall } = root.instance().props;

        return uninstall(addon).then(() => {
          sinon.assert.calledWith(fakeTracking.sendEvent, {
            action: getAddonTypeForTracking(ADDON_TYPE_THEME),
            category: getAddonEventCategory(ADDON_TYPE_THEME, UNINSTALL_ACTION),
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

    describe('mapDispatchToProps', () => {
      const _config = getFakeConfig({ server: false });
      let fakeDispatch;

      beforeEach(() => {
        fakeDispatch = sinon.stub();
      });

      it('still maps props on the server', () => {
        const configServer = getFakeConfig({ server: true });

        expect(
          makeMapDispatchToProps({
            WrappedComponent,
            _config: configServer,
            defaultInstallSource,
          })(fakeDispatch),
        ).toEqual({
          dispatch: fakeDispatch,
          defaultInstallSource,
          WrappedComponent,
        });
      });

      it('requires addon', () => {
        const props = defaultProps();
        delete props.addon;

        expect(() => {
          makeMapDispatchToProps({ _config })(fakeDispatch, props);
        }).toThrowError(/addon prop is required/);
      });

      it('requires userAgentInfo', () => {
        const props = defaultProps();
        delete props.userAgentInfo;
        expect(() => {
          makeMapDispatchToProps({ _config })(fakeDispatch, props);
        }).toThrowError(/userAgentInfo prop is required/);
      });

      it('requires location', () => {
        const props = defaultProps();
        delete props.location;
        expect(() => {
          makeMapDispatchToProps({ _config })(fakeDispatch, props);
        }).toThrowError(/location prop is required/);
      });

      it('can wrap an extension with the right props', () => {
        const props = defaultProps();
        expect(() => {
          makeMapDispatchToProps({ _config })(fakeDispatch, props);
        }).not.toThrowError();
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
          _themeInstall: sinon.spy(),
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
        sinon.assert.calledWith(stubs._themeInstall, node);
      });

      it('tracks a theme install', () => {
        const addon = { ...baseAddon };
        const node = sinon.stub();
        const stubs = installThemeStubs();
        installTheme(node, addon, stubs);
        sinon.assert.calledWith(stubs._tracking.sendEvent, {
          action: TRACKING_TYPE_THEME,
          category: INSTALL_STARTED_THEME_CATEGORY,
          label: 'hai-theme',
        });
        sinon.assert.calledWith(stubs._tracking.sendEvent, {
          action: TRACKING_TYPE_THEME,
          category: INSTALL_THEME_CATEGORY,
          label: 'hai-theme',
        });
        sinon.assert.calledTwice(stubs._tracking.sendEvent);
      });

      it('does not try to install theme if INSTALLED', () => {
        const addon = { ...baseAddon, status: INSTALLED };
        const node = sinon.stub();
        const stubs = installThemeStubs();
        installTheme(node, addon, stubs);
        sinon.assert.notCalled(stubs._tracking.sendEvent);
        sinon.assert.notCalled(stubs._themeInstall);
      });

      it('does not try to install theme if it is an extension', () => {
        const addon = { ...baseAddon, type: ADDON_TYPE_EXTENSION };
        const node = sinon.stub();
        const stubs = installThemeStubs();
        installTheme(node, addon, stubs);
        sinon.assert.notCalled(stubs._tracking.sendEvent);
        sinon.assert.notCalled(stubs._themeInstall);
      });
    });
  });
});
