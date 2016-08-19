import React from 'react';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
  Simulate,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import config from 'config';

import I18nProvider from 'core/i18n/Provider';
import translate from 'core/i18n/translate';
import {
  AddonBase,
  makeProgressHandler,
  mapDispatchToProps,
  mapStateToProps,
} from 'disco/components/Addon';
import {
  DISABLED,
  DOWNLOAD_FAILED,
  DOWNLOAD_PROGRESS,
  ENABLED,
  ERROR,
  EXTENSION_TYPE,
  FATAL_ERROR,
  FATAL_INSTALL_ERROR,
  FATAL_UNINSTALL_ERROR,
  INSTALLED,
  INSTALL_FAILED,
  INSTALL_STATE,
  START_DOWNLOAD,
  THEME_INSTALL,
  THEME_PREVIEW,
  THEME_RESET_PREVIEW,
  THEME_TYPE,
  UNINSTALLED,
  UNINSTALLING,
} from 'core/constants';
import {
  CLOSE_INFO,
  INSTALL_CATEGORY,
  SET_ENABLE_NOT_AVAILABLE,
  SHOW_INFO,
  UNINSTALL_CATEGORY,
} from 'disco/constants';
import { getFakeAddonManagerWrapper, getFakeI18nInst }
  from 'tests/client/helpers';

const result = {
  id: 'test-id',
  type: 'extension',
  heading: 'test-heading',
  slug: 'test-slug',
  description: 'test-editorial-description',
};

function renderAddon({ setCurrentStatus = sinon.stub(), ...props }) {
  const MyAddon = translate({ withRef: true })(AddonBase);

  return findRenderedComponentWithType(renderIntoDocument(
    <I18nProvider i18n={getFakeI18nInst()}>
      <MyAddon {...props} setCurrentStatus={setCurrentStatus} />
    </I18nProvider>
  ), MyAddon).getWrappedInstance();
}

