import React from 'react';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';

import * as addonManager from 'disco/addonManager';
import {
  InstallButton,
  makeProgressHandler,
  mapDispatchToProps,
  mapStateToProps,
} from 'disco/containers/InstallButton';
import {
  DOWNLOADING,
  INSTALLED,
  INSTALLING,
  THEME_INSTALL,
  THEME_TYPE,
  UNINSTALLED,
  UNINSTALLING,
  UNKNOWN,
} from 'disco/constants';
import { stubAddonManager, getFakeI18nInst } from 'tests/client/helpers';
import config from 'config';


describe('<InstallButton />', () => {
  function renderButton(props = {}) {
    const renderProps = {
      dispatch: sinon.spy(),
      setInitialStatus: sinon.spy(),
      install: sinon.spy(),
      installTheme: sinon.spy(),
      uninstall: sinon.spy(),
      i18n: getFakeI18nInst(),
      ...props,
    };

    return renderIntoDocument(
      <InstallButton {...renderProps} />);
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

  it('should not call anything on click when neither installed or uninstalled', () => {
    const install = sinon.stub();
    const uninstall = sinon.stub();
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
    assert.throws(() => {
      renderButton({status: 'BOGUS'});
    }, Error, 'Invalid add-on status');
  });

  it('should call installTheme function on click when uninstalled theme', () => {
    const installTheme = sinon.spy();
    const slug = 'my-theme';
    const button = renderButton({installTheme, type: THEME_TYPE, slug, status: UNINSTALLED});
    const themeData = button.refs.themeData;
    const root = findDOMNode(button);
    Simulate.click(root);
    assert(installTheme.calledWith(themeData, slug));
  });

  it('should call install function on click when uninstalled', () => {
    const guid = '@foo';
    const install = sinon.spy();
    const installURL = 'https://my.url/download';
    const slug = 'foo';
    const button = renderButton({guid, install, installURL, slug, status: UNINSTALLED});
    const root = findDOMNode(button);
    Simulate.click(root);
    assert(install.calledWith({guid, installURL, slug}));
  });

  it('should call uninstall function on click when installed', () => {
    const guid = '@foo';
    const installURL = 'https://my.url/download';
    const slug = 'foo';
    const uninstall = sinon.spy();
    const button = renderButton({guid, installURL, slug, status: INSTALLED, uninstall});
    const root = findDOMNode(button);
    Simulate.click(root);
    assert(uninstall.calledWith({guid, installURL, slug}));
  });

  it('should call setInitialStatus in componentDidMount', () => {
    const guid = '@foo';
    const installURL = 'http://the.url';
    const setInitialStatus = sinon.spy();
    const slug = 'foo';
    renderButton({guid, installURL, setInitialStatus, slug, status: UNKNOWN});
    assert(setInitialStatus.calledWith({guid, installURL, slug}));
  });

  describe('mapStateToProps', () => {
    it('pulls the installation data from the state', () => {
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
  });

  describe('makeProgressHandler', () => {
    it('sets the download progress on STATE_DOWNLOADING', () => {
      const dispatch = sinon.spy();
      const slug = 'my-addon';
      const handler = makeProgressHandler(dispatch, slug);
      handler({state: 'STATE_DOWNLOADING', progress: 300, maxProgress: 990});
      assert(dispatch.calledWith({
        type: 'DOWNLOAD_PROGRESS',
        payload: {downloadProgress: 30, slug},
      }));
    });

    it('sets status to installing on STATE_INSTALLING', () => {
      const dispatch = sinon.spy();
      const slug = 'my-addon';
      const handler = makeProgressHandler(dispatch, slug);
      handler({state: 'STATE_INSTALLING'});
      assert(dispatch.calledWith({
        type: 'START_INSTALL',
        payload: {slug},
      }));
    });

    it('sets status to installed on STATE_INSTALLED', () => {
      const dispatch = sinon.spy();
      const slug = 'my-addon';
      const handler = makeProgressHandler(dispatch, slug);
      handler({state: 'STATE_INSTALLED'});
      assert(dispatch.calledWith({
        type: 'INSTALL_COMPLETE',
        payload: {slug},
      }));
    });
  });

  describe('setInitialStatus', () => {
    it('sets the status to INSTALLED when add-on found', () => {
      stubAddonManager();
      const dispatch = sinon.spy();
      const guid = '@foo';
      const slug = 'foo';
      const installURL = 'http://the.url';
      const { setInitialStatus } = mapDispatchToProps(dispatch);
      return setInitialStatus({guid, installURL, slug})
        .then(() => {
          assert(dispatch.calledWith({
            type: 'INSTALL_STATE',
            payload: {guid, slug, status: INSTALLED, url: installURL},
          }));
        });
    });

    it('sets the status to INSTALLED when an installed theme is found', () => {
      stubAddonManager({getAddon: Promise.resolve({type: 'theme', isEnabled: true})});
      const dispatch = sinon.spy();
      const guid = '@foo';
      const slug = 'foo';
      const installURL = 'http://the.url';
      const { setInitialStatus } = mapDispatchToProps(dispatch);
      return setInitialStatus({guid, installURL, slug})
        .then(() => {
          assert(dispatch.calledWith({
            type: 'INSTALL_STATE',
            payload: {guid, slug, status: INSTALLED, url: installURL},
          }));
        });
    });

    it('sets the status to UNINSTALLED when an uninstalled theme is found', () => {
      stubAddonManager({getAddon: Promise.resolve({type: 'theme', isEnabled: false})});
      const dispatch = sinon.spy();
      const guid = '@foo';
      const slug = 'foo';
      const installURL = 'http://the.url';
      const { setInitialStatus } = mapDispatchToProps(dispatch);
      return setInitialStatus({guid, installURL, slug})
        .then(() => {
          assert(dispatch.calledWith({
            type: 'INSTALL_STATE',
            payload: {guid, slug, status: UNINSTALLED, url: installURL},
          }));
        });
    });

    it('sets the status to UNINSTALLED when not found', () => {
      stubAddonManager({getAddon: Promise.reject()});
      const dispatch = sinon.spy();
      const guid = '@foo';
      const slug = 'foo';
      const installURL = 'http://the.url';
      const { setInitialStatus } = mapDispatchToProps(dispatch);
      return setInitialStatus({guid, installURL, slug})
        .then(() => {
          assert(dispatch.calledWith({
            type: 'INSTALL_STATE',
            payload: {guid, slug, status: UNINSTALLED, url: installURL},
          }));
        });
    });
  });

  describe('install', () => {
    const guid = '@install';
    const installURL = 'https://mysite.com/download.xpi';
    const slug = 'install';

    it('installs the addon on a new AddonManager', () => {
      stubAddonManager();
      const dispatch = sinon.spy();
      const { install } = mapDispatchToProps(dispatch);
      return install({guid, installURL, slug})
        .then(() => {
          assert(addonManager.AddonManager.calledWithNew, 'new AddonManager() called');
          assert(addonManager.AddonManager.calledWith(guid, installURL, sinon.match.func));
        });
    });

    it('should dispatch START_DOWNLOAD', () => {
      stubAddonManager();
      const dispatch = sinon.spy();
      const { install } = mapDispatchToProps(dispatch);
      return install({guid, installURL, slug})
        .then(() => assert(dispatch.calledWith({
          type: 'START_DOWNLOAD',
          payload: {slug},
        })));
    });
  });

  describe('uninstall', () => {
    const guid = '@uninstall';
    const installURL = 'https://mysite.com/download.xpi';
    const slug = 'uninstall';

    it('prepares the addon on a new AddonManager', () => {
      stubAddonManager();
      const dispatch = sinon.spy();
      const { uninstall } = mapDispatchToProps(dispatch);
      return uninstall({guid, installURL, slug})
        .then(() => {
          assert(addonManager.AddonManager.calledWithNew, 'new AddonManager() called');
          assert(addonManager.AddonManager.calledWith(guid, installURL));
        });
    });

    it('should dispatch START_UNINSTALL', () => {
      stubAddonManager();
      const dispatch = sinon.spy();
      const { uninstall } = mapDispatchToProps(dispatch);
      return uninstall({guid, installURL, slug})
        .then(() => assert(dispatch.calledWith({
          type: 'START_UNINSTALL',
          payload: {slug},
        })));
    });
  });

  describe('installTheme', () => {
    it('installs the theme', () => {
      const node = sinon.stub();
      const slug = 'install-theme';
      const spyThemeAction = sinon.spy();
      const dispatch = sinon.spy();
      const { installTheme } = mapDispatchToProps(dispatch);
      return installTheme(node, slug, spyThemeAction)
        .then(() => {
          assert(spyThemeAction.calledWith(node, THEME_INSTALL));
          assert(dispatch.calledWith({
            type: 'INSTALL_STATE',
            payload: {slug, status: INSTALLED},
          }));
        });
    });
  });

  describe('mapDispatchToProps', () => {
    it('is empty when there is no navigator', () => {
      const configStub = sinon.stub(config, 'get').returns(true);
      assert.deepEqual(mapDispatchToProps(sinon.spy()), {});
      assert(configStub.calledOnce);
      assert(configStub.calledWith('server'));
    });
  });
});
