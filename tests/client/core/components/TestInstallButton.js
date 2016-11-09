import React from 'react';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';

import {
  InstallButtonBase,
} from 'core/components/InstallButton';
import {
  DISABLED,
  DISABLING,
  DOWNLOADING,
  ENABLED,
  ENABLING,
  INSTALLED,
  INSTALLING,
  THEME_TYPE,
  UNINSTALLED,
  UNINSTALLING,
  UNKNOWN,
} from 'core/constants';
import { getFakeI18nInst } from 'tests/client/helpers';


describe('<InstallButton />', () => {
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

    return renderIntoDocument(
      <InstallButtonBase {...renderProps} />);
  }

  it('should be disabled if isDisabled status is UNKNOWN', () => {
    const button = renderButton({ status: UNKNOWN });
    const switchEl = button.switchEl;
    assert.equal(switchEl.props.disabled, true);
  });

  it('should reflect DISABLED status', () => {
    const button = renderButton({ status: DISABLED });
    const switchEl = button.switchEl;
    assert.equal(switchEl.props.disabled, false);
    assert.include(switchEl.props.label, 'test-addon is disabled');
    assert.include(switchEl.props.label, 'Click to enable');
  });

  it('should reflect UNINSTALLED status', () => {
    const button = renderButton({ status: UNINSTALLED });
    const switchEl = button.switchEl;
    assert.equal(switchEl.props.disabled, false);
    assert.include(switchEl.props.label, 'test-addon is uninstalled');
    assert.include(switchEl.props.label, 'Click to install');
  });

  it('should reflect INSTALLED status', () => {
    const button = renderButton({ status: INSTALLED });
    const switchEl = button.switchEl;
    assert.equal(switchEl.props.checked, true);
  });

  it('should reflect ENABLED status', () => {
    const button = renderButton({ status: ENABLED });
    const switchEl = button.switchEl;
    assert.equal(switchEl.props.checked, true);
    assert.include(switchEl.props.label, 'test-addon is installed and enabled');
    assert.include(switchEl.props.label, 'Click to uninstall');
  });

  it('should reflect download downloadProgress', () => {
    const button = renderButton({ status: DOWNLOADING, downloadProgress: 50 });
    const switchEl = button.switchEl;
    assert.equal(switchEl.props.progress, 50);
    assert.include(switchEl.props.label, 'Downloading test-addon');
  });

  it('should reflect installation', () => {
    const button = renderButton({ status: INSTALLING });
    const switchEl = button.switchEl;
    assert.equal(switchEl.props.checked, true);
    assert.include(switchEl.props.label, 'Installing test-addon');
  });

  it('should reflect ENABLING status', () => {
    const button = renderButton({ status: ENABLING });
    const switchEl = button.switchEl;
    assert.equal(switchEl.props.checked, true);
  });

  it('should reflect uninstallation', () => {
    const button = renderButton({ status: UNINSTALLING });
    const switchEl = button.switchEl;
    assert.include(switchEl.props.label, 'Uninstalling test-addon');
  });

  it('should not call anything on click when neither installed or uninstalled', () => {
    const install = sinon.stub();
    const uninstall = sinon.stub();
    const button = renderButton({ status: DOWNLOADING, install, uninstall });
    const root = findDOMNode(button);
    Simulate.click(root);
    assert.ok(!install.called);
    assert.ok(!uninstall.called);
  });

  it('should associate the label and input with id and for attributes', () => {
    const button = renderButton({ status: UNINSTALLED, slug: 'foo' });
    const root = findDOMNode(button);
    assert.equal(root.querySelector('input').getAttribute('id'),
                'install-button-foo', 'id is set');
    assert.equal(root.querySelector('label').getAttribute('for'),
                'install-button-foo', 'for attribute matches id');
  });

  it('should throw on bogus status', () => {
    assert.throws(() => {
      renderButton({ status: 'BOGUS' });
    }, Error, 'Invalid add-on status');
  });

  it('should not throw for ENABLING', () => {
    renderButton({ status: ENABLING });
  });

  it('should not throw for DISABLING', () => {
    renderButton({ status: DISABLING });
  });

  it('should call installTheme function on click when uninstalled theme', () => {
    const installTheme = sinon.spy();
    const guid = 'test-guid';
    const name = 'hai';
    const button = renderButton({
      installTheme,
      type: THEME_TYPE,
      guid,
      name,
      status: UNINSTALLED,
    });
    const themeData = button.themeData;
    const root = findDOMNode(button);
    Simulate.click(root);
    assert(installTheme.calledWith(themeData, guid, name));
  });

  it('should call install function on click when uninstalled', () => {
    const guid = '@foo';
    const name = 'hai';
    const install = sinon.spy();
    const i18n = getFakeI18nInst();
    const installURL = 'https://my.url/download';
    const button = renderButton({ guid, i18n, install, installURL, name, status: UNINSTALLED });
    const root = findDOMNode(button);
    Simulate.click(root);
    assert(install.calledWith());
  });

  it('should call enable function on click when uninstalled', () => {
    const guid = '@foo';
    const name = 'hai';
    const enable = sinon.spy();
    const i18n = getFakeI18nInst();
    const installURL = 'https://my.url/download';
    const button = renderButton({ guid, i18n, enable, installURL, name, status: DISABLED });
    const root = findDOMNode(button);
    Simulate.click(root);
    assert(enable.calledWith());
  });

  it('should call uninstall function on click when installed', () => {
    const guid = '@foo';
    const installURL = 'https://my.url/download';
    const name = 'hai';
    const type = 'whatevs';
    const uninstall = sinon.spy();
    const button = renderButton({ guid, installURL, name, status: INSTALLED, type, uninstall });
    const root = findDOMNode(button);
    Simulate.click(root);
    assert(uninstall.calledWith({ guid, installURL, name, type }));
  });
});
