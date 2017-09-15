import React from 'react';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';

import createStore from 'amo/store';
import InstallButton, { InstallButtonBase } from 'core/components/InstallButton';
import InstallSwitch from 'core/components/InstallSwitch';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_THEME,
  INCOMPATIBLE_NO_OPENSEARCH,
  INCOMPATIBLE_NOT_FIREFOX,
  OS_ALL,
  UNKNOWN,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import * as themePreview from 'core/themePreview';
import {
  createFakeEvent,
  getFakeI18nInst,
  sampleUserAgentParsed,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import { createFakeAddon, fakeAddon } from 'tests/unit/amo/helpers';
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
    addon: createInternalAddon(fakeAddon),
    getClientCompatibility: () => ({ compatible: true }),
    hasAddonManager: true,
    i18n: getFakeI18nInst(),
    store: createStore().store,
    userAgentInfo: sampleUserAgentParsed,
    ...customProps,
  });

  const render = (props) => shallowUntilTarget(
    <InstallButton {...renderProps(props)} />, InstallButtonBase
  );

  const renderToDom = (props) => findDOMNode(
    renderIntoDocument(<InstallButtonBase {...renderProps(props)} />));

  it('renders InstallSwitch when mozAddonManager is available', () => {
    const i18n = getFakeI18nInst();
    const installURL = 'https://a.m.o/files/addon.xpi';
    const addon = createInternalAddon(createFakeAddon({
      files: [{
        platform: OS_ALL, url: installURL,
      }],
      type: ADDON_TYPE_THEME,
      id: 'foo@personas.mozilla.org',
    }));
    const root = render({
      foo: 'foo', hasAddonManager: true, i18n, addon,
    });
    expect(root.type()).toEqual('div');
    expect(root).toHaveClassName('InstallButton');
    expect(root).toHaveClassName('InstallButton--use-switch');

    const switchComponent = root.childAt(0);
    expect(switchComponent.type()).toEqual(InstallSwitch);

    expect(switchComponent).toHaveClassName('InstallButton-switch');
    expect(switchComponent).toHaveProp('addon', addon);
    expect(switchComponent).toHaveProp('foo', 'foo');
    expect(switchComponent).toHaveProp('hasAddonManager', true);
    expect(switchComponent).toHaveProp('i18n', i18n);
    expect(switchComponent).toHaveProp('installURL', installURL);
  });

  it('renders a theme button when mozAddonManager is not available', () => {
    const addon = createInternalAddon({
      ...fakeAddon, type: ADDON_TYPE_THEME,
    });
    const root = render({ hasAddonManager: false, addon });

    expect(root.type()).toEqual('div');
    expect(root).toHaveClassName('InstallButton');
    expect(root).toHaveClassName('InstallButton--use-button');

    const button = root.childAt(1);

    expect(button.type()).toEqual(Button);
    expect(button.children()).toIncludeText('Install Theme');
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
    const button = root.querySelector('.InstallButton-button');
    Simulate.click(button, { preventDefault });

    sinon.assert.called(preventDefault);
    sinon.assert.called(installTheme);
    sinon.assert.calledWith(installTheme,
      button, { ...addon, status: UNKNOWN });
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

    expect(button.children()).toIncludeText('Add to Firefox');
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
    expect(button.children()).toIncludeText('Add to Firefox');
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
    expect(button.children()).toIncludeText('Add to Firefox');
  });

  it('disables install switch and uses button for OpenSearch plugins', () => {
    const fakeLog = { info: sinon.stub() };
    const fakeWindow = { external: { AddSearchProvider: sinon.stub() } };
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
    expect(installButton.children().text()).toEqual('Add to Firefox');
    installButton.simulate('click', createFakeEvent());

    sinon.assert.calledWith(fakeLog.info, 'Adding OpenSearch Provider');
    sinon.assert.calledWith(
      fakeWindow.external.AddSearchProvider, installURL);
  });
});
