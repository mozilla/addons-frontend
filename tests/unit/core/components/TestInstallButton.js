/* global Node */
import React from 'react';
import { mount } from 'enzyme';

import createStore from 'amo/store';
import InstallButton, { InstallButtonBase } from 'core/components/InstallButton';
import InstallSwitch from 'core/components/InstallSwitch';
import I18nProvider from 'core/i18n/Provider';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_THEME,
  INCOMPATIBLE_NO_OPENSEARCH,
  INCOMPATIBLE_NOT_FIREFOX,
  INSTALL_STARTED_CATEGORY,
  OS_ALL,
  TRACKING_TYPE_EXTENSION,
  UNKNOWN,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import * as themePreview from 'core/themePreview';
import {
  createFakeEvent,
  createFakeMozWindow,
  fakeI18n,
  sampleUserAgentParsed,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import {
  createFakeAddon, fakeAddon, fakeTheme,
} from 'tests/unit/amo/helpers';
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
    addon: createInternalAddon(fakeAddon),
    getClientCompatibility: () => ({ compatible: true }),
    hasAddonManager: true,
    i18n: fakeI18n(),
    store: createStore().store,
    userAgentInfo: sampleUserAgentParsed,
    ...customProps,
  });

  const render = (props) => shallowUntilTarget(
    <InstallButton {...renderProps(props)} />, InstallButtonBase
  );

  const renderToDom = (customProps = {}) => {
    const props = renderProps(customProps);
    return mount(
      <I18nProvider i18n={props.i18n}>
        <InstallButtonBase {...props} />
      </I18nProvider>
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
        files: [{
          ...fakeTheme.current_version.files[0],
          platform: OS_ALL,
          url: installURL,
        }],
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
    // Check a few theme properties.
    expect(switchComponent)
      .toHaveProp('accentcolor', fakeTheme.theme_data.accentcolor);
    expect(switchComponent)
      .toHaveProp('author', fakeTheme.theme_data.author);
  });

  it('renders a theme button when mozAddonManager is not available', () => {
    const addon = createInternalAddon(fakeTheme);
    const root = render({ hasAddonManager: false, addon });

    expect(root.type()).toEqual('div');
    expect(root).toHaveClassName('InstallButton');
    expect(root).toHaveClassName('InstallButton--use-button');

    const button = root.childAt(1);

    expect(button.type()).toEqual(Button);
    expect(button.children()).toContain('Install Theme');
    expect(button).toHaveProp(
      'data-browsertheme', JSON.stringify(themePreview.getThemeData(addon))
    );
  });

  it('calls installTheme when clicked', () => {
    const addon = createInternalAddon({
      ...fakeAddon, type: ADDON_TYPE_THEME,
    });
    const installTheme = sinon.spy();
    const root = renderToDom({ addon, installTheme, status: UNKNOWN });

    const preventDefault = sinon.spy();
    const button = root.find('.InstallButton-button');
    button.simulate('click', createFakeEvent({ preventDefault }));

    sinon.assert.called(preventDefault);
    sinon.assert.calledWith(installTheme,
      sinon.match.instanceOf(Node), { ...addon, status: UNKNOWN });
  });

  it('renders an add-on button when mozAddonManager is not available', () => {
    const installURL = 'https://addons.mozilla.org/download';
    const root = render({
      addon: createInternalAddon(createFakeAddon({
        type: ADDON_TYPE_EXTENSION,
        files: [{ platform: OS_ALL, url: installURL }],
      })),
      hasAddonManager: false,
    });

    expect(root.type()).toEqual('div');
    expect(root).toHaveClassName('InstallButton');
    expect(root).toHaveClassName('InstallButton--use-button');

    const button = root.childAt(1);

    expect(button.type()).toEqual(Button);

    expect(button.children()).toContain('Add to Firefox');
    expect(button).toHaveClassName('InstallButton-button');
    expect(button).not.toHaveClassName('Button--small');
    expect(button).toHaveProp('href', installURL);
  });

  it('disables add-on install when client does not support addons', () => {
    const installURL = 'https://addons.mozilla.org/download';
    const root = render({
      addon: createInternalAddon(createFakeAddon({
        type: ADDON_TYPE_EXTENSION,
        files: [{ platform: OS_ALL, url: installURL }],
      })),
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
        ...fakeAddon, type: ADDON_TYPE_THEME,
      }),
      getClientCompatibility: getClientCompatibilityFalse,
    });

    expect(root.type()).toEqual('div');

    const button = root.childAt(1);

    expect(button.type()).toEqual(Button);
    expect(button).toHaveProp('disabled', true);
  });

  it('adds a src to extension buttons', () => {
    const installURL = 'https://addons.mozilla.org/download';
    const src = 'homepage';
    const root = render({
      addon: createInternalAddon(createFakeAddon({
        type: ADDON_TYPE_EXTENSION,
        files: [{ platform: OS_ALL, url: installURL }],
      })),
      hasAddonManager: false,
      src,
    });

    const button = root.childAt(1);
    expect(button).toHaveProp('href', `${installURL}?src=${src}`);
  });

  it('adds a src to search provider buttons', () => {
    const installURL = 'https://addons.mozilla.org/download';
    const src = 'homepage';
    const root = render({
      addon: createInternalAddon(createFakeAddon({
        type: ADDON_TYPE_OPENSEARCH,
        files: [{ platform: OS_ALL, url: installURL }],
      })),
      hasAddonManager: false,
      src,
    });

    const button = root.childAt(1);
    expect(button).toHaveProp('href', `${installURL}?src=${src}`);
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
    expect(button.children()).toContain('Add to Firefox');
  });

  it('renders a button for OpenSearch regardless of mozAddonManager', () => {
    const root = render({
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
    expect(button.children()).toContain('Add to Firefox');
  });

  it('disables the OpenSearch button if not compatible', () => {
    const root = render({
      addon: createInternalAddon({
        ...fakeAddon, type: ADDON_TYPE_OPENSEARCH,
      }),
      getClientCompatibility: getClientCompatibilityFalseOpenSearch,
    });

    expect(root.type()).toEqual('div');

    const button = root.childAt(1);

    expect(button.type()).toEqual(Button);
    expect(button).toHaveClassName('InstallButton-button--disabled');
    expect(button.children()).toContain('Add to Firefox');
  });

  it('disables install switch and uses button for OpenSearch plugins', () => {
    const fakeLog = { info: sinon.stub() };
    const fakeWindow = createFakeMozWindow();
    const installURL = 'https://a.m.o/files/addon.xpi';

    const rootNode = render({
      addon: createInternalAddon(createFakeAddon({
        files: [{ platform: OS_ALL, url: installURL }],
        type: ADDON_TYPE_OPENSEARCH,
      })),
      _log: fakeLog,
      _window: fakeWindow,
    });

    const installButton = rootNode.find('.InstallButton-button');
    expect(installButton.children()).toContain('Add to Firefox');
    installButton.simulate('click', createFakeEvent());

    sinon.assert.calledWith(fakeLog.info, 'Adding OpenSearch Provider');
    sinon.assert.calledWith(
      fakeWindow.external.AddSearchProvider, installURL);
  });

  it('tracks install analytics when installing an extension', () => {
    const _tracking = { sendEvent: sinon.stub() };
    const addon = createInternalAddon(createFakeAddon({
      name: 'some-extension',
      files: [{ platform: OS_ALL, url: 'https://a.m.o/files/addon.xpi' }],
      type: ADDON_TYPE_EXTENSION,
    }));

    const rootNode = render({ addon, useButton: true, _tracking });

    const installButton = rootNode.find('.InstallButton-button');
    installButton.simulate('click', createFakeEvent());

    sinon.assert.calledWith(_tracking.sendEvent, {
      action: TRACKING_TYPE_EXTENSION,
      category: INSTALL_STARTED_CATEGORY,
      label: addon.name,
    });
  });

  it('tracks install analytics when installing a search provider', () => {
    const _tracking = { sendEvent: sinon.stub() };
    const _window = createFakeMozWindow();
    const addon = createInternalAddon(createFakeAddon({
      name: 'some-search-provider',
      files: [{ platform: OS_ALL, url: 'https://a.m.o/files/addon.xpi' }],
      type: ADDON_TYPE_OPENSEARCH,
    }));

    const rootNode = render({
      addon, useButton: true, _tracking, _window,
    });

    const installButton = rootNode.find('.InstallButton-button');
    installButton.simulate('click', createFakeEvent());

    sinon.assert.calledWith(_tracking.sendEvent, {
      action: TRACKING_TYPE_EXTENSION,
      category: INSTALL_STARTED_CATEGORY,
      label: addon.name,
    });
  });
});
