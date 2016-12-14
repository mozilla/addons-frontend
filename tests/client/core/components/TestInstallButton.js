import React from 'react';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';

import { InstallButtonBase } from 'core/components/InstallButton';
import InstallSwitch from 'core/components/InstallSwitch';
import { EXTENSION_TYPE, THEME_TYPE, UNKNOWN } from 'core/constants';
import * as themePreview from 'core/themePreview';
import { getFakeI18nInst, shallowRender } from 'tests/client/helpers';
import Button from 'ui/components/Button';

describe('<InstallButton />', () => {
  it('renders InstallSwitch when mozAddonManager is available', () => {
    const i18n = getFakeI18nInst();
    const root = shallowRender(<InstallButtonBase foo="foo" hasAddonManager i18n={i18n} />);
    assert.equal(root.type, InstallSwitch);
    assert.deepEqual(root.props, {
      foo: 'foo',
      hasAddonManager: true,
      i18n,
    });
  });

  it('renders a theme button when mozAddonManager is not available', () => {
    const i18n = getFakeI18nInst();
    const addon = { type: THEME_TYPE, id: 'foo@personas.mozilla.org' };
    const root = shallowRender(
      <InstallButtonBase
        addon={addon} foo="foo" hasAddonManager={false} i18n={i18n} />);
    assert.equal(root.type, Button);
    assert.equal(root.props.children, 'Install Theme');
    assert.equal(root.props['data-browsertheme'], JSON.stringify(themePreview.getThemeData(addon)));
  });


  it('calls installTheme when clicked', () => {
    const installTheme = sinon.spy();
    const i18n = getFakeI18nInst();
    const addon = { type: THEME_TYPE, id: 'foo@personas.mozilla.org' };
    const root = findDOMNode(renderIntoDocument(
      <InstallButtonBase
        addon={addon} foo="foo" hasAddonManager={false} i18n={i18n}
        status={UNKNOWN} installTheme={installTheme} />));
    const preventDefault = sinon.spy();
    Simulate.click(root, { preventDefault });
    assert.ok(preventDefault.called);
    assert.ok(installTheme.called);
    assert.ok(installTheme.calledWith(root, { ...addon, status: UNKNOWN }));
  });

  it('renders an add-on button when mozAddonManager is not available', () => {
    const i18n = getFakeI18nInst();
    const addon = { type: EXTENSION_TYPE, installURL: 'https://addons.mozilla.org/download' };
    const root = shallowRender(
      <InstallButtonBase addon={addon} foo="foo" hasAddonManager={false} i18n={i18n} />);
    assert.equal(root.type, Button);
    assert.deepEqual(root.props, {
      children: 'Add to Firefox',
      href: 'https://addons.mozilla.org/download',
    });
  });
});
