/* global Node */
import * as React from 'react';

import createStore from 'amo/store';
import NewInstallButton, {
  NewInstallButtonBase,
} from 'core/components/NewInstallButton';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_STATIC_THEME,
  DISABLED,
  DOWNLOADING,
  ENABLED,
  ENABLING,
  INSTALLED,
  INSTALLING,
  INSTALL_STARTED_ACTION,
  OS_ALL,
  UNINSTALLED,
  UNINSTALLING,
  UNKNOWN,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import * as themeInstall from 'core/themeInstall';
import { getAddonTypeForTracking, getAddonEventCategory } from 'core/tracking';
import AnimatedIcon from 'ui/components/AnimatedIcon';
import Icon from 'ui/components/Icon';
import {
  createContextWithFakeRouter,
  createFakeEvent,
  createFakeMozWindow,
  createFakeTracking,
  fakeI18n,
  createFakeLocation,
  getFakeConfig,
  sampleUserAgentParsed,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import { createFakeAddon, fakeAddon, fakeTheme } from 'tests/unit/amo/helpers';
import Button from 'ui/components/Button';

describe(__filename, () => {
  const createFakeEventWithURL = ({ url }) => {
    return createFakeEvent({
      currentTarget: {
        href: url,
      },
    });
  };

  const createInternalAddonWithInstallURL = ({
    addon = fakeAddon,
    installURL = 'https://a.m.o/files/addon.xpi',
  }) => {
    // This can't use createFakeAddon({ files: [...] }) because it needs to
    // specify a custom object for addon.current_version.
    return createInternalAddon({
      ...addon,
      current_version: {
        ...addon.current_version,
        files: [
          {
            ...addon.current_version.files[0],
            platform: OS_ALL,
            url: installURL,
          },
        ],
      },
    });
  };

  const renderProps = (customProps = {}) => ({
    addon: createInternalAddon(fakeAddon),
    defaultInstallSource: '',
    disabled: false,
    enable: sinon.stub(),
    hasAddonManager: true,
    i18n: fakeI18n(),
    install: sinon.stub(),
    installTheme: sinon.stub(),
    location: createFakeLocation(),
    status: UNINSTALLED,
    store: createStore().store,
    uninstall: sinon.stub(),
    userAgentInfo: sampleUserAgentParsed,
    ...customProps,
  });

  const render = (props) => {
    const { location, ...otherProps } = renderProps(props);

    return shallowUntilTarget(
      <NewInstallButton {...otherProps} />,
      NewInstallButtonBase,
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

  it('renders a Button for extensions', () => {
    const installURL = 'https://a.m.o/files/addon.xpi';
    const addon = createInternalAddonWithInstallURL({ installURL });

    const root = render({ addon });

    expect(root.type()).toEqual('div');
    expect(root).toHaveClassName('NewInstallButton');

    const button = root.find(Button);

    expect(button).toHaveLength(1);
    expect(button.childAt(1)).toHaveText('Add to Firefox');
    expect(button).toHaveClassName('NewInstallButton-button');
    expect(button).not.toHaveClassName('NewInstallButton-button--uninstall');
    expect(button).toHaveProp('buttonType', 'action');
    expect(button).toHaveProp('className', 'NewInstallButton-button');
    expect(button).toHaveProp('disabled', false);
    expect(button).not.toHaveProp('data-browsertheme');
    expect(button).toHaveProp('href', installURL);
    expect(button).toHaveProp('onClick', root.instance().installExtension);

    const icon = button.find(Icon);
    expect(icon).toHaveLength(1);
    expect(icon).toHaveProp('name', 'plus');
  });

  it('renders a button for themes', () => {
    const installURL = 'https://a.m.o/files/addon.xpi';
    const addon = createInternalAddonWithInstallURL({
      addon: fakeTheme,
      installURL,
    });

    const root = render({ addon });

    expect(root.type()).toEqual('div');
    expect(root).toHaveClassName('NewInstallButton');

    const button = root.find(Button);

    expect(button).toHaveLength(1);
    expect(button.childAt(1)).toHaveText('Install Theme');
    expect(button).toHaveClassName('NewInstallButton-button');
    expect(button).toHaveProp('buttonType', 'action');
    expect(button).toHaveProp('className', 'NewInstallButton-button');
    expect(button).toHaveProp('disabled', false);
    expect(button).toHaveProp(
      'data-browsertheme',
      JSON.stringify(themeInstall.getThemeData(addon)),
    );
    expect(button).toHaveProp('href', installURL);
    expect(button).toHaveProp('onClick', root.instance().installTheme);

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

  it('calls the `installTheme` helper to install a theme', () => {
    const addon = createInternalAddon(fakeTheme);

    const installTheme = sinon.spy();
    const root = render({ addon, installTheme });

    const button = root.find('.NewInstallButton-button');
    const clickEvent = createFakeEvent();
    button.simulate('click', clickEvent);

    sinon.assert.calledOnce(clickEvent.preventDefault);
    sinon.assert.calledOnce(clickEvent.stopPropagation);

    sinon.assert.calledWith(installTheme, clickEvent.currentTarget, {
      ...addon,
      status: UNINSTALLED,
    });
  });

  it('uses router location to create install URLs', () => {
    const externalSource = 'my-blog';
    const installURL = 'https://addons.mozilla.org/download';
    const root = render({
      addon: createInternalAddon(
        createFakeAddon({
          files: [{ platform: OS_ALL, url: installURL }],
        }),
      ),
      defaultInstallSource: 'this-should-be-overidden',
      location: createFakeLocation({ query: { src: externalSource } }),
    });

    const button = root.find(Button);
    expect(button).toHaveProp('href', `${installURL}?src=${externalSource}`);
  });

  it('disables the button when disabled prop is true', () => {
    const installURL = 'https://addons.mozilla.org/download';
    const root = render({
      addon: createInternalAddon(
        createFakeAddon({
          type: ADDON_TYPE_EXTENSION,
          files: [{ platform: OS_ALL, url: installURL }],
        }),
      ),
      disabled: true,
    });

    const button = root.find('.NewInstallButton-button');

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

  it('adds defaultInstallSource to extension buttons', () => {
    const installURL = 'https://addons.mozilla.org/download';
    const defaultInstallSource = 'homepage';
    const root = render({
      addon: createInternalAddon(
        createFakeAddon({
          type: ADDON_TYPE_EXTENSION,
          files: [{ platform: OS_ALL, url: installURL }],
        }),
      ),
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
      addon: createInternalAddon(
        createFakeAddon({
          type: ADDON_TYPE_OPENSEARCH,
          files: [{ platform: OS_ALL, url: installURL }],
        }),
      ),
      defaultInstallSource,
    });

    expect(root.find(Button)).toHaveProp(
      'href',
      `${installURL}?src=${defaultInstallSource}`,
    );
  });

  it('calls `window.external.AddSearchProvider` to install a search provider', () => {
    const fakeLog = { info: sinon.stub() };
    const fakeWindow = createFakeMozWindow();
    const installURL = 'https://a.m.o/files/addon.xpi';

    const root = renderOpenSearch({
      addon: createInternalAddon(
        createFakeAddon({
          files: [{ platform: OS_ALL, url: installURL }],
          type: ADDON_TYPE_OPENSEARCH,
        }),
      ),
      _log: fakeLog,
      _window: fakeWindow,
    });

    const installButton = root.find('.NewInstallButton-button');
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

    expect(root.find('.NewInstallButton-button')).toHaveLength(0);
  });

  it('tracks install analytics when installing a search provider', () => {
    const _tracking = createFakeTracking();
    const _window = createFakeMozWindow();
    const addon = createInternalAddon(
      createFakeAddon({
        name: 'some-search-provider',
        files: [{ platform: OS_ALL, url: 'https://a.m.o/files/addon.xpi' }],
        type: ADDON_TYPE_OPENSEARCH,
      }),
    );

    const root = renderOpenSearch({
      addon,
      _tracking,
      _window,
    });

    const installButton = root.find('.NewInstallButton-button');
    installButton.simulate('click', createFakeEvent());

    sinon.assert.calledWith(_tracking.sendEvent, {
      action: getAddonTypeForTracking(ADDON_TYPE_OPENSEARCH),
      category: getAddonEventCategory(
        ADDON_TYPE_OPENSEARCH,
        INSTALL_STARTED_ACTION,
      ),
      label: addon.name,
    });
  });

  it('calls the `install` helper to install an extension', async () => {
    const addon = createInternalAddon(fakeAddon);
    const enable = sinon.spy();
    const install = sinon.spy();

    const root = render({ addon, enable, install });

    const event = createFakeEvent();
    const installButton = root.find('.NewInstallButton-button');
    await installButton.simulate('click', event);

    sinon.assert.calledOnce(install);
    sinon.assert.notCalled(enable);
    sinon.assert.calledOnce(event.preventDefault);
    sinon.assert.calledOnce(event.stopPropagation);
  });

  it('calls the `install` and `enable` helpers to install a static theme', async () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      type: ADDON_TYPE_STATIC_THEME,
    });
    const enable = sinon.spy();
    const install = sinon.spy();

    const root = render({ addon, enable, install });

    const event = createFakeEvent();

    const installButton = root.find('.NewInstallButton-button');
    await installButton.simulate('click', event);

    sinon.assert.calledOnce(install);
    sinon.assert.calledOnce(enable);
    sinon.assert.calledOnce(event.preventDefault);
    sinon.assert.calledOnce(event.stopPropagation);
  });

  it.each([ENABLED, INSTALLED])(
    'renders a "remove" button when add-on is %s',
    (status) => {
      const root = render({ status });

      const button = root.find(Button);
      expect(button).toHaveLength(1);
      expect(button).toHaveProp('buttonType', 'neutral');
      expect(button).toHaveProp('onClick', root.instance().uninstallAddon);
      expect(button).toHaveClassName('NewInstallButton-button');
      expect(button).toHaveClassName('NewInstallButton-button--uninstall');

      const icon = button.find(Icon);
      expect(icon).toHaveLength(1);
      expect(icon).toHaveProp('name', 'delete');

      expect(root.find(AnimatedIcon)).toHaveLength(0);
    },
  );

  it('renders an "enable" button when add-on is DISABLED', () => {
    const root = render({ status: DISABLED });

    const button = root.find(Button);
    expect(button).toHaveLength(1);
    expect(button).toHaveProp('buttonType', 'neutral');
    expect(button).toHaveProp('onClick', root.instance().enableAddon);
    expect(button).toHaveClassName('NewInstallButton-button');
    expect(button).toHaveClassName('NewInstallButton-button--enable');

    const icon = button.find(Icon);
    expect(icon).toHaveLength(1);
    expect(icon).toHaveProp('name', 'plus-dark');

    expect(root.find(AnimatedIcon)).toHaveLength(0);
  });

  it.each([DOWNLOADING, ENABLING, INSTALLING, UNINSTALLING])(
    'renders an AnimatedIcon when add-on is %s',
    (status) => {
      const root = render({ status });

      expect(root).toHaveClassName('NewInstallButton');
      expect(root.find('.NewInstallButton-button')).toHaveLength(0);

      expect(root.find('.NewInstallButton-loading')).toHaveLength(1);
      expect(root.find(AnimatedIcon)).toHaveLength(1);
      expect(root.find(AnimatedIcon)).toHaveProp('name', 'loading');
    },
  );

  it('renders an AnimatedIcon when add-on is a static theme and status is INSTALLED', () => {
    const root = render({
      addon: createInternalAddon({
        ...fakeTheme,
        type: ADDON_TYPE_STATIC_THEME,
      }),
      status: INSTALLED,
    });

    expect(root).toHaveClassName('NewInstallButton');
    expect(root.find('.NewInstallButton-button')).toHaveLength(0);

    expect(root.find('.NewInstallButton-loading')).toHaveLength(1);
    expect(root.find(AnimatedIcon)).toHaveLength(1);
  });

  it('sets an `alt` prop to the AnimatedIcon when status is DOWNLOADING', () => {
    const root = render({ status: DOWNLOADING });

    expect(root.find(AnimatedIcon)).toHaveProp('alt', 'Downloading');
  });

  it('sets an `alt` prop to the AnimatedIcon when status is ENABLING', () => {
    const root = render({ status: ENABLING });

    expect(root.find(AnimatedIcon)).toHaveProp('alt', 'Enabling');
  });

  it('sets an `alt` prop to the AnimatedIcon when status is INSTALLING', () => {
    const root = render({ status: INSTALLING });

    expect(root.find(AnimatedIcon)).toHaveProp('alt', 'Installing');
  });

  it('sets an `alt` prop to the AnimatedIcon when status is UNINSTALLING', () => {
    const root = render({ status: UNINSTALLING });

    expect(root.find(AnimatedIcon)).toHaveProp('alt', 'Uninstalling');
  });

  it('calls the `uninstall` helper when uninstalling an add-on', () => {
    const installURL = 'http://example.org/install/url';
    const addon = createInternalAddonWithInstallURL({ installURL });
    const uninstall = sinon.spy();

    const root = render({ addon, uninstall, status: INSTALLED });
    sinon.assert.notCalled(uninstall);

    const clickEvent = createFakeEventWithURL({ url: installURL });

    root.find(Button).simulate('click', clickEvent);

    sinon.assert.calledWith(uninstall, {
      guid: addon.guid,
      installURL,
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

    sinon.assert.calledOnce(enable);

    sinon.assert.calledOnce(clickEvent.preventDefault);
    sinon.assert.calledOnce(clickEvent.stopPropagation);
  });

  it('accepts an extra CSS class name', () => {
    const className = 'foo-bar';
    const root = render({ className });

    expect(root).toHaveClassName('NewInstallButton');
    expect(root).toHaveClassName(className);
  });
});