describe('<Addon />', () => {
  describe('<Addon type="extension"/>', () => {
    let root;

    beforeEach(() => {
      root = renderAddon(result);
    });

    it('renders a default error overlay with no close link', () => {
      const data = { ...result, status: ERROR, setCurrentStatus: sinon.stub() };
      root = renderAddon(data);
      const error = findDOMNode(root).querySelector('.notification.error');
      assert.equal(
        error.querySelector('p').textContent,
        'An unexpected error occurred.',
        'error message should be present');
      assert.equal(error.querySelector('.close'), null);
    });

    it('renders a default error overlay with no close link for FATAL_ERROR', () => {
      const data = {
        ...result,
        status: ERROR,
        setCurrentStatus: sinon.stub(),
        error: FATAL_ERROR,
      };
      root = renderAddon(data);
      const error = findDOMNode(root).querySelector('.notification.error');
      assert.equal(
        error.querySelector('p').textContent,
        'An unexpected error occurred.',
        'error message should be present');
      assert.equal(error.querySelector('.close'), null);
    });

    it('renders a specific overlay with no close link for FATAL_INSTALL_ERROR', () => {
      const data = {
        ...result,
        status: ERROR,
        setCurrentStatus: sinon.stub(),
        error: FATAL_INSTALL_ERROR,
      };
      root = renderAddon(data);
      const error = findDOMNode(root).querySelector('.notification.error');
      assert.equal(
        error.querySelector('p').textContent,
        'An unexpected error occurred during installation.',
        'error message should be present');
      assert.equal(error.querySelector('.close'), null);
    });

    it('renders a specific overlay with no close link for FATAL_UNINSTALL_ERROR', () => {
      const data = {
        ...result,
        status: ERROR,
        setCurrentStatus: sinon.stub(),
        error: FATAL_UNINSTALL_ERROR,
      };
      root = renderAddon(data);
      const error = findDOMNode(root).querySelector('.notification.error');
      assert.equal(
        error.querySelector('p').textContent,
        'An unexpected error occurred during uninstallation.',
        'error message should be present');
      assert.equal(error.querySelector('.close'), null);
    });

    it('renders an install error overlay', () => {
      const data = {
        ...result, status: ERROR, error: INSTALL_FAILED, setCurrentStatus: sinon.stub(),
      };
      root = renderAddon(data);
      const error = findDOMNode(root).querySelector('.notification.error');
      assert.equal(
        error.querySelector('p').textContent,
        'Installation failed. Please try again.',
        'error message should be present');
      Simulate.click(error.querySelector('.close'));
      assert.ok(data.setCurrentStatus.called, 'setCurrentStatus should be called');
    });

    it('renders an error overlay', () => {
      const data = {
        ...result, status: ERROR, error: DOWNLOAD_FAILED, setCurrentStatus: sinon.stub(),
      };
      root = renderAddon(data);
      const error = findDOMNode(root).querySelector('.notification.error');
      assert.equal(
        error.querySelector('p').textContent,
        'Download failed. Please check your connection.',
        'error message should be present');
      Simulate.click(error.querySelector('.close'));
      assert.ok(data.setCurrentStatus.called, 'setCurrentStatus should be called');
    });

    it('does not normally render an error', () => {
      assert.notOk(findDOMNode(root).querySelector('.notification.error'));
    });

    it('renders a default restart notification', () => {
      const data = { ...result, needsRestart: true };
      root = renderAddon(data);
      const restart = findDOMNode(root).querySelector('.notification.restart');
      assert.equal(
        restart.querySelector('p').textContent,
        'Please restart Firefox to use this add-on.',
        'restart message should be present');
    });

    it('renders a uninstallation restart notification', () => {
      const data = { ...result, needsRestart: true, status: UNINSTALLING };
      root = renderAddon(data);
      const restart = findDOMNode(root).querySelector('.notification.restart');
      assert.equal(
        restart.querySelector('p').textContent,
        'This add-on will be uninstalled after you restart Firefox.',
        'restart uninstallation message should be present');
    });

    it('does not normally render a restart notification', () => {
      assert.notOk(findDOMNode(root).querySelector('.notification.restart'));
    });

    it('renders the heading', () => {
      assert.include(root.refs.heading.textContent, 'test-heading');
    });

    it('renders the editorial description', () => {
      assert.equal(root.refs.editorialDescription.textContent, 'test-editorial-description');
    });

    it('purifies the heading', () => {
      root = renderAddon({
        ...result,
        heading: '<script>alert("hi")</script><em>Hey!</em> <i>This is <span>an add-on</span></i>',
      });
      assert.include(root.refs.heading.innerHTML, 'Hey! This is <span>an add-on</span>');
    });

    it('purifies the heading with a link and adds link attrs', () => {
      root = renderAddon({
        ...result,
        heading: 'This is <span>an <a href="https://addons.mozilla.org">add-on</a>/span>',
      });
      const link = root.refs.heading.querySelector('a');
      assert.equal(link.getAttribute('rel'), 'noreferrer');
      assert.equal(link.getAttribute('target'), '_blank');
    });

    it('purifies the heading with a bad link', () => {
      root = renderAddon({
        ...result,
        heading: 'This is <span>an <a href="javascript:alert(1)">add-on</a>/span>',
      });
      const link = root.refs.heading.querySelector('a');
      assert.equal(link.getAttribute('href'), null);
    });

    it('purifies the editorial description', () => {
      root = renderAddon({
        ...result,
        description: '<script>foo</script><blockquote>This is an add-on!</blockquote> ' +
                     '<i>Reviewed by <cite>a person</cite></i>',
      });
      assert.equal(
        root.refs.editorialDescription.innerHTML,
        '<blockquote>This is an add-on!</blockquote> Reviewed by <cite>a person</cite>');
    });

    it('does render a logo for an extension', () => {
      assert.ok(findDOMNode(root).querySelector('.logo'));
    });

    it("doesn't render a theme image for an extension", () => {
      assert.equal(findDOMNode(root).querySelector('.theme-image'), null);
    });

    it('throws on invalid add-on type', () => {
      assert.include(root.refs.heading.textContent, 'test-heading');
      const data = { ...result, type: 'Whatever' };
      assert.throws(() => {
        renderAddon(data);
      }, Error, 'Invalid addon type');
    });
  });


  describe('<Addon type="theme"/>', () => {
    let root;

    beforeEach(() => {
      const data = { ...result, type: THEME_TYPE };
      root = renderAddon(data);
    });

    it('does render the theme image for a theme', () => {
      assert.ok(findDOMNode(root).querySelector('.theme-image'));
    });

    it("doesn't render the logo for a theme", () => {
      assert.notOk(findDOMNode(root).querySelector('.logo'));
    });
  });


  describe('Theme Previews', () => {
    let root;
    let themeImage;
    let themeAction;

    beforeEach(() => {
      themeAction = sinon.stub();
      const data = { ...result, type: THEME_TYPE, themeAction };
      root = renderAddon(data);
      themeImage = findDOMNode(root).querySelector('.theme-image');
    });

    it('runs theme preview onMouseOver on theme image', () => {
      Simulate.mouseOver(themeImage);
      assert.ok(themeAction.calledWith(themeImage, THEME_PREVIEW));
    });

    it('resets theme preview onMouseOut on theme image', () => {
      Simulate.mouseOut(themeImage);
      assert.ok(themeAction.calledWith(themeImage, THEME_RESET_PREVIEW));
    });

    it('runs theme preview onFocus on theme image', () => {
      Simulate.focus(themeImage);
      assert.ok(themeAction.calledWith(themeImage, THEME_PREVIEW));
    });

    it('resets theme preview onBlur on theme image', () => {
      Simulate.blur(themeImage);
      assert.ok(themeAction.calledWith(themeImage, THEME_RESET_PREVIEW));
    });

    it('installs a theme when the theme image is clicked', () => {
      const preventDefault = sinon.stub();
      Simulate.click(themeImage, { preventDefault });
      const installTheme = sinon.stub();
      const data = { ...result, type: THEME_TYPE, themeAction,
        status: UNINSTALLED, installTheme };
      root = renderAddon(data);
      themeImage = findDOMNode(root).querySelector('.theme-image');
      Simulate.click(themeImage, { currentTarget: themeImage, preventDefault });
      assert.ok(preventDefault.called);
      assert.ok(installTheme.called);
    });

    it('installs a theme when a disabled theme image is clicked', () => {
      const preventDefault = sinon.stub();
      Simulate.click(themeImage, { preventDefault });
      const installTheme = sinon.stub();
      const data = { ...result, type: THEME_TYPE, themeAction,
        status: DISABLED, installTheme };
      root = renderAddon(data);
      themeImage = findDOMNode(root).querySelector('.theme-image');
      Simulate.click(themeImage, { currentTarget: themeImage, preventDefault });
      assert.ok(preventDefault.called);
      assert.ok(installTheme.called);
    });

    it('does not try to install theme if not UNINSTALLED', () => {
      const preventDefault = sinon.stub();
      const installTheme = sinon.stub();
      const data = { ...result, type: THEME_TYPE, themeAction,
        status: INSTALLED, installTheme };
      root = renderAddon(data);
      themeImage = findDOMNode(root).querySelector('.theme-image');
      Simulate.click(themeImage, { currentTarget: themeImage, preventDefault });
      assert.ok(preventDefault.called);
      assert.notOk(installTheme.called);
    });
  });

  describe('mapStateToProps', () => {
    it('pulls the installation data from the state', () => {
      const addon = {
        guid: 'foo@addon',
        downloadProgress: 75,
      };
      const props = mapStateToProps({
        installations: { foo: { some: 'data' }, 'foo@addon': addon },
        addons: { 'foo@addon': { addonProp: 'addonValue' } },
      }, { guid: 'foo@addon' });
      assert.deepEqual(props, {
        guid: 'foo@addon',
        downloadProgress: 75,
        addonProp: 'addonValue',
        installTheme: props.installTheme,
      });
    });

    it('handles missing data', () => {
      const props = mapStateToProps({
        installations: {},
        addons: {},
      }, { guid: 'nope@addon' });
      assert.deepEqual(props, { installTheme: props.installTheme });
    });
  });

  describe('makeProgressHandler', () => {
    it('sets the download progress on STATE_DOWNLOADING', () => {
      const dispatch = sinon.spy();
      const guid = 'foo@addon';
      const handler = makeProgressHandler(dispatch, guid);
      handler({ state: 'STATE_DOWNLOADING', progress: 300, maxProgress: 990 });
      assert(dispatch.calledWith({
        type: DOWNLOAD_PROGRESS,
        payload: { downloadProgress: 30, guid },
      }));
    });

    it('sets status to error on onDownloadFailed', () => {
      const dispatch = sinon.spy();
      const guid = '{my-addon}';
      const i18n = getFakeI18nInst();
      const handler = makeProgressHandler(dispatch, guid, i18n);
      handler({ state: 'STATE_SOMETHING' }, { type: 'onDownloadFailed' });
      assert(dispatch.calledWith({
        type: 'INSTALL_ERROR',
        payload: { guid, error: DOWNLOAD_FAILED },
      }));
    });

    it('sets status to error on onInstallFailed', () => {
      const dispatch = sinon.spy();
      const guid = '{my-addon}';
      const i18n = getFakeI18nInst();
      const handler = makeProgressHandler(dispatch, guid, i18n);
      handler({ state: 'STATE_SOMETHING' }, { type: 'onInstallFailed' });
      assert(dispatch.calledWith({
        type: 'INSTALL_ERROR',
        payload: { guid, error: INSTALL_FAILED },
      }));
    });
  });

  describe('setCurrentStatus', () => {
    it('sets the status to ENABLED when an enabled add-on found', () => {
      const dispatch = sinon.spy();
      const guid = '@foo';
      const installURL = 'http://the.url';
      const { setCurrentStatus } = mapDispatchToProps(
        dispatch, { _addonManager: getFakeAddonManagerWrapper() });
      return setCurrentStatus({ guid, installURL })
        .then(() => {
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: { guid, status: ENABLED, url: installURL },
          }));
        });
    });

    it('sets the status to DISABLED when a disabled add-on found', () => {
      const dispatch = sinon.spy();
      const guid = '@foo';
      const installURL = 'http://the.url';
      const { setCurrentStatus } = mapDispatchToProps(dispatch, {
        _addonManager: getFakeAddonManagerWrapper({
          getAddon: Promise.resolve({ type: EXTENSION_TYPE, isActive: false, isEnabled: false }),
        }),
      });
      return setCurrentStatus({ guid, installURL })
        .then(() => {
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: { guid, status: DISABLED, url: installURL },
          }));
        });
    });

    it('sets the status to DISABLED when an inactive add-on found', () => {
      const dispatch = sinon.spy();
      const guid = '@foo';
      const installURL = 'http://the.url';
      const { setCurrentStatus } = mapDispatchToProps(dispatch, {
        _addonManager: getFakeAddonManagerWrapper({
          getAddon: Promise.resolve({ type: EXTENSION_TYPE, isActive: false, isEnabled: true }),
        }),
      });
      return setCurrentStatus({ guid, installURL })
        .then(() => {
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: { guid, status: DISABLED, url: installURL },
          }));
        });
    });

    it('sets the status to ENABLED when an enabled theme is found', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper({
        getAddon: Promise.resolve({ type: THEME_TYPE, isActive: true, isEnabled: true }),
      });
      const dispatch = sinon.spy();
      const guid = '@foo';
      const installURL = 'http://the.url';
      const { setCurrentStatus } =
        mapDispatchToProps(dispatch, { _addonManager: fakeAddonManager });
      return setCurrentStatus({ guid, installURL })
        .then(() => {
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: { guid, status: ENABLED, url: installURL },
          }));
        });
    });

    it('sets the status to DISABLED when an inactive theme is found', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper({
        getAddon: Promise.resolve({ type: THEME_TYPE, isActive: false, isEnabled: true }),
      });
      const dispatch = sinon.spy();
      const guid = '@foo';
      const installURL = 'http://the.url';
      const { setCurrentStatus } =
        mapDispatchToProps(dispatch, { _addonManager: fakeAddonManager });
      return setCurrentStatus({ guid, installURL })
        .then(() => {
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: { guid, status: DISABLED, url: installURL },
          }));
        });
    });

    it('sets the status to DISABLED when a disabled theme is found', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper({
        getAddon: Promise.resolve({ type: THEME_TYPE, isActive: true, isEnabled: false }),
      });
      const dispatch = sinon.spy();
      const guid = '@foo';
      const installURL = 'http://the.url';
      const { setCurrentStatus } =
        mapDispatchToProps(dispatch, { _addonManager: fakeAddonManager });
      return setCurrentStatus({ guid, installURL })
        .then(() => {
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: { guid, status: DISABLED, url: installURL },
          }));
        });
    });

    it('sets the status to UNINSTALLED when not found', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper({ getAddon: Promise.reject() });
      const dispatch = sinon.spy();
      const guid = '@foo';
      const installURL = 'http://the.url';
      const { setCurrentStatus } =
        mapDispatchToProps(dispatch, { _addonManager: fakeAddonManager });
      return setCurrentStatus({ guid, installURL })
        .then(() => {
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: { guid, status: UNINSTALLED, url: installURL },
          }));
        });
    });

    it('dispatches error when setCurrentStatus then() gets exception', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper({ getAddon: Promise.resolve() });
      const guid = '@foo';
      const installURL = 'http://the.url';
      const dispatch = sinon.stub();
      dispatch.onFirstCall().returns(Promise.reject());
      const { setCurrentStatus } =
        mapDispatchToProps(dispatch, { _addonManager: fakeAddonManager });
      return setCurrentStatus({ guid, installURL })
        .then(() => {
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: { guid, status: ERROR, error: FATAL_ERROR },
          }), 'dispatch was not called with FATAL_ERROR');
        });
    });
  });

  describe('enable', () => {
    const guid = '@enable';
    const name = 'whatever addon';
    const iconUrl = 'something.jpg';

    it('calls addonManager.enable()', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const dispatch = sinon.spy();
      const i18n = getFakeI18nInst();
      const { enable } = mapDispatchToProps(
        dispatch,
        { name, iconUrl, guid, _addonManager: fakeAddonManager, i18n });
      const fakeShowInfo = sinon.stub();
      return enable({ _showInfo: fakeShowInfo })
        .then(() => {
          assert.ok(fakeAddonManager.enable.calledWith(guid));
          assert.ok(fakeShowInfo.calledWith({ name, i18n, iconUrl }));
        });
    });

    it('dispatches a FATAL_ERROR', () => {
      const fakeAddonManager = {
        enable: sinon.stub().returns(Promise.reject(new Error('hai'))),
      };
      const dispatch = sinon.spy();
      const i18n = getFakeI18nInst();
      const { enable } = mapDispatchToProps(
        dispatch,
        { name, iconUrl, guid, _addonManager: fakeAddonManager, i18n });
      return enable()
        .then(() => {
          assert.ok(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: { guid, status: ERROR, error: FATAL_ERROR },
          }));
        });
    });

    it('does not dispatch a FATAL_ERROR when setEnabled is missing', () => {
      const fakeAddonManager = {
        enable: sinon.stub().returns(Promise.reject(new Error(SET_ENABLE_NOT_AVAILABLE))),
      };
      const dispatch = sinon.spy();
      const i18n = getFakeI18nInst();
      const { enable } = mapDispatchToProps(
        dispatch,
        { name, iconUrl, guid, _addonManager: fakeAddonManager, i18n });
      return enable()
        .then(() => {
          assert.notOk(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: { guid, status: ERROR, error: FATAL_ERROR },
          }));
        });
    });
  });

  describe('install', () => {
    const guid = '@install';
    const installURL = 'https://mysite.com/download.xpi';

    it('calls addonManager.install()', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const dispatch = sinon.spy();
      const i18n = getFakeI18nInst();
      const { install } = mapDispatchToProps(
        dispatch,
        { _addonManager: fakeAddonManager, i18n, installURL });
      return install({ guid, installURL })
        .then(() => {
          assert(fakeAddonManager.install.calledWith(installURL, sinon.match.func));
        });
    });

    it('tracks an addon install', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const name = 'hai-addon';
      const type = 'extension';
      const i18n = getFakeI18nInst();
      const dispatch = sinon.spy();
      const fakeTracking = {
        sendEvent: sinon.spy(),
      };
      const { install } = mapDispatchToProps(
        dispatch,
        { _tracking: fakeTracking, _addonManager: fakeAddonManager, i18n, name });
      return install({ guid, installURL, name, type })
        .then(() => {
          assert(fakeTracking.sendEvent.calledWith({
            action: 'addon',
            category: INSTALL_CATEGORY,
            label: 'hai-addon',
          }));
        });
    });

    it('should dispatch START_DOWNLOAD', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const i18n = getFakeI18nInst();
      const dispatch = sinon.spy();
      const { install } = mapDispatchToProps(
        dispatch,
        { _addonManager: fakeAddonManager, guid, i18n });
      return install({ guid, installURL })
        .then(() => assert(dispatch.calledWith({
          type: START_DOWNLOAD,
          payload: { guid },
        })));
    });

    it('should dispatch SHOW_INFO', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const i18n = getFakeI18nInst();
      const dispatch = sinon.spy();
      const iconUrl = 'whatevs';
      const name = 'test-addon';

      const fakeConfig = {
        has: sinon.stub().withArgs('useUiTour').returns(false),
      };
      const { install } = mapDispatchToProps(
        dispatch,
        {
          _addonManager: fakeAddonManager,
          _config: fakeConfig,
          i18n,
          iconUrl,
          name,
        });
      return install({ guid, installURL })
        .then(() => {
          assert(dispatch.calledWith({
            type: SHOW_INFO,
            payload: {
              addonName: 'test-addon',
              imageURL: iconUrl,
              closeAction: sinon.match.func,
            },
          }));

          // Grab the first arg of second call.
          const arg = dispatch.getCall(1).args[0];
          // Prove we're looking at the SHOW_INFO dispatch.
          assert.equal(arg.type, SHOW_INFO);

          // Test that close action dispatches.
          arg.payload.closeAction();
          assert(dispatch.calledWith({
            type: CLOSE_INFO,
          }));
        });
    });

    it('should use uiTour', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const i18n = getFakeI18nInst();
      const dispatch = sinon.spy();
      const iconUrl = 'whatevs';
      const name = 'test-addon';

      const fakeConfig = {
        has: sinon.stub().withArgs('useUiTour').returns(true),
        get: sinon.stub().withArgs('useUiTour').returns(true),
      };
      const fakeDispatchEvent = sinon.stub();
      const { install } = mapDispatchToProps(
        dispatch,
        {
          _addonManager: fakeAddonManager,
          _dispatchEvent: fakeDispatchEvent,
          _config: fakeConfig,
          i18n,
          iconUrl,
          name,
        });
      return install({ guid, installURL })
        .then(() => assert.ok(fakeDispatchEvent.called));
    });

    it('dispatches error when addonManager.install throws', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      fakeAddonManager.install = sinon.stub().returns(Promise.reject());
      const i18n = getFakeI18nInst();
      const dispatch = sinon.stub();
      const { install } = mapDispatchToProps(
        dispatch,
        { _addonManager: fakeAddonManager, guid, i18n });

      return install({ guid, installURL })
        .then(() => {
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: { guid, status: ERROR, error: FATAL_INSTALL_ERROR },
          }), 'dispatch was not called with FATAL_INSTALL_ERROR');
        });
    });
  });

  describe('uninstall', () => {
    const guid = '@uninstall';
    const installURL = 'https://mysite.com/download.xpi';

    it('calls addonManager.uninstall()', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const dispatch = sinon.spy();
      const { uninstall } = mapDispatchToProps(dispatch, { _addonManager: fakeAddonManager });
      return uninstall({ guid, installURL })
        .then(() => {
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: {
              guid,
              status: UNINSTALLING,
            },
          }));
          assert(fakeAddonManager.uninstall.calledWith(guid));
        });
    });

    it('dispatches error when addonManager.uninstall throws', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      fakeAddonManager.uninstall = sinon.stub().returns(Promise.reject());
      const dispatch = sinon.spy();
      const { uninstall } = mapDispatchToProps(dispatch, { _addonManager: fakeAddonManager });
      return uninstall({ guid, installURL })
        .then(() => {
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: {
              guid,
              status: UNINSTALLING,
            },
          }));
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: { guid, status: ERROR, error: FATAL_UNINSTALL_ERROR },
          }), 'dispatch was not called with FATAL_UNINSTALL_ERROR');
        });
    });

    it('tracks an addon uninstall', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const dispatch = sinon.spy();
      const name = 'whatevs';
      const type = 'extension';
      const fakeTracking = {
        sendEvent: sinon.spy(),
      };
      const { uninstall } = mapDispatchToProps(dispatch,
        { _tracking: fakeTracking, _addonManager: fakeAddonManager });
      return uninstall({ guid, installURL, name, type })
        .then(() => {
          assert.ok(fakeTracking.sendEvent.calledWith({
            action: 'addon',
            category: UNINSTALL_CATEGORY,
            label: 'whatevs',
          }), 'correctly called');
        });
    });

    it('tracks a theme uninstall', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const dispatch = sinon.spy();
      const name = 'whatevs';
      const fakeTracking = {
        sendEvent: sinon.spy(),
      };
      const { uninstall } = mapDispatchToProps(dispatch,
        { _tracking: fakeTracking, _addonManager: fakeAddonManager });
      return uninstall({ guid, installURL, name, type: THEME_TYPE })
        .then(() => {
          assert(fakeTracking.sendEvent.calledWith({
            action: 'theme',
            category: UNINSTALL_CATEGORY,
            label: 'whatevs',
          }));
        });
    });

    it('tracks a unknown type uninstall', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const dispatch = sinon.spy();
      const name = 'whatevs';
      const type = 'foo';
      const fakeTracking = {
        sendEvent: sinon.spy(),
      };
      const { uninstall } = mapDispatchToProps(dispatch,
        { _tracking: fakeTracking, _addonManager: fakeAddonManager });
      return uninstall({ guid, installURL, name, type })
        .then(() => {
          assert(fakeTracking.sendEvent.calledWith({
            action: 'invalid',
            category: UNINSTALL_CATEGORY,
            label: 'whatevs',
          }));
        });
    });
  });

  describe('installTheme', () => {
    it('installs the theme', () => {
      const name = 'hai-theme';
      const guid = '{install-theme}';
      const node = sinon.stub();
      const spyThemeAction = sinon.spy();
      const props = mapStateToProps({ installations: {}, addons: {} }, {});
      props.installTheme(node, guid, name, spyThemeAction);
      assert(spyThemeAction.calledWith(node, THEME_INSTALL));
    });

    it('tracks a theme install', () => {
      const name = 'hai-theme';
      const guid = '{install-theme}';
      const node = sinon.stub();
      const spyThemeAction = sinon.spy();
      const fakeTracking = {
        sendEvent: sinon.spy(),
      };
      const { installTheme } = mapStateToProps({ installations: {}, addons: {} }, {}, {
        _tracking: fakeTracking,
      });
      installTheme(node, guid, name, spyThemeAction);
      assert(fakeTracking.sendEvent.calledWith({
        action: 'theme',
        category: INSTALL_CATEGORY,
        label: 'hai-theme',
      }));
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
