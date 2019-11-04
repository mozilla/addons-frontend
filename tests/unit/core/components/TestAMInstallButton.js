import * as React from 'react';
import { TransitionGroup } from 'react-transition-group';

import AMInstallButton, {
  AMInstallButtonBase,
} from 'core/components/AMInstallButton';
import {
  EXPERIMENT_CATEGORY_CLICK,
  VARIANT_INCLUDE_WARNING_CURRENT,
} from 'amo/components/InstallWarning';
import {
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  DISABLED,
  DOWNLOADING,
  ENABLED,
  ENABLING,
  INACTIVE,
  INSTALLED,
  INSTALLING,
  INSTALL_ACTION,
  INSTALL_STARTED_ACTION,
  OS_ALL,
  UNINSTALLED,
  UNINSTALLING,
  UNKNOWN,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import { createInternalVersion } from 'core/reducers/versions';
import { getAddonTypeForTracking, getAddonEventCategory } from 'core/tracking';
import Icon from 'ui/components/Icon';
import {
  createContextWithFakeRouter,
  createFakeEvent,
  createFakeMozWindow,
  createFakeTracking,
  dispatchClientMetadata,
  fakeAddon,
  fakeCookies,
  fakeI18n,
  fakeTheme,
  fakeVersion,
  createFakeLocation,
  getFakeConfig,
  getFakeLogger,
  shallowUntilTarget,
  userAgentsByPlatform,
} from 'tests/unit/helpers';
import Button from 'ui/components/Button';

// Skip `withCookies` HOC since Enzyme does not support the React Context API.
// See: https://github.com/mozilla/addons-frontend/issues/6839
jest.mock('react-cookie', () => ({
  withCookies: (component) => component,
}));

describe(__filename, () => {
  const createFakeEventWithURL = ({ url }) => {
    return createFakeEvent({
      currentTarget: {
        href: url,
      },
    });
  };

  const createInternalVersionWithInstallURL = ({
    installURL = 'https://a.m.o/files/addon.xpi',
  }) => {
    return createInternalVersion({
      ...fakeVersion,
      files: [
        {
          ...fakeVersion.files[0],
          platform: OS_ALL,
          url: installURL,
        },
      ],
    });
  };

  const renderProps = (customProps = {}) => ({
    addon: createInternalAddon(fakeAddon),
    cookies: fakeCookies(),
    currentVersion: createInternalVersion(fakeVersion),
    defaultInstallSource: '',
    disabled: false,
    enable: sinon.stub(),
    hasAddonManager: true,
    i18n: fakeI18n(),
    install: sinon.stub(),
    isAddonEnabled: sinon.stub(),
    location: createFakeLocation(),
    status: UNINSTALLED,
    store: dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX }).store,
    uninstall: sinon.stub(),
    ...customProps,
  });

  const render = (props) => {
    const { location, ...otherProps } = renderProps(props);

    return shallowUntilTarget(
      <AMInstallButton {...otherProps} />,
      AMInstallButtonBase,
      {
        shallowOptions: createContextWithFakeRouter({ location }),
      },
    );
  };

  const renderOpenSearch = (customProps = {}) => {
    const props = {
      addon: createInternalAddon({
        ...fakeAddon,
        type: ADDON_TYPE_OPENSEARCH,
      }),
      // Install buttons for opensearch add-ons are not rendered on the server.
      _config: getFakeConfig({ server: false }),
      ...customProps,
    };

    return render(props);
  };

  it('does not render anything when the browser is not Firefox', () => {
    const root = render({
      store: dispatchClientMetadata({
        userAgent: userAgentsByPlatform.mac.chrome41,
      }).store,
    });

    expect(root.find('.AMInstallButton-button')).toHaveLength(0);
  });

  it('renders a Button for extensions', () => {
    const installURL = 'https://a.m.o/files/addon.xpi';

    const root = render({
      currentVersion: createInternalVersionWithInstallURL({ installURL }),
    });

    expect(root.type()).toEqual(TransitionGroup);
    expect(root.find(TransitionGroup).prop('component')).toEqual('div');
    expect(root).toHaveClassName('AMInstallButton');

    const button = root.find(Button);

    expect(button).toHaveLength(1);
    expect(button.childAt(1)).toHaveText('Add to Firefox');
    expect(button).toHaveClassName('AMInstallButton-button');
    expect(button).not.toHaveClassName('AMInstallButton-button--uninstall');
    expect(button).toHaveProp('buttonType', 'action');
    expect(button).toHaveProp('className', 'AMInstallButton-button');
    expect(button).toHaveProp('disabled', false);
    expect(button).not.toHaveProp('data-browsertheme');
    expect(button).toHaveProp('href', installURL);
    expect(button).toHaveProp('onClick', root.instance().installExtension);

    const icon = button.find(Icon);
    expect(icon).toHaveLength(1);
    expect(icon).toHaveProp('name', 'plus');
  });

  it('renders Install Theme text on button when it is a static theme', () => {
    const addon = createInternalAddon({
      ...fakeTheme,
      type: ADDON_TYPE_STATIC_THEME,
    });
    const root = render({ addon });

    expect(root.find(Button).childAt(1)).toHaveText('Install Theme');
  });

  it('configures a different install method for search providers', () => {
    const root = renderOpenSearch();

    expect(root.find(Button)).toHaveProp(
      'onClick',
      root.instance().installOpenSearch,
    );
  });

  it('configures a different install method for search providers even without addon manager', () => {
    const root = renderOpenSearch({ hasAddonManager: false });

    expect(root.find(Button)).toHaveProp(
      'onClick',
      root.instance().installOpenSearch,
    );
  });

  it('uses router location to create install URLs', () => {
    const externalSource = 'my-blog';
    const installURL = 'https://addons.mozilla.org/download';
    const root = render({
      currentVersion: createInternalVersionWithInstallURL({ installURL }),
      defaultInstallSource: 'this-should-be-overidden',
      location: createFakeLocation({ query: { src: externalSource } }),
    });

    const button = root.find(Button);
    expect(button).toHaveProp('href', `${installURL}?src=${externalSource}`);
  });

  it('disables the button when disabled prop is true', () => {
    const installURL = 'https://addons.mozilla.org/download';
    const root = render({
      currentVersion: createInternalVersionWithInstallURL({ installURL }),
      disabled: true,
    });

    const button = root.find('.AMInstallButton-button');

    expect(button).toHaveProp('disabled', true);
    expect(button).toHaveProp('href', installURL);

    const onClick = button.prop('onClick');

    expect(typeof onClick).toEqual('function');
    const event = {
      preventDefault: sinon.stub(),
      stopPropagation: sinon.stub(),
    };

    // A return value of false will prevent the anchor tag from firing.
    expect(onClick(event)).toBe(false);
    sinon.assert.called(event.preventDefault);
    sinon.assert.called(event.stopPropagation);
  });

  it('disables the button when status is UNKNOWN', () => {
    const root = render({ status: UNKNOWN });

    expect(root.find(Button)).toHaveProp('disabled', true);
  });

  it('disables the button when currentVersion is null', () => {
    const root = render({ currentVersion: null });

    expect(root.find(Button)).toHaveProp('disabled', true);
    expect(root.find(Button)).toHaveProp('href', undefined);
  });

  it('adds defaultInstallSource to extension buttons', () => {
    const installURL = 'https://addons.mozilla.org/download';
    const defaultInstallSource = 'homepage';
    const root = render({
      currentVersion: createInternalVersionWithInstallURL({ installURL }),
      defaultInstallSource,
    });

    expect(root.find(Button)).toHaveProp(
      'href',
      `${installURL}?src=${defaultInstallSource}`,
    );
  });

  it('adds defaultInstallSource to search provider buttons', () => {
    const installURL = 'https://addons.mozilla.org/download';
    const defaultInstallSource = 'homepage';
    const root = renderOpenSearch({
      currentVersion: createInternalVersionWithInstallURL({ installURL }),
      defaultInstallSource,
    });

    expect(root.find(Button)).toHaveProp(
      'href',
      `${installURL}?src=${defaultInstallSource}`,
    );
  });

  it('calls `window.external.AddSearchProvider` to install a search provider', () => {
    const fakeLog = getFakeLogger();
    const fakeWindow = createFakeMozWindow();
    const installURL = 'https://a.m.o/files/addon.xpi';

    const root = renderOpenSearch({
      currentVersion: createInternalVersionWithInstallURL({ installURL }),
      _log: fakeLog,
      _window: fakeWindow,
    });

    const installButton = root.find('.AMInstallButton-button');
    expect(installButton.childAt(1)).toHaveText('Add to Firefox');

    const clickEvent = createFakeEventWithURL({ url: installURL });
    installButton.simulate('click', clickEvent);

    sinon.assert.calledOnce(clickEvent.preventDefault);
    sinon.assert.calledOnce(clickEvent.stopPropagation);

    sinon.assert.calledWith(fakeLog.info, 'Adding OpenSearch Provider');
    sinon.assert.calledWith(fakeWindow.external.AddSearchProvider, installURL);
  });

  it('does not render anything on the server when add-on is a search provider', () => {
    const root = renderOpenSearch({
      _config: getFakeConfig({ server: true }),
    });

    expect(root.find('.AMInstallButton-button')).toHaveLength(0);
  });

  it('tracks install analytics when installing a search provider', () => {
    const _tracking = createFakeTracking();
    const _window = createFakeMozWindow();
    const addon = createInternalAddon({
      ...fakeAddon,
      name: 'some-search-provider',
      type: ADDON_TYPE_OPENSEARCH,
    });

    const root = renderOpenSearch({
      addon,
      _tracking,
      _window,
    });

    const installButton = root.find('.AMInstallButton-button');
    installButton.simulate('click', createFakeEvent());

    sinon.assert.calledWith(_tracking.sendEvent, {
      action: getAddonTypeForTracking(ADDON_TYPE_OPENSEARCH),
      category: getAddonEventCategory(
        ADDON_TYPE_OPENSEARCH,
        INSTALL_STARTED_ACTION,
      ),
      label: addon.name,
    });
    sinon.assert.calledWith(_tracking.sendEvent, {
      action: getAddonTypeForTracking(ADDON_TYPE_OPENSEARCH),
      category: getAddonEventCategory(ADDON_TYPE_OPENSEARCH, INSTALL_ACTION),
      label: addon.name,
    });
    sinon.assert.calledTwice(_tracking.sendEvent);
  });

  it('calls the `install` helper to install an extension', async () => {
    const addon = createInternalAddon(fakeAddon);
    const enable = sinon.spy();
    const install = sinon.spy();

    const root = render({ addon, enable, install });

    const event = createFakeEvent();
    const installButton = root.find('.AMInstallButton-button');

    const onClick = installButton.prop('onClick');
    await onClick(event);

    sinon.assert.calledOnce(install);
    sinon.assert.notCalled(enable);
    sinon.assert.calledOnce(event.preventDefault);
    sinon.assert.calledOnce(event.stopPropagation);
  });

  it('sends a tracking event for the install warning test when installing an extension', async () => {
    const _tracking = createFakeTracking();
    const addon = createInternalAddon({ ...fakeAddon, is_recommended: true });
    const variant = VARIANT_INCLUDE_WARNING_CURRENT;

    const root = render({
      _tracking,
      addon,
      isExperimentEnabled: true,
      isUserInExperiment: true,
      variant,
    });

    const event = createFakeEvent();
    const installButton = root.find('.AMInstallButton-button');

    const onClick = installButton.prop('onClick');
    await onClick(event);

    sinon.assert.calledWith(_tracking.sendEvent, {
      action: variant,
      category: `${EXPERIMENT_CATEGORY_CLICK}-recommended`,
      label: addon.name,
    });
    sinon.assert.calledOnce(_tracking.sendEvent);
  });

  it('sends the expected category for a tracking event for a non-recommended extension', async () => {
    const _tracking = createFakeTracking();
    const addon = createInternalAddon({ ...fakeAddon, is_recommended: false });
    const variant = VARIANT_INCLUDE_WARNING_CURRENT;

    const root = render({
      _tracking,
      addon,
      isExperimentEnabled: true,
      isUserInExperiment: true,
      variant,
    });

    const event = createFakeEvent();
    const installButton = root.find('.AMInstallButton-button');

    const onClick = installButton.prop('onClick');
    await onClick(event);

    sinon.assert.calledWith(_tracking.sendEvent, {
      action: variant,
      category: `${EXPERIMENT_CATEGORY_CLICK}-not_recommended`,
      label: addon.name,
    });
    sinon.assert.calledOnce(_tracking.sendEvent);
  });

  it('does not send a tracking event for the install warning test if the experiment is disabled', async () => {
    const _tracking = createFakeTracking();
    const addon = createInternalAddon({ ...fakeAddon, is_recommended: false });

    const root = render({
      _tracking,
      addon,
      isExperimentEnabled: false,
      variant: VARIANT_INCLUDE_WARNING_CURRENT,
    });

    const event = createFakeEvent();
    const installButton = root.find('.AMInstallButton-button');

    const onClick = installButton.prop('onClick');
    await onClick(event);

    sinon.assert.notCalled(_tracking.sendEvent);
  });

  it('does not send a tracking event for the install warning test if there is no variant', async () => {
    const _tracking = createFakeTracking();
    const addon = createInternalAddon({ ...fakeAddon, is_recommended: false });

    const root = render({
      _tracking,
      addon,
      isExperimentEnabled: true,
    });

    const event = createFakeEvent();
    const installButton = root.find('.AMInstallButton-button');

    const onClick = installButton.prop('onClick');
    await onClick(event);

    sinon.assert.notCalled(_tracking.sendEvent);
  });

  it('does not send a tracking event for the install warning test if the user is not in the experiment', async () => {
    const _tracking = createFakeTracking();
    const addon = createInternalAddon({ ...fakeAddon, is_recommended: false });

    const root = render({
      _tracking,
      addon,
      isExperimentEnabled: true,
      isUserInExperiment: false,
      variant: VARIANT_INCLUDE_WARNING_CURRENT,
    });

    const event = createFakeEvent();
    const installButton = root.find('.AMInstallButton-button');

    const onClick = installButton.prop('onClick');
    await onClick(event);

    sinon.assert.notCalled(_tracking.sendEvent);
  });

  it('does not send a tracking event for the install warning test for a theme', async () => {
    const _tracking = createFakeTracking();
    const themeAddon = { ...fakeAddon, type: ADDON_TYPE_STATIC_THEME };

    const root = render({
      _tracking,
      addon: createInternalAddon(themeAddon),
      isExperimentEnabled: true,
      variant: VARIANT_INCLUDE_WARNING_CURRENT,
    });

    const event = createFakeEvent();
    const installButton = root.find('.AMInstallButton-button');

    const onClick = installButton.prop('onClick');
    await onClick(event);

    sinon.assert.notCalled(_tracking.sendEvent);
  });

  it('does not send a tracking event for the install warning test when clientApp is Android', async () => {
    const _tracking = createFakeTracking();
    const addon = createInternalAddon({ ...fakeAddon, is_recommended: false });

    const root = render({
      _tracking,
      addon,
      isExperimentEnabled: true,
      store: dispatchClientMetadata({
        clientApp: CLIENT_APP_ANDROID,
      }).store,
    });

    const event = createFakeEvent();
    const installButton = root.find('.AMInstallButton-button');

    const onClick = installButton.prop('onClick');
    await onClick(event);

    sinon.assert.notCalled(_tracking.sendEvent);
  });

  it('calls the `install` and `enable` helpers to install a static theme', async () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      type: ADDON_TYPE_STATIC_THEME,
    });
    const enable = sinon.spy();
    const install = sinon.spy();

    const root = render({
      addon,
      enable,
      install,
      isAddonEnabled: sinon.stub().resolves(false),
    });

    const event = createFakeEvent();

    const installButton = root.find('.AMInstallButton-button');

    const onClick = installButton.prop('onClick');
    await onClick(event);

    sinon.assert.calledOnce(install);

    sinon.assert.calledWith(enable, { sendTrackingEvent: false });
    sinon.assert.calledOnce(enable);

    sinon.assert.calledOnce(event.preventDefault);
    sinon.assert.calledOnce(event.stopPropagation);
  });

  it("does not call the `enable` helper after the `install` helper for a static theme if it's already enabled", async () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      type: ADDON_TYPE_STATIC_THEME,
    });
    const enable = sinon.spy();
    const install = sinon.spy();

    const root = render({
      addon,
      enable,
      install,
      isAddonEnabled: sinon.stub().resolves(true),
    });

    const event = createFakeEvent();

    const installButton = root.find('.AMInstallButton-button');

    const onClick = installButton.prop('onClick');
    await onClick(event);

    sinon.assert.calledOnce(install);
    sinon.assert.notCalled(enable);
  });

  it.each([ENABLED, INSTALLED])(
    'renders a "remove" button when add-on is %s',
    (status) => {
      const root = render({ status });

      const button = root.find(Button);
      expect(button).toHaveLength(1);
      expect(button).toHaveProp('buttonType', 'neutral');
      expect(button).toHaveProp('onClick', root.instance().uninstallAddon);
      expect(button).toHaveClassName('AMInstallButton-button');
      expect(button).toHaveClassName('AMInstallButton-button--uninstall');

      const icon = button.find(Icon);
      expect(icon).toHaveLength(1);
      expect(icon).toHaveProp('name', 'delete');

      expect(root.find('.AMInstallButton-loading-button')).toHaveLength(0);
    },
  );

  it('renders an "enable" button when add-on is DISABLED', () => {
    const root = render({ status: DISABLED });

    const button = root.find(Button);
    expect(button).toHaveLength(1);
    expect(button).toHaveProp('buttonType', 'neutral');
    expect(button).toHaveProp('onClick', root.instance().enableAddon);
    expect(button).toHaveClassName('AMInstallButton-button');
    expect(button).toHaveClassName('AMInstallButton-button--enable');

    const icon = button.find(Icon);
    expect(icon).toHaveLength(1);
    expect(icon).toHaveProp('name', 'plus-dark');

    expect(root.find('.AMInstallButton-loading-button')).toHaveLength(0);
  });

  it('renders a "Add to Firefox" button when add-on is INACTIVE', () => {
    const root = render({ status: INACTIVE });

    const button = root.find(Button);
    expect(button).toHaveLength(1);
    expect(button.childAt(1)).toHaveText('Add to Firefox');
  });

  it("renders custom button text when it's passed in", () => {
    const defaultButtonText = 'Install here';

    const root = render({ defaultButtonText });

    const button = root.find(Button);
    expect(button).toHaveLength(1);
    expect(button.childAt(1)).toHaveText(defaultButtonText);
  });

  it.each([DOWNLOADING, ENABLING, INSTALLING, UNINSTALLING])(
    'renders a loading Icon when add-on is %s',
    (status) => {
      const root = render({ status });

      expect(root).toHaveClassName('AMInstallButton');
      expect(root.find('.AMInstallButton-button')).toHaveLength(0);

      expect(root.find('.AMInstallButton-loading-button')).toHaveLength(1);
      expect(root.find('.AMInstallButton-loader-container')).toHaveLength(1);
      expect(root.find('.visually-hidden')).toHaveLength(1);
    },
  );

  it('renders an Icon when add-on is a static theme and status is INSTALLED', () => {
    const root = render({
      addon: createInternalAddon({
        ...fakeTheme,
        type: ADDON_TYPE_STATIC_THEME,
      }),
      status: INSTALLED,
    });

    expect(root).toHaveClassName('AMInstallButton');
    expect(root.find('.AMInstallButton-button')).toHaveLength(0);

    expect(root.find('.AMInstallButton-loading-button')).toHaveLength(1);
    expect(root.find('.AMInstallButton-loader-container')).toHaveLength(1);
    expect(root.find('.visually-hidden')).toHaveLength(1);
  });

  it('sets an `alt` prop to the Icon when status is DOWNLOADING', () => {
    const root = render({ status: DOWNLOADING });

    expect(root.find('.AMInstallButton-loading-button')).toHaveProp(
      'title',
      'Downloading',
    );
  });

  it('sets an `alt` prop to the Icon when status is ENABLING', () => {
    const root = render({ status: ENABLING });

    expect(root.find('.AMInstallButton-loading-button')).toHaveProp(
      'title',
      'Enabling',
    );
  });

  it('sets an `alt` prop to the Icon when status is INSTALLING', () => {
    const root = render({ status: INSTALLING });

    expect(root.find('.AMInstallButton-loading-button')).toHaveProp(
      'title',
      'Installing',
    );
  });

  it('sets an `alt` prop to the Icon when status is UNINSTALLING', () => {
    const root = render({ status: UNINSTALLING });

    expect(root.find('.AMInstallButton-loading-button')).toHaveProp(
      'title',
      'Uninstalling',
    );
  });

  it('calls the `uninstall` helper when uninstalling an add-on', () => {
    const installURL = 'http://example.org/install/url';
    const addon = createInternalAddon(fakeAddon);
    const uninstall = sinon.spy();

    const root = render({
      addon,
      uninstall,
      status: INSTALLED,
    });
    sinon.assert.notCalled(uninstall);

    const clickEvent = createFakeEventWithURL({ url: installURL });

    root.find(Button).simulate('click', clickEvent);

    sinon.assert.calledWith(uninstall, {
      guid: addon.guid,
      name: addon.name,
      type: addon.type,
    });
    sinon.assert.calledOnce(uninstall);

    sinon.assert.calledOnce(clickEvent.preventDefault);
    sinon.assert.calledOnce(clickEvent.stopPropagation);
  });

  it('calls the `enable` helper when enabling an add-on', () => {
    const enable = sinon.spy();

    const root = render({ enable, status: DISABLED });
    sinon.assert.notCalled(enable);

    const clickEvent = createFakeEvent();
    root.find(Button).simulate('click', clickEvent);

    // `enable` should be called with NO arguments.
    sinon.assert.calledWithExactly(enable);
    sinon.assert.calledOnce(enable);

    sinon.assert.calledOnce(clickEvent.preventDefault);
    sinon.assert.calledOnce(clickEvent.stopPropagation);
  });

  it('accepts an extra CSS class name', () => {
    const className = 'foo-bar';
    const root = render({ className });

    expect(root).toHaveClassName('AMInstallButton');
    expect(root).toHaveClassName(className);
  });

  it('is not disabled when it is an opensearch add-on', () => {
    const root = renderOpenSearch({ status: UNKNOWN });

    expect(root.find(Button)).toHaveProp('disabled', false);
  });
});
