import React from 'react';
import {
  Simulate,
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import StateulInstallButton, { InstallButton } from 'disco/containers/InstallButton';
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

  it('should be disabled if isDisabled state is UNKNOWN', () => {
    const button = renderButton({state: UNKNOWN});
    const root = findDOMNode(button);
    const checkbox = root.querySelector('input[type=checkbox]');
    assert.equal(checkbox.hasAttribute('disabled'), true);
    assert.ok(root.classList.contains('unknown'));
  });

  it('should reflect UNINSTALLED state', () => {
    const button = renderButton({state: UNINSTALLED});
    const root = findDOMNode(button);
    const checkbox = root.querySelector('input[type=checkbox]');
    assert.equal(checkbox.hasAttribute('disabled'), false);
    assert.ok(root.classList.contains('uninstalled'));
  });

  it('should reflect INSTALLED state', () => {
    const button = renderButton({state: INSTALLED});
    const root = findDOMNode(button);
    const checkbox = root.querySelector('input[type=checkbox]');
    assert.equal(checkbox.checked, true, 'checked is true');
    assert.ok(root.classList.contains('installed'));
  });

  it('should reflect download progress', () => {
    const button = renderButton({state: DOWNLOADING, progress: 50});
    const root = findDOMNode(button);
    assert.ok(root.classList.contains('downloading'));
    assert.equal(root.getAttribute('data-download-progress'), 50);
  });

  it('should reflect installation', () => {
    const button = renderButton({state: INSTALLING});
    const root = findDOMNode(button);
    assert.ok(root.classList.contains('installing'));
  });

  it('should reflect uninstallation', () => {
    const button = renderButton({state: UNINSTALLING});
    const root = findDOMNode(button);
    assert.ok(root.classList.contains('uninstalling'));
  });

  it('should call click function passed via prop', () => {
    const clickStub = sinon.stub();
    const button = renderButton({state: UNINSTALLED, handleClick: clickStub});
    const root = findDOMNode(button);
    Simulate.click(root);
    assert.ok(clickStub.called);
  });

  it('should throw on bogus state', () => {
    assert.throws(() => {
      renderButton({state: 'BOGUS'});
    }, Error, 'Invalid add-on state');
  });

  describe('with redux', () => {
    const installations = {
      'installed-addon': {
        slug: 'installed-addon',
        guid: 'installed-addon@me.com',
        url: 'https://download.xpi/installed-addon.xpi',
        progress: 0,
        state: INSTALLED,
      },
    };
    const store = createStore((s) => s, {installations});

    function renderStatefulInstallButton(props) {
      return findRenderedComponentWithType(renderIntoDocument(
        <Provider store={store}>
          <StateulInstallButton { ...props } />
        </Provider>
      ), StateulInstallButton);
    }

    it('pulls the installation from the state', () => {
      const button = renderStatefulInstallButton({slug: 'installed-addon'});
      const root = findDOMNode(button);
      const checkbox = root.querySelector('input[type=checkbox]');
      assert.equal(checkbox.checked, true, 'checked is true');
      assert.ok(root.classList.contains('installed'));
    });

    it('is unknown if not found', () => {
      const button = renderStatefulInstallButton({slug: 'unknown-addon'});
      const root = findDOMNode(button);
      const checkbox = root.querySelector('input[type=checkbox]');
      assert.equal(checkbox.hasAttribute('disabled'), true);
      assert.ok(root.classList.contains('unknown'));
    });
  });
});
