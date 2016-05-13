import React from 'react';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import * as addonManager from 'disco/addonManager';

import { InstallButton, mapStateToProps } from 'disco/containers/InstallButton';
import {
  DOWNLOADING,
  INSTALLED,
  INSTALLING,
  UNINSTALLED,
  UNINSTALLING,
  UNKNOWN,
} from 'disco/constants';

const AddonManager = addonManager.AddonManager;


describe('<InstallButton />', () => {
  let sandbox;

  function stubAddonManager({ getAddon = Promise.resolve() } = {}) {
    const instance = sinon.createStubInstance(AddonManager);
    instance.getAddon = sandbox.stub().returns(getAddon);
    const mockAddonManager = sandbox.spy(() => instance);
    sandbox.stub(addonManager, 'AddonManager', mockAddonManager);
    return instance;
  }

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  function renderButton({ dispatch = sandbox.spy(), ...props }) {
    return renderIntoDocument(<InstallButton dispatch={dispatch} { ...props } />);
  }

  it('should be disabled if isDisabled status is UNKNOWN', () => {
    stubAddonManager();
    const button = renderButton({status: UNKNOWN});
    const root = findDOMNode(button);
    const checkbox = root.querySelector('input[type=checkbox]');
    assert.equal(checkbox.hasAttribute('disabled'), true);
    assert.ok(root.classList.contains('unknown'));
  });

  it('should reflect UNINSTALLED status', () => {
    stubAddonManager();
    const button = renderButton({status: UNINSTALLED});
    const root = findDOMNode(button);
    const checkbox = root.querySelector('input[type=checkbox]');
    assert.equal(checkbox.hasAttribute('disabled'), false);
    assert.ok(root.classList.contains('uninstalled'));
  });

  it('should reflect INSTALLED status', () => {
    stubAddonManager();
    const button = renderButton({status: INSTALLED});
    const root = findDOMNode(button);
    const checkbox = root.querySelector('input[type=checkbox]');
    assert.equal(checkbox.checked, true, 'checked is true');
    assert.ok(root.classList.contains('installed'));
  });

  it('should reflect download downloadProgress', () => {
    stubAddonManager();
    const button = renderButton({status: DOWNLOADING, downloadProgress: 50});
    const root = findDOMNode(button);
    assert.ok(root.classList.contains('downloading'));
    assert.equal(root.getAttribute('data-download-progress'), 50);
  });

  it('should reflect installation', () => {
    stubAddonManager();
    const button = renderButton({status: INSTALLING});
    const root = findDOMNode(button);
    assert.ok(root.classList.contains('installing'));
  });

  it('should reflect uninstallation', () => {
    stubAddonManager();
    const button = renderButton({status: UNINSTALLING});
    const root = findDOMNode(button);
    assert.ok(root.classList.contains('uninstalling'));
  });

  it('should call install function on click when uninstalled', () => {
    const dispatch = sandbox.spy();
    const manager = stubAddonManager();
    const slug = 'foo';
    manager.install = sandbox.spy();
    const button = renderButton({dispatch, slug, status: UNINSTALLED});
    const root = findDOMNode(button);
    Simulate.click(root);
    assert(manager.install.called);
    assert(dispatch.calledWith({
      type: 'START_DOWNLOAD',
      payload: {slug},
    }));
  });

  it('should update the status to INSTALLED in componentDidMount', () => {
    const dispatch = sandbox.spy();
    const manager = stubAddonManager();
    const guid = '@foo';
    const slug = 'foo';
    const installUrl = 'http://the.url';
    renderButton({dispatch, guid, slug, status: UNKNOWN, installUrl});
    return manager.getAddon().then(() => {
      assert(dispatch.calledWith({
        type: 'INSTALL_STATE',
        payload: {guid, slug, status: INSTALLED, url: installUrl},
      }));
    });
  });

  it('should update the status to UNINSTALLED in componentDidMount', () => {
    const dispatch = sandbox.spy();
    const manager = stubAddonManager({getAddon: Promise.reject()});
    const guid = '@foo';
    const slug = 'foo';
    const installUrl = 'http://the.url';
    renderButton({dispatch, guid, slug, status: UNKNOWN, installUrl});
    return manager.getAddon().then(() => {
      assert(false, 'expected promise to reject');
    }, () => {
      assert(dispatch.calledWith({
        type: 'INSTALL_STATE',
        payload: {guid, slug, status: UNINSTALLED, url: installUrl},
      }));
    });
  });

  it('should call uninstall function on click when installed', () => {
    const dispatch = sandbox.spy();
    const slug = 'foo';
    const manager = stubAddonManager();
    manager.uninstall = sandbox.stub().returns(Promise.resolve());
    const button = renderButton({dispatch, slug, status: INSTALLED});
    const root = findDOMNode(button);
    Simulate.click(root);
    assert(manager.uninstall.called);
    assert(dispatch.calledWith({
      type: 'START_UNINSTALL',
      payload: {slug},
    }));
    return manager.uninstall().then(() => {
      assert(dispatch.calledWith({
        type: 'UNINSTALL_COMPLETE',
        payload: {slug},
      }));
    });
  });

  it('should not call anything on click when neither installed or uninstalled', () => {
    stubAddonManager();
    const install = sandbox.stub();
    const uninstall = sandbox.stub();
    const button = renderButton({status: DOWNLOADING, install, uninstall});
    const root = findDOMNode(button);
    Simulate.click(root);
    assert.ok(!install.called);
    assert.ok(!uninstall.called);
  });

  it('should associate the label and input with id and for attributes', () => {
    const button = renderButton({status: UNINSTALLED, slug: 'foo'});
    const root = findDOMNode(button);
    assert.equal(root.querySelector('input').getAttribute('id'),
                 'install-button-foo', 'id is set');
    assert.equal(root.querySelector('label').getAttribute('for'),
                 'install-button-foo', 'for attribute matches id');
  });

  it('should throw on bogus status', () => {
    stubAddonManager();
    assert.throws(() => {
      renderButton({status: 'BOGUS'});
    }, Error, 'Invalid add-on status');
  });

  it('sets the download progress on STATE_DOWNLOADING', () => {
    stubAddonManager();
    const dispatch = sandbox.spy();
    const slug = 'my-addon';
    const button = renderButton({dispatch, downloadProgress: 0, slug, status: DOWNLOADING});
    button.statusChanged({state: 'STATE_DOWNLOADING', progress: 300, maxProgress: 990});
    assert(dispatch.calledWith({
      type: 'DOWNLOAD_PROGRESS',
      payload: {downloadProgress: 30, slug},
    }));
  });

  it('sets status to installing on STATE_INSTALLING', () => {
    stubAddonManager();
    const dispatch = sandbox.spy();
    const slug = 'my-addon';
    const button = renderButton({dispatch, downloadProgress: 99, slug, status: DOWNLOADING});
    button.statusChanged({state: 'STATE_INSTALLING'});
    assert(dispatch.calledWith({
      type: 'START_INSTALL',
      payload: {slug},
    }));
  });

  it('sets status to installed on STATE_INSTALLED', () => {
    stubAddonManager();
    const dispatch = sandbox.spy();
    const slug = 'my-addon';
    const button = renderButton({dispatch, slug, status: INSTALLING});
    button.statusChanged({state: 'STATE_INSTALLED'})
    assert(dispatch.calledWith({
      type: 'INSTALL_COMPLETE',
      payload: {slug},
    }));
  });

  describe('mapStateToProps', () => {
    it('pulls the installation data from the state', () => {
      stubAddonManager();
      const addon = {
        slug: 'addon',
        downloadProgress: 75,
      };
      assert.deepEqual(
        mapStateToProps({
          installations: {foo: {some: 'data'}, addon},
          addons: {addon: {addonProp: 'addonValue'}},
        }, {slug: 'addon'}),
        {slug: 'addon', downloadProgress: 75, addonProp: 'addonValue'});
    });

    it('handles no installation data', () => {
      stubAddonManager();
      assert.deepEqual(mapStateToProps({}, {slug: 'foo'}), {});
    });
  });
});
