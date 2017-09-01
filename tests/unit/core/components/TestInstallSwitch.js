import React from 'react';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';

import { InstallSwitchBase } from 'core/components/InstallSwitch';
import {
  DISABLED,
  DISABLING,
  DOWNLOADING,
  ENABLED,
  ENABLING,
  INSTALLED,
  INSTALLING,
  ADDON_TYPE_THEME,
  UNINSTALLED,
  UNINSTALLING,
  UNKNOWN,
} from 'core/constants';
import * as themePreview from 'core/themePreview';
import { getFakeI18nInst } from 'tests/unit/helpers';

describe('<InstallSwitch />', () => {
  function renderButton(props = {}) {
    const renderProps = {
      dispatch: sinon.spy(),
      enable: sinon.spy(),
      install: sinon.spy(),
      installTheme: sinon.spy(),
      uninstall: sinon.spy(),
      i18n: getFakeI18nInst(),
      slug: 'foo',
      name: 'test-addon',
      ...props,
    };

    return renderIntoDocument(<InstallSwitchBase {...renderProps} />);
  }

  it('should be disabled if isDisabled status is UNKNOWN', () => {
    const button = renderButton({ status: UNKNOWN });
    const switchEl = button.switchEl;
    expect(switchEl.props.disabled).toEqual(true);
  });

  it('should reflect DISABLED status', () => {
    const button = renderButton({ status: DISABLED });
    const switchEl = button.switchEl;
    expect(switchEl.props.disabled).toEqual(false);
    expect(switchEl.props.label).toContain('test-addon is disabled');
    expect(switchEl.props.label).toContain('Click to enable');
  });

  it('should reflect UNINSTALLED status', () => {
    const button = renderButton({ status: UNINSTALLED });
    const switchEl = button.switchEl;
    expect(switchEl.props.disabled).toEqual(false);
    expect(switchEl.props.label).toContain('test-addon is uninstalled');
    expect(switchEl.props.label).toContain('Click to install');
  });

  it('should reflect INSTALLED status', () => {
    const button = renderButton({ status: INSTALLED });
    const switchEl = button.switchEl;
    expect(switchEl.props.checked).toEqual(true);
    expect(switchEl.props.success).toEqual(true);
  });

  it('should reflect ENABLED status', () => {
    const button = renderButton({ status: ENABLED });
    const switchEl = button.switchEl;
    expect(switchEl.props.checked).toEqual(true);
    expect(switchEl.props.label).toContain(
      'test-addon is installed and enabled'
    );
    expect(switchEl.props.label).toContain('Click to uninstall');
    expect(switchEl.props.success).toEqual(true);
  });

  it('should reflect download downloadProgress', () => {
    const button = renderButton({ status: DOWNLOADING, downloadProgress: 50 });
    const switchEl = button.switchEl;
    expect(switchEl.props.progress).toEqual(50);
    expect(switchEl.props.label).toContain('Downloading test-addon');
  });

  it('should reflect installation', () => {
    const button = renderButton({ status: INSTALLING });
    const switchEl = button.switchEl;
    expect(switchEl.props.checked).toEqual(true);
    expect(switchEl.props.label).toContain('Installing test-addon');
  });

  it('should reflect ENABLING status', () => {
    const button = renderButton({ status: ENABLING });
    const switchEl = button.switchEl;
    expect(switchEl.props.checked).toEqual(true);
  });

  it('should reflect uninstallation', () => {
    const button = renderButton({ status: UNINSTALLING });
    const switchEl = button.switchEl;
    expect(switchEl.props.label).toContain('Uninstalling test-addon');
  });

  it('should not call anything on click when neither installed or uninstalled', () => {
    const install = sinon.stub();
    const uninstall = sinon.stub();
    const button = renderButton({ status: DOWNLOADING, install, uninstall });
    const root = findDOMNode(button);
    Simulate.click(root);
    expect(!install.called).toBeTruthy();
    expect(!uninstall.called).toBeTruthy();
  });

  it('should associate the label and input with id and for attributes', () => {
    const button = renderButton({ status: UNINSTALLED, slug: 'foo' });
    const root = findDOMNode(button);
    expect(root.querySelector('input').getAttribute('id')).toEqual(
      'install-button-foo'
    );
    expect(root.querySelector('label').getAttribute('for')).toEqual(
      'install-button-foo'
    );
  });

  it('should throw on bogus status', () => {
    expect(() => {
      renderButton({ status: 'BOGUS' });
    }).toThrowError('Invalid add-on status');
  });

  it('should not throw for ENABLING', () => {
    renderButton({ status: ENABLING });
  });

  it('should not throw for DISABLING', () => {
    renderButton({ status: DISABLING });
  });

  it('should call installTheme function on click when uninstalled theme', () => {
    const installTheme = sinon.spy();
    const browsertheme = { theme: 'data' };
    sinon.stub(themePreview, 'getThemeData').returns(browsertheme);
    const guid = 'test-guid';
    const name = 'hai';
    const button = renderButton({
      installTheme,
      type: ADDON_TYPE_THEME,
      guid,
      name,
      status: UNINSTALLED,
    });
    const root = findDOMNode(button.switchEl);
    Simulate.click(root);
    expect(installTheme.calledOnce).toBeTruthy();
    const themeDataEl = installTheme.args[0][0];
    expect(themeDataEl.getAttribute('data-browsertheme')).toEqual(
      JSON.stringify(browsertheme)
    );
  });

  it('should call install function on click when uninstalled', () => {
    const guid = '@foo';
    const name = 'hai';
    const install = sinon.spy();
    const i18n = getFakeI18nInst();
    const installURL = 'https://my.url/download';
    const button = renderButton({
      guid,
      i18n,
      install,
      installURL,
      name,
      status: UNINSTALLED,
    });
    const root = findDOMNode(button.switchEl);
    Simulate.click(root);
    expect(install.calledWith()).toBeTruthy();
  });

  it('should call enable function on click when uninstalled', () => {
    const guid = '@foo';
    const name = 'hai';
    const enable = sinon.spy();
    const i18n = getFakeI18nInst();
    const installURL = 'https://my.url/download';
    const button = renderButton({
      guid,
      i18n,
      enable,
      installURL,
      name,
      status: DISABLED,
    });
    const root = findDOMNode(button.switchEl);
    Simulate.click(root);
    expect(enable.calledWith()).toBeTruthy();
  });

  it('should call uninstall function on click when installed', () => {
    const guid = '@foo';
    const installURL = 'https://my.url/download';
    const name = 'hai';
    const type = 'whatevs';
    const uninstall = sinon.spy();
    const button = renderButton({
      guid,
      installURL,
      name,
      status: INSTALLED,
      type,
      uninstall,
    });
    const root = findDOMNode(button.switchEl);
    Simulate.click(root);
    expect(uninstall.calledWith({ guid, installURL, name, type })).toBeTruthy();
  });

  it('returns early when button is clicked on disabled switch', () => {
    const guid = '@foo';
    const installURL = 'https://my.url/download';
    const name = 'hai';
    const type = 'whatevs';
    const enable = sinon.stub();
    const install = sinon.stub();
    const installTheme = sinon.stub();
    const uninstall = sinon.spy();

    const button = renderButton({
      disabled: true,
      enable,
      guid,
      installTheme,
      installURL,
      name,
      status: INSTALLED,
      type,
      uninstall,
    });
    const root = findDOMNode(button.switchEl);
    Simulate.click(root);

    expect(enable.notCalled).toBeTruthy();
    expect(install.notCalled).toBeTruthy();
    expect(installTheme.notCalled).toBeTruthy();
    expect(uninstall.notCalled).toBeTruthy();
  });
});
