import React from 'react';
import {
  Simulate,
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import StateulInstallButton, {
  InstallButton,
  mapDispatchToProps,
  mapStateToProps,
} from 'disco/containers/InstallButton';
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

  it('should be disabled if isDisabled status is UNKNOWN', () => {
    const button = renderButton({status: UNKNOWN});
    const root = findDOMNode(button);
    const checkbox = root.querySelector('input[type=checkbox]');
    assert.equal(checkbox.hasAttribute('disabled'), true);
    assert.ok(root.classList.contains('unknown'));
  });

  it('should reflect UNINSTALLED status', () => {
    const button = renderButton({status: UNINSTALLED});
    const root = findDOMNode(button);
    const checkbox = root.querySelector('input[type=checkbox]');
    assert.equal(checkbox.hasAttribute('disabled'), false);
    assert.ok(root.classList.contains('uninstalled'));
  });

  it('should reflect INSTALLED status', () => {
    const button = renderButton({status: INSTALLED});
    const root = findDOMNode(button);
    const checkbox = root.querySelector('input[type=checkbox]');
    assert.equal(checkbox.checked, true, 'checked is true');
    assert.ok(root.classList.contains('installed'));
  });

  it('should reflect download downloadProgress', () => {
    const button = renderButton({status: DOWNLOADING, downloadProgress: 50});
    const root = findDOMNode(button);
    assert.ok(root.classList.contains('downloading'));
    assert.equal(root.getAttribute('data-download-progress'), 50);
  });

  it('should reflect installation', () => {
    const button = renderButton({status: INSTALLING});
    const root = findDOMNode(button);
    assert.ok(root.classList.contains('installing'));
  });

  it('should reflect uninstallation', () => {
    const button = renderButton({status: UNINSTALLING});
    const root = findDOMNode(button);
    assert.ok(root.classList.contains('uninstalling'));
  });

  it('should call install function on click when uninstalled', () => {
    const clickStub = sinon.stub();
    const button = renderButton({status: UNINSTALLED, install: clickStub});
    const root = findDOMNode(button);
    Simulate.click(root);
    assert.ok(clickStub.called);
  });

  it('should call uninstall function on click when installed', () => {
    const clickStub = sinon.stub();
    const button = renderButton({status: INSTALLED, uninstall: clickStub});
    const root = findDOMNode(button);
    Simulate.click(root);
    assert.ok(clickStub.called);
  });

  it('should not call anything on click when neither installed or uninstalled', () => {
    const install = sinon.stub();
    const uninstall = sinon.stub();
    const button = renderButton({status: DOWNLOADING, install, uninstall});
    const root = findDOMNode(button);
    Simulate.click(root);
    assert.ok(!install.called);
    assert.ok(!uninstall.called);
  });

  it('should throw on bogus status', () => {
    assert.throws(() => {
      renderButton({status: 'BOGUS'});
    }, Error, 'Invalid add-on status');
  });

  describe('with redux', () => {
    const installations = {
      'installed-addon': {
        slug: 'installed-addon',
        guid: 'installed-addon@me.com',
        url: 'https://download.xpi/installed-addon.xpi',
        downloadProgress: 0,
        status: INSTALLED,
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

    it('pulls the installation from the status', () => {
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

    it('pulls the installation data from the state', () => {
      const addon = {
        slug: 'addon',
        downloadProgress: 75,
      };
      assert.strictEqual(
        mapStateToProps(
          {installations: {foo: {some: 'data'}, addon}},
          {slug: 'addon'}),
        addon);
    });

    it('handles no installation data', () => {
      assert.deepEqual(mapStateToProps({}, {slug: 'foo'}), {});
    });

    it('passes in install and uninstall handlers', () => {
      const dispatchProps = mapDispatchToProps(sinon.stub(), {slug: 'foo'});
      assert.deepEqual(Object.keys(dispatchProps).sort(), ['install', 'uninstall']);
    });
  });
});
