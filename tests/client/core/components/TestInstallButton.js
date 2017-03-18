import React from 'react';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';

import { InstallButtonBase } from 'core/components/InstallButton';
import InstallSwitch from 'core/components/InstallSwitch';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME, UNKNOWN } from 'core/constants';
import * as themePreview from 'core/themePreview';
import { getFakeI18nInst, shallowRender } from 'tests/client/helpers';
import Button from 'ui/components/Button';

describe('<InstallButton />', () => {
  it('renders InstallSwitch when mozAddonManager is available', () => {
    const i18n = getFakeI18nInst();
    const addon = { type: ADDON_TYPE_THEME, id: 'foo@personas.mozilla.org' };
    const root = shallowRender(
      <InstallButtonBase foo="foo" addon={addon} hasAddonManager i18n={i18n} />);
    assert.equal(root.type, 'div');
    assert.equal(root.props.className, 'InstallButton InstallButton--use-switch');
    const switchComponent = root.props.children[0];
    assert.equal(switchComponent.type, InstallSwitch);
    assert.deepEqual(switchComponent.props, {
      addon,
      className: 'InstallButton-switch',
      foo: 'foo',
      hasAddonManager: true,
      i18n,
    });
  });

  it('renders a theme button when mozAddonManager is not available', () => {
    const i18n = getFakeI18nInst();
    const addon = { type: ADDON_TYPE_THEME, id: 'foo@personas.mozilla.org' };
    const root = shallowRender(
      <InstallButtonBase
        addon={addon} foo="foo" hasAddonManager={false} i18n={i18n} />);
    assert.equal(root.type, 'div');
    assert.equal(root.props.className, 'InstallButton InstallButton--use-button');
    const buttonComponent = root.props.children[1];
    assert.equal(buttonComponent.type, Button);
    assert.equal(buttonComponent.props.children, 'Install Theme');
    assert.equal(
        buttonComponent.props['data-browsertheme'],
        JSON.stringify(themePreview.getThemeData(addon)));
  });


  it('calls installTheme when clicked', () => {
    const installTheme = sinon.spy();
    const i18n = getFakeI18nInst();
    const addon = { type: ADDON_TYPE_THEME, id: 'foo@personas.mozilla.org' };
    const root = findDOMNode(renderIntoDocument(
      <InstallButtonBase
        addon={addon} foo="foo" hasAddonManager={false} i18n={i18n}
        status={UNKNOWN} installTheme={installTheme} />));
    const preventDefault = sinon.spy();
    const buttonComponent = root.querySelector('.InstallButton-button');
    Simulate.click(buttonComponent, { preventDefault });
    assert.ok(preventDefault.called);
    assert.ok(installTheme.called);
    assert.ok(installTheme.calledWith(buttonComponent, { ...addon, status: UNKNOWN }));
  });

  it('renders an add-on button when mozAddonManager is not available', () => {
    const i18n = getFakeI18nInst();
    const addon = { type: ADDON_TYPE_EXTENSION, installURL: 'https://addons.mozilla.org/download' };
    const root = shallowRender(
      <InstallButtonBase addon={addon} foo="foo" hasAddonManager={false} i18n={i18n} />);
    assert.equal(root.type, 'div');
    assert.equal(root.props.className, 'InstallButton InstallButton--use-button');
    const buttonComponent = root.props.children[1];
    assert.equal(buttonComponent.type, Button);
    assert.deepEqual(buttonComponent.props, {
      appearance: undefined,
      children: 'Add to Firefox',
      className: 'InstallButton-button',
      to: 'https://addons.mozilla.org/download',
      size: 'normal',
    });
  });
});
