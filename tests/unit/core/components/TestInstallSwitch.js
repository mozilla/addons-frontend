import React from 'react';
import { Simulate, renderIntoDocument } from 'react-dom/test-utils';
import { findDOMNode } from 'react-dom';

import {
  InstallSwitchBase,
} from 'core/components/InstallSwitch';
import {
  DISABLED,
  DISABLING,
  DOWNLOADING,
  ENABLED,
  ENABLING,
  INSTALLED,
  INSTALLING,
  UNINSTALLED,
  UNINSTALLING,
  UNKNOWN,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import { fakeTheme } from 'tests/unit/amo/helpers';
import { fakeI18n } from 'tests/unit/helpers';


describe(__filename, () => {
  function renderButton(props = {}) {
    const renderProps = {
      dispatch: sinon.spy(),
      enable: sinon.spy(),
      install: sinon.spy(),
      installTheme: sinon.spy(),
      uninstall: sinon.spy(),
      i18n: fakeI18n(),
      slug: 'foo',
      name: 'test-addon',
      ...props,
    };

    return renderIntoDocument(
      <InstallSwitchBase {...renderProps} />);
  }

  it('should be disabled if isDisabled status is UNKNOWN', () => {
    const button = renderButton({ status: UNKNOWN });
    const { switchEl } = button;
    expect(switchEl.props.disabled).toEqual(true);
  });

  it('should reflect DISABLED status', () => {
    const button = renderButton({ status: DISABLED });
    const { switchEl } = button;
    expect(switchEl.props.disabled).toEqual(false);
    expect(switchEl.props.label).toContain('test-addon is disabled');
    expect(switchEl.props.label).toContain('Click to enable');
  });

  it('should reflect UNINSTALLED status', () => {
    const button = renderButton({ status: UNINSTALLED });
    const { switchEl } = button;
    expect(switchEl.props.disabled).toEqual(false);
    expect(switchEl.props.label).toContain('test-addon is uninstalled');
    expect(switchEl.props.label).toContain('Click to install');
  });

  it('should reflect INSTALLED status', () => {
    const button = renderButton({ status: INSTALLED });
    const { switchEl } = button;
    expect(switchEl.props.checked).toEqual(true);
    expect(switchEl.props.success).toEqual(true);
  });

  it('should reflect ENABLED status', () => {
    const button = renderButton({ status: ENABLED });
    const { switchEl } = button;
    expect(switchEl.props.checked).toEqual(true);
    expect(switchEl.props.label).toContain('test-addon is installed and enabled');
    expect(switchEl.props.label).toContain('Click to uninstall');
    expect(switchEl.props.success).toEqual(true);
  });

  it('should reflect download downloadProgress', () => {
    const button = renderButton({ status: DOWNLOADING, downloadProgress: 50 });
    const { switchEl } = button;
    expect(switchEl.props.progress).toEqual(50);
    expect(switchEl.props.label).toContain('Downloading test-addon');
  });

  it('should reflect installation', () => {
    const button = renderButton({ status: INSTALLING });
    const { switchEl } = button;
    expect(switchEl.props.checked).toEqual(true);
    expect(switchEl.props.label).toContain('Installing test-addon');
  });

  it('should reflect ENABLING status', () => {
    const button = renderButton({ status: ENABLING });
    const { switchEl } = button;
    expect(switchEl.props.checked).toEqual(true);
  });

  it('should reflect uninstallation', () => {
    const button = renderButton({ status: UNINSTALLING });
    const { switchEl } = button;
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
    expect(root.querySelector('input').getAttribute('id')).toEqual('install-button-foo');
    expect(root.querySelector('label').getAttribute('for')).toEqual('install-button-foo');
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
    const addon = createInternalAddon(fakeTheme);
    const installTheme = sinon.spy();
    const props = {
      addon,
      // Simulate the state mapper spreads.
      ...addon,
      installTheme,
      status: UNINSTALLED,
    };

    const button = renderButton(props);

    const root = findDOMNode(button.switchEl);
    Simulate.click(root);

    sinon.assert.calledOnce(installTheme);
    const themeDataEl = installTheme.firstCall.args[0];
    expect(JSON.parse(themeDataEl.getAttribute('data-browsertheme')))
      .toEqual(addon.themeData);
  });

  it('should call install function on click when uninstalled', () => {
    const guid = '@foo';
    const name = 'hai';
    const install = sinon.spy();
    const i18n = fakeI18n();
    const installURL = 'https://my.url/download';
    const button = renderButton({ guid, i18n, install, installURL, name, status: UNINSTALLED });
    const root = findDOMNode(button.switchEl);
    Simulate.click(root);
    expect(install.calledWith()).toBeTruthy();
  });

  it('should call enable function on click when uninstalled', () => {
    const guid = '@foo';
    const name = 'hai';
    const enable = sinon.spy();
    const i18n = fakeI18n();
    const installURL = 'https://my.url/download';
    const button = renderButton({ guid, i18n, enable, installURL, name, status: DISABLED });
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
    const button = renderButton({ guid, installURL, name, status: INSTALLED, type, uninstall });
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
