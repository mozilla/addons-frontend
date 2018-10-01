/* global Node */
import { createMemoryHistory } from 'history';
import * as React from 'react';
import { Router } from 'react-router-dom';
import { mount } from 'enzyme';

import createStore from 'amo/store';
import InstallButton, {
  InstallButtonBase,
} from 'core/components/InstallButton';
import InstallSwitch from 'core/components/InstallSwitch';
import I18nProvider from 'core/i18n/Provider';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
  INCOMPATIBLE_NO_OPENSEARCH,
  INCOMPATIBLE_NOT_FIREFOX,
  INSTALL_ACTION,
  INSTALL_STARTED_ACTION,
  OS_ALL,
  UNKNOWN,
} from 'core/constants';
import { getAddonIconUrl } from 'core/imageUtils';
import { createInternalAddon } from 'core/reducers/addons';
import * as themeInstall from 'core/themeInstall';
import { getAddonTypeForTracking, getAddonEventCategory } from 'core/tracking';
import { addQueryParamsToHistory } from 'core/utils';
import {
  createContextWithFakeRouter,
  createFakeEvent,
  createFakeMozWindow,
  fakeI18n,
  createFakeLocation,
  getFakeConfig,
  sampleUserAgentParsed,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import { createFakeAddon, fakeAddon, fakeTheme } from 'tests/unit/amo/helpers';
import Button from 'ui/components/Button';

describe(__filename, () => {
  const getClientCompatibilityFalse = () => ({
    compatible: false,
    reason: INCOMPATIBLE_NOT_FIREFOX,
  });

  const getClientCompatibilityFalseOpenSearch = () => ({
    compatible: false,
    reason: INCOMPATIBLE_NO_OPENSEARCH,
  });

  const renderProps = (customProps = {}) => ({
    _config: getFakeConfig({ client: true }),
    addon: createInternalAddon(fakeAddon),
    getClientCompatibility: () => ({ compatible: true }),
    hasAddonManager: true,
    i18n: fakeI18n(),
    store: createStore().store,
    userAgentInfo: sampleUserAgentParsed,
    ...customProps,
  });

  const render = (props) => {
    const { location, ...otherProps } = renderProps(props);

    return shallowUntilTarget(
      <InstallButton {...otherProps} />,
      InstallButtonBase,
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
      // Install buttons for opensearch add-ons are not rendered on
      // the server.
      _config: getFakeConfig({ server: false }),
      ...customProps,
    };
    return render(props);
  };

  const renderToDom = (customProps = {}) => {
    const { i18n, location, ...props } = renderProps(customProps);

    const history = addQueryParamsToHistory({
      history: createMemoryHistory(),
    });

    return mount(
      <I18nProvider i18n={i18n}>
        <Router history={history}>
          <InstallButton {...props} />
        </Router>
      </I18nProvider>,
    );
  };

  it('renders InstallSwitch when mozAddonManager is available', () => {
    const installURL = 'https://a.m.o/files/addon.xpi';
    // This can't use createFakeAddon({ files: [...] }) because it needs
    // to specify a custom object for addon.current_version.
    const addon = createInternalAddon({
      ...fakeTheme,
      current_version: {
        ...fakeTheme.current_version,
        files: [
          {
            ...fakeTheme.current_version.files[0],
            platform: OS_ALL,
            url: installURL,
          },
        ],
      },
    });
    const root = render({
      hasAddonManager: true,
      addon,
      // Simulate how disco/components/Addon spreads addon theme data.
      ...addon,
    });
    expect(root.type()).toEqual('div');
    expect(root).toHaveClassName('InstallButton');
    expect(root).toHaveClassName('InstallButton--use-switch');

    const switchComponent = root.childAt(0);
    expect(switchComponent.type()).toEqual(InstallSwitch);

    expect(switchComponent).toHaveClassName('InstallButton-switch');
    expect(switchComponent).toHaveProp('addon', addon);
    expect(switchComponent).toHaveProp('installURL', installURL);

    // Make sure it passes all theme properties.
    expect(switchComponent.props()).toMatchObject(addon.themeData);
  });

  it('renders a theme button when mozAddonManager is not available', () => {
    const addon = createInternalAddon(fakeTheme);
    const root = render({ hasAddonManager: false, addon });

    expect(root.type()).toEqual('div');
    expect(root).toHaveClassName('InstallButton');
    expect(root).toHaveClassName('InstallButton--use-button');

    const button = root.childAt(1);

    expect(button.type()).toEqual(Button);
    expect(button.children().at(1)).toHaveText('Install Theme');
    expect(button).toHaveProp(
      'data-browsertheme',
      JSON.stringify(themeInstall.getThemeData(addon)),
    );
  });

  it('renders Install Theme text on button when it is a static theme', () => {
    const addon = createInternalAddon({
      ...fakeTheme,
      type: ADDON_TYPE_STATIC_THEME,
    });
    const root = render({ hasAddonManager: false, addon });

    expect(root.type()).toEqual('div');
    expect(root).toHaveClassName('InstallButton');
    expect(root).toHaveClassName('InstallButton--use-button');

    const button = root.childAt(1);

    expect(button.type()).toEqual(Button);
    expect(button.children().at(1)).toHaveText('Install Theme');
  });

  it('calls installTheme when clicked', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      type: ADDON_TYPE_THEME,
    });
    const installTheme = sinon.spy();
    const root = renderToDom({ addon, installTheme, status: UNKNOWN });

    const preventDefault = sinon.spy();
    const button = root.find('button.InstallButton-button');
    button.simulate('click', createFakeEvent({ preventDefault }));

    sinon.assert.called(preventDefault);
    sinon.assert.calledWith(installTheme, sinon.match.instanceOf(Node), {
      name: addon.name,
      status: UNKNOWN,
      type: addon.type,
    });
  });

  it('renders an add-on button when mozAddonManager is not available', () => {
    const installURL = 'https://addons.mozilla.org/download';
    const root = render({
      addon: createInternalAddon(
        createFakeAddon({
          type: ADDON_TYPE_EXTENSION,
          files: [{ platform: OS_ALL, url: installURL }],
        }),
      ),
      hasAddonManager: false,
    });

    expect(root.type()).toEqual('div');
    expect(root).toHaveClassName('InstallButton');
    expect(root).toHaveClassName('InstallButton--use-button');

    const button = root.childAt(1);

    expect(button.type()).toEqual(Button);

    expect(button.children().at(1)).toHaveText('Add to Firefox');
    expect(button).toHaveClassName('InstallButton-button');
    expect(button).not.toHaveClassName('Button--micro');
    expect(button).toHaveProp('href', installURL);
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

    const button = root.childAt(1);
    expect(button).toHaveProp('href', `${installURL}?src=${externalSource}`);
  });

  it('disables add-on install when client does not support addons', () => {
    const installURL = 'https://addons.mozilla.org/download';
    const root = render({
      addon: createInternalAddon(
        createFakeAddon({
          type: ADDON_TYPE_EXTENSION,
          files: [{ platform: OS_ALL, url: installURL }],
        }),
      ),
      getClientCompatibility: getClientCompatibilityFalse,
    });

    expect(root.type()).toEqual('div');

    const button = root.childAt(1);

    expect(button.type()).toEqual(Button);
    expect(button).toHaveClassName('InstallButton-button--disabled');
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

  it('disables theme install when client does not support addons', () => {
    const root = render({
      addon: createInternalAddon({
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
      }),
      getClientCompatibility: getClientCompatibilityFalse,
    });

    expect(root.type()).toEqual('div');

    const button = root.childAt(1);

    expect(button.type()).toEqual(Button);
    expect(button).toHaveProp('disabled', true);
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
      hasAddonManager: false,
    });

    const button = root.childAt(1);
    expect(button).toHaveProp(
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
      hasAddonManager: false,
    });

    const button = root.childAt(1);
    expect(button).toHaveProp(
      'href',
      `${installURL}?src=${defaultInstallSource}`,
    );
  });

  it('renders a switch button if useButton is false', () => {
    const root = render({ useButton: false });

    expect(root).toHaveClassName('InstallButton--use-switch');
  });

  it('renders a button if useButton is true', () => {
    const root = render({ useButton: true });

    expect(root).toHaveClassName('InstallButton--use-button');

    const button = root.childAt(1);

    expect(button.type()).toEqual(Button);
    expect(button).toHaveClassName('Button--action');
    expect(button).toHaveClassName('InstallButton-button');
    expect(button.children().at(1)).toHaveText('Add to Firefox');
  });

  it('renders a button for OpenSearch regardless of mozAddonManager', () => {
    const root = renderOpenSearch({
      addon: createInternalAddon({
        ...fakeAddon,
        hasAddonManager: true,
        type: ADDON_TYPE_OPENSEARCH,
      }),
    });

    expect(root.type()).toEqual('div');

    const button = root.childAt(1);

    expect(button.type()).toEqual(Button);
    expect(button).toHaveClassName('Button--action');
    expect(button).toHaveClassName('InstallButton-button');
    expect(button.children().at(1)).toHaveText('Add to Firefox');
  });

  it('disables the OpenSearch button if not compatible', () => {
    const root = renderOpenSearch({
      getClientCompatibility: getClientCompatibilityFalseOpenSearch,
    });

    expect(root.type()).toEqual('div');

    const button = root.childAt(1);

    expect(button.type()).toEqual(Button);
    expect(button).toHaveClassName('InstallButton-button--disabled');
    expect(button.children().at(1)).toHaveText('Add to Firefox');
  });

  it('disables install switch and uses button for OpenSearch plugins', () => {
    const fakeLog = { info: sinon.stub() };
    const fakeWindow = createFakeMozWindow();
    const installURL = 'https://a.m.o/files/addon.xpi';

    const rootNode = renderOpenSearch({
      addon: createInternalAddon(
        createFakeAddon({
          files: [{ platform: OS_ALL, url: installURL }],
          type: ADDON_TYPE_OPENSEARCH,
        }),
      ),
      _log: fakeLog,
      _window: fakeWindow,
    });

    const installButton = rootNode.find('.InstallButton-button');
    expect(installButton.children().at(1)).toHaveText('Add to Firefox');
    installButton.simulate('click', createFakeEvent());

    sinon.assert.calledWith(fakeLog.info, 'Adding OpenSearch Provider');
    sinon.assert.calledWith(fakeWindow.external.AddSearchProvider, installURL);
  });

  it('does not render open search plugins on the server', () => {
    const rootNode = renderOpenSearch({
      _config: getFakeConfig({ server: true }),
    });

    expect(rootNode.find('.InstallButton-button')).toHaveLength(0);
  });

  it('tracks install analytics when installing an extension', () => {
    const _tracking = { sendEvent: sinon.stub() };
    const addon = createInternalAddon(
      createFakeAddon({
        name: 'some-extension',
        files: [{ platform: OS_ALL, url: 'https://a.m.o/files/addon.xpi' }],
        type: ADDON_TYPE_EXTENSION,
      }),
    );

    const rootNode = render({ addon, useButton: true, _tracking });

    const installButton = rootNode.find('.InstallButton-button');
    installButton.simulate('click', createFakeEvent());

    sinon.assert.calledWith(_tracking.sendEvent, {
      action: getAddonTypeForTracking(ADDON_TYPE_EXTENSION),
      category: getAddonEventCategory(
        ADDON_TYPE_EXTENSION,
        INSTALL_STARTED_ACTION,
      ),
      label: addon.name,
    });
  });

  it('tracks install analytics when installing a search provider', () => {
    const _tracking = { sendEvent: sinon.stub() };
    const _window = createFakeMozWindow();
    const addon = createInternalAddon(
      createFakeAddon({
        name: 'some-search-provider',
        files: [{ platform: OS_ALL, url: 'https://a.m.o/files/addon.xpi' }],
        type: ADDON_TYPE_OPENSEARCH,
      }),
    );

    const rootNode = renderOpenSearch({
      addon,
      useButton: true,
      _tracking,
      _window,
    });

    const installButton = rootNode.find('.InstallButton-button');
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

  it('uses InstallTrigger for extension installs when available', () => {
    const url = 'https://a.m.o/files/addon.xpi';
    const hash = 'hash-of-file-contents';

    const _InstallTrigger = { install: sinon.stub() };

    const addon = createInternalAddon(
      createFakeAddon({
        name: 'some-extension',
        files: [{ platform: OS_ALL, url, hash }],
        type: ADDON_TYPE_EXTENSION,
      }),
    );

    const rootNode = render({ addon, useButton: true, _InstallTrigger });

    const event = createFakeEvent();
    const installButton = rootNode.find('.InstallButton-button');
    installButton.simulate('click', event);

    sinon.assert.called(_InstallTrigger.install);
    const params = _InstallTrigger.install.firstCall.args[0];
    expect(params[addon.name]).toBeDefined();
    expect(params[addon.name].Hash).toEqual(hash);
    expect(params[addon.name].URL).toEqual(url);
    expect(params[addon.name].IconURL).toEqual(getAddonIconUrl(addon));
    expect(params[addon.name].toString()).toEqual(url);

    sinon.assert.called(event.preventDefault);
    sinon.assert.called(event.stopPropagation);
  });

  it('tracks install started/completed with InstallTrigger', () => {
    const url = 'https://a.m.o/addons/file.xpi';
    const _tracking = { sendEvent: sinon.stub() };
    const _InstallTrigger = { install: sinon.stub() };

    const addon = createInternalAddon(
      createFakeAddon({
        name: 'some-extension',
        files: [{ platform: OS_ALL, url, hash: 'hash-of-file' }],
        type: ADDON_TYPE_EXTENSION,
      }),
    );

    const rootNode = render({
      addon,
      useButton: true,
      _tracking,
      _InstallTrigger,
    });

    const installButton = rootNode.find('.InstallButton-button');
    installButton.simulate('click', createFakeEvent());

    sinon.assert.called(_InstallTrigger.install);
    const onInstalled = _InstallTrigger.install.firstCall.args[1];

    sinon.assert.calledOnce(_tracking.sendEvent);
    sinon.assert.calledWith(_tracking.sendEvent, {
      action: getAddonTypeForTracking(ADDON_TYPE_EXTENSION),
      category: getAddonEventCategory(
        ADDON_TYPE_EXTENSION,
        INSTALL_STARTED_ACTION,
      ),
      label: addon.name,
    });

    _tracking.sendEvent.resetHistory();
    // Simulate the InstallTrigger callback.
    const successStatus = 0;
    onInstalled(url, successStatus);

    sinon.assert.calledOnce(_tracking.sendEvent);
    sinon.assert.calledWith(_tracking.sendEvent, {
      action: getAddonTypeForTracking(ADDON_TYPE_EXTENSION),
      category: getAddonEventCategory(ADDON_TYPE_EXTENSION, INSTALL_ACTION),
      label: addon.name,
    });
  });
});
