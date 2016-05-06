import React from 'react';
import { findDOMNode } from 'react-dom';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';

import InstallButton from 'disco/components/InstallButton';
import {
  DOWNLOADING,
  INSTALLED,
  INSTALLING,
  UNINSTALLED,
  UNINSTALLING,
  UNKNOWN,
} from 'disco/constants';


describe('<InstallButton />', () => {
  function renderButton(props) {
    return renderIntoDocument(<InstallButton { ...props } />);
  }


  it('should be disabled if isDisabled addonState is UNKNOWN', () => {
    const button = renderButton({addonState: UNKNOWN});
    const root = findDOMNode(button);
    const checkbox = root.querySelector('input[type=checkbox]');
    assert.equal(checkbox.hasAttribute('disabled'), true);
    assert.ok(root.classList.contains('unknown'));
  });

  it('should reflect UNINSTALLED state', () => {
    const button = renderButton({addonState: UNINSTALLED});
    const root = findDOMNode(button);
    const checkbox = root.querySelector('input[type=checkbox]');
    assert.equal(checkbox.hasAttribute('disabled'), false);
    assert.ok(root.classList.contains('uninstalled'));
  });

  it('should reflect INSTALLED state', () => {
    const button = renderButton({addonState: INSTALLED});
    const root = findDOMNode(button);
    const checkbox = root.querySelector('input[type=checkbox]');
    assert.equal(checkbox.checked, true, 'checked is true');
    assert.ok(root.classList.contains('installed'));
  });

  it('should reflect download progress', () => {
    const button = renderButton({addonState: DOWNLOADING, downloadProgressPercent: 50});
    const root = findDOMNode(button);
    assert.ok(root.classList.contains('downloading'));
    assert.equal(root.getAttribute('data-download-progress'), 50);
  });

  it('should reflect installation', () => {
    const button = renderButton({addonState: INSTALLING});
    const root = findDOMNode(button);
    assert.ok(root.classList.contains('installing'));
  });

  it('should reflect uninstallation', () => {
    const button = renderButton({addonState: UNINSTALLING});
    const root = findDOMNode(button);
    assert.ok(root.classList.contains('uninstalling'));
  });

  it('should call click function passed via prop', () => {
    const clickStub = sinon.stub();
    const button = renderButton({addonState: UNINSTALLED, handleClick: clickStub});
    const root = findDOMNode(button);
    Simulate.click(root);
    assert.ok(clickStub.called);
  });

  it('should throw on bogus state', () => {
    assert.throws(() => {
      renderButton({addonState: 'BOGUS'});
    }, Error, 'Invalid addonState');
  });
});
