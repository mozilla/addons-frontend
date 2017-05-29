import React from 'react';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';

import { InstallButtonBase } from 'core/components/InstallButton';
import InstallSwitch from 'core/components/InstallSwitch';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_THEME,
  INCOMPATIBLE_NO_OPENSEARCH,
  INCOMPATIBLE_NOT_FIREFOX,
  UNKNOWN,
} from 'core/constants';
import * as themePreview from 'core/themePreview';
import { getFakeI18nInst, shallowRender } from 'tests/unit/helpers';
import { fakeAddon } from 'tests/unit/amo/helpers';
import Button from 'ui/components/Button';


describe('<InstallButton />', () => {
  const getClientCompatibilityFalse = () => ({
    compatible: false,
    reason: INCOMPATIBLE_NOT_FIREFOX,
  });
  const getClientCompatibilityFalseOpenSearch = () => ({
    compatible: false,
    reason: INCOMPATIBLE_NO_OPENSEARCH,
  });

  const renderProps = (customProps = {}) => ({
    addon: fakeAddon,
    getClientCompatibility: () => ({ compatible: true }),
    hasAddonManager: true,
    i18n: getFakeI18nInst(),
    ...customProps,
  });

  const render = (props) =>
    shallowRender(<InstallButtonBase {...renderProps(props)} />);

  const renderToDom = (props) => findDOMNode(
    renderIntoDocument(<InstallButtonBase {...renderProps(props)} />));

  it('renders InstallSwitch when mozAddonManager is available', () => {
    const i18n = getFakeI18nInst();
    const addon = {
      ...fakeAddon,
      type: ADDON_TYPE_THEME,
      id: 'foo@personas.mozilla.org',
    };
    const root = render({ foo: 'foo', hasAddonManager: true, i18n, addon });
    expect(root.type).toEqual('div');
    expect(root.props.className).toEqual('InstallButton InstallButton--use-switch');
    const switchComponent = root.props.children[0];
    expect(switchComponent.type).toEqual(InstallSwitch);

    const props = switchComponent.props;
    expect(props.addon).toEqual(addon);
    expect(props.className).toEqual('InstallButton-switch');
    expect(props.foo).toEqual('foo');
    expect(props.hasAddonManager).toBe(true);
    expect(props.i18n).toEqual(i18n);
  });

  it('renders a theme button when mozAddonManager is not available', () => {
    const addon = { ...fakeAddon, type: ADDON_TYPE_THEME };
    const root = render({ hasAddonManager: false, addon });
    expect(root.type).toEqual('div');
    expect(root.props.className).toEqual('InstallButton InstallButton--use-button');
    const buttonComponent = root.props.children[1];
    expect(buttonComponent.type).toEqual(Button);
    expect(buttonComponent.props.children).toEqual('Install Theme');
    expect(buttonComponent.props['data-browsertheme']).toEqual(JSON.stringify(themePreview.getThemeData(addon)));
  });

  it('calls installTheme when clicked', () => {
    const addon = { ...fakeAddon, type: ADDON_TYPE_THEME };
    const installTheme = sinon.spy();
    const root = renderToDom({ addon, installTheme, status: UNKNOWN });

    const preventDefault = sinon.spy();
    const buttonComponent = root.querySelector('.InstallButton-button');
    Simulate.click(buttonComponent, { preventDefault });

    expect(preventDefault.called).toBeTruthy();
    expect(installTheme.called).toBeTruthy();
    expect(installTheme.firstCall.args).toEqual([
      buttonComponent, { ...addon, status: UNKNOWN },
    ]);
  });

  it('renders an add-on button when mozAddonManager is not available', () => {
    const installURL = 'https://addons.mozilla.org/download';
    const root = render({
      addon: {
        ...fakeAddon,
        type: ADDON_TYPE_EXTENSION,
        installURL,
      },
      hasAddonManager: false,
    });

    expect(root.type).toEqual('div');
    expect(root.props.className).toContain(
      'InstallButton InstallButton--use-button');
    const buttonComponent = root.props.children[1];
    expect(buttonComponent.type).toEqual(Button);

    const props = buttonComponent.props;
    expect(props.children).toEqual('Add to Firefox');
    expect(props.className).toContain('InstallButton-button');
    expect(props.className).not.toContain('Button--small');
    expect(props.href).toEqual(installURL);
  });

  it('disables add-on install when client does not support addons', () => {
    const installURL = 'https://addons.mozilla.org/download';
    const root = render({
      addon: {
        ...fakeAddon,
        type: ADDON_TYPE_EXTENSION,
        installURL,
      },
      getClientCompatibility: getClientCompatibilityFalse,
    });

    expect(root.type).toEqual('div');
    const buttonComponent = root.props.children[1];
    expect(buttonComponent.type).toEqual(Button);
    expect(buttonComponent.props.className).toContain(
      'InstallButton-button--disabled');
    expect(buttonComponent.props.href).toBe(installURL);

    expect(typeof buttonComponent.props.onClick).toBe('function');
    const event = {
      preventDefault: sinon.stub(),
      stopPropagation: sinon.stub(),
    };
    // A return value of false will prevent the anchor tag from firing.
    expect(buttonComponent.props.onClick(event)).toBe(false);
    expect(event.preventDefault.called).toBeTruthy();
    expect(event.stopPropagation.called).toBeTruthy();
  });

  it('disables theme install when client does not support addons', () => {
    const root = render({
      addon: {
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
      },
      getClientCompatibility: getClientCompatibilityFalse,
    });

    expect(root.type).toEqual('div');
    const buttonComponent = root.props.children[1];
    expect(buttonComponent.type).toEqual(Button);
    expect(buttonComponent.props.disabled).toBe(true);
  });

  it('renders a button for OpenSearch regardless of mozAddonManager', () => {
    const root = render({
      addon: {
        ...fakeAddon,
        hasAddonManager: true,
        type: ADDON_TYPE_OPENSEARCH,
      },
    });

    expect(root.type).toEqual('div');
    const buttonComponent = root.props.children[1];
    expect(buttonComponent.type).toEqual(Button);
    expect(buttonComponent.props.className).toContain('Button--action');
    expect(buttonComponent.props.className).toContain('InstallButton-button');
    expect(buttonComponent.props.children).toEqual('Add to Firefox');
  });

  it('disables the OpenSearch button if not compatible', () => {
    const root = render({
      addon: { ...fakeAddon, type: ADDON_TYPE_OPENSEARCH },
      getClientCompatibility: getClientCompatibilityFalseOpenSearch,
    });

    expect(root.type).toEqual('div');
    const buttonComponent = root.props.children[1];
    expect(buttonComponent.type).toEqual(Button);
    expect(buttonComponent.props.className).toContain('InstallButton-button--disabled');
    expect(buttonComponent.props.children).toEqual('Add to Firefox');
  });

  it('disables install switch and uses button for OpenSearch plugins', () => {
    const fakeLog = { info: sinon.stub() };
    const fakeWindow = { external: { AddSearchProvider: sinon.stub() } };
    const rootNode = renderToDom({
      addon: { ...fakeAddon, type: ADDON_TYPE_OPENSEARCH },
      _log: fakeLog,
      _window: fakeWindow,
    });
    const installButton = rootNode.querySelector('.InstallButton-button');
    expect(installButton.textContent).toEqual('Add to Firefox');

    Simulate.click(installButton);

    expect(fakeLog.info.firstCall.args[0]).toEqual('Adding OpenSearch Provider');
    expect(fakeWindow.external.AddSearchProvider.firstCall.args[0]).toEqual(fakeAddon.installURL);
  });
});
