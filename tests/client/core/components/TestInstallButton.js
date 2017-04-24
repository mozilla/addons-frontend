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
import { getFakeI18nInst, shallowRender } from 'tests/client/helpers';
import { fakeAddon } from 'tests/client/amo/helpers';
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
    assert.equal(root.type, 'div');
    assert.equal(root.props.className, 'InstallButton InstallButton--use-switch');
    const switchComponent = root.props.children[0];
    assert.equal(switchComponent.type, InstallSwitch);

    const props = switchComponent.props;
    assert.deepEqual(props.addon, addon);
    assert.equal(props.className, 'InstallButton-switch');
    assert.equal(props.foo, 'foo');
    assert.strictEqual(props.hasAddonManager, true);
    assert.deepEqual(props.i18n, i18n);
  });

  it('renders a theme button when mozAddonManager is not available', () => {
    const addon = { ...fakeAddon, type: ADDON_TYPE_THEME };
    const root = render({ hasAddonManager: false, addon });
    assert.equal(root.type, 'div');
    assert.equal(
      root.props.className, 'InstallButton InstallButton--use-button');
    const buttonComponent = root.props.children[1];
    assert.equal(buttonComponent.type, Button);
    assert.equal(buttonComponent.props.children, 'Install Theme');
    assert.equal(
      buttonComponent.props['data-browsertheme'],
      JSON.stringify(themePreview.getThemeData(addon)));
  });

  it('calls installTheme when clicked', () => {
    const addon = { ...fakeAddon, type: ADDON_TYPE_THEME };
    const installTheme = sinon.spy();
    const root = renderToDom({ addon, installTheme, status: UNKNOWN });

    const preventDefault = sinon.spy();
    const buttonComponent = root.querySelector('.InstallButton-button');
    Simulate.click(buttonComponent, { preventDefault });

    assert.ok(preventDefault.called);
    assert.ok(installTheme.called);
    assert.deepEqual(installTheme.firstCall.args, [
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

    assert.equal(root.type, 'div');
    assert.equal(root.props.className, 'InstallButton InstallButton--use-button');
    const buttonComponent = root.props.children[1];
    assert.equal(buttonComponent.type, Button);

    const props = buttonComponent.props;
    assert.equal(props.children, 'Add to Firefox');
    assert.equal(props.className, 'InstallButton-button');
    assert.equal(props.to, installURL);
    assert.equal(props.size, 'normal');
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

    assert.equal(root.type, 'div');
    const buttonComponent = root.props.children[1];
    assert.equal(buttonComponent.type, Button);
    assert.include(
      buttonComponent.props.className, 'InstallButton-button--disabled');
    assert.strictEqual(buttonComponent.props.to, installURL);

    assert.isFunction(buttonComponent.props.onClick);
    const event = {
      preventDefault: sinon.stub(),
      stopPropagation: sinon.stub(),
    };
    // A return value of false will prevent the anchor tag from firing.
    assert.strictEqual(buttonComponent.props.onClick(event), false);
    assert.ok(
      event.preventDefault.called, 'event.preventDefault() was not called');
    assert.ok(
      event.stopPropagation.called, 'event.stopPropagation() was not called');
  });

  it('disables theme install when client does not support addons', () => {
    const root = render({
      addon: {
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
      },
      getClientCompatibility: getClientCompatibilityFalse,
    });

    assert.equal(root.type, 'div');
    const buttonComponent = root.props.children[1];
    assert.equal(buttonComponent.type, Button);
    assert.strictEqual(buttonComponent.props.disabled, true);
  });

  it('renders a button for OpenSearch regardless of mozAddonManager', () => {
    const root = render({
      addon: {
        ...fakeAddon,
        hasAddonManager: true,
        type: ADDON_TYPE_OPENSEARCH,
      },
    });

    assert.equal(root.type, 'div');
    const buttonComponent = root.props.children[1];
    assert.equal(buttonComponent.type, Button);
    assert.include(buttonComponent.props.className,
      'Button InstallButton-button');
    assert.equal(buttonComponent.props.children, 'Add to Firefox');
  });

  it('disables the OpenSearch button if not compatible', () => {
    const root = render({
      addon: { ...fakeAddon, type: ADDON_TYPE_OPENSEARCH },
      getClientCompatibility: getClientCompatibilityFalseOpenSearch,
    });

    assert.equal(root.type, 'div');
    const buttonComponent = root.props.children[1];
    assert.equal(buttonComponent.type, Button);
    assert.include(buttonComponent.props.className,
      'InstallButton-button--disabled');
    assert.equal(buttonComponent.props.children, 'Add to Firefox');
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
    assert.equal(installButton.textContent, 'Add to Firefox');

    Simulate.click(installButton);

    assert.equal(fakeLog.info.firstCall.args[0], 'Adding OpenSearch Provider');
    assert.equal(fakeWindow.external.AddSearchProvider.firstCall.args[0],
      fakeAddon.installURL);
  });
});
