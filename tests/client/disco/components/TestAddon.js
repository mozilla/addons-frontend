import React from 'react';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
  Simulate,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import config from 'config';
import {
  Addon,
  makeProgressHandler,
  mapDispatchToProps,
  mapStateToProps,
} from 'disco/components/Addon';
import {
  DOWNLOAD_FAILED,
  DOWNLOAD_PROGRESS,
  ERROR,
  INSTALLED,
  INSTALL_CATEGORY,
  INSTALL_COMPLETE,
  INSTALL_FAILED,
  INSTALL_STATE,
  START_DOWNLOAD,
  START_INSTALL,
  START_UNINSTALL,
  THEME_INSTALL,
  THEME_PREVIEW,
  THEME_RESET_PREVIEW,
  THEME_TYPE,
  UNINSTALLED,
  UNINSTALL_CATEGORY,
} from 'disco/constants';
import { getFakeAddonManagerWrapper, getFakeI18nInst } from 'tests/client/helpers';
import I18nProvider from 'core/i18n/Provider';
import translate from 'core/i18n/translate';

const result = {
  id: 'test-id',
  type: 'extension',
  heading: 'test-heading',
  slug: 'test-slug',
  description: 'test-editorial-description',
};

function renderAddon({ setCurrentStatus = sinon.stub(), ...props }) {
  const MyAddon = translate({withRef: true})(Addon);

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

    it('renders a default error overlay', () => {
      const data = {...result, status: ERROR, setCurrentStatus: sinon.stub()};
      root = renderAddon(data);
      const error = findDOMNode(root).querySelector('.error');
      assert.equal(
        error.querySelector('p').textContent,
        'An unexpected error occurred.',
        'error message should be present');
      Simulate.click(error.querySelector('.close'));
      assert.ok(data.setCurrentStatus.called, 'setCurrentStatus should be called');
    });

    it('renders an install error overlay', () => {
      const data = {
        ...result, status: ERROR, error: INSTALL_FAILED, setCurrentStatus: sinon.stub(),
      };
      root = renderAddon(data);
      const error = findDOMNode(root).querySelector('.error');
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
      const error = findDOMNode(root).querySelector('.error');
      assert.equal(
        error.querySelector('p').textContent,
        'Download failed. Please check your connection.',
        'error message should be present');
      Simulate.click(error.querySelector('.close'));
      assert.ok(data.setCurrentStatus.called, 'setCurrentStatus should be called');
    });

    it('does not normally render an error', () => {
      assert.notOk(findDOMNode(root).querySelector('.error'));
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
      const data = {...result, type: 'Whatever'};
      assert.throws(() => {
        renderAddon(data);
      }, Error, 'Invalid addon type');
    });
  });


  describe('<Addon type="theme"/>', () => {
    let root;

    beforeEach(() => {
      const data = {...result, type: THEME_TYPE};
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
      const data = {...result, type: THEME_TYPE, themeAction};
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

    it('runs preventDefault onClick', () => {
      const preventDefault = sinon.stub();
      Simulate.click(themeImage, {preventDefault});
      assert.ok(preventDefault.called);
    });
  });

  describe('mapStateToProps', () => {
    it('pulls the installation data from the state', () => {
      const addon = {
        guid: 'foo@addon',
        downloadProgress: 75,
      };
      assert.deepEqual(
        mapStateToProps({
          installations: {foo: {some: 'data'}, 'foo@addon': addon},
          addons: {'foo@addon': {addonProp: 'addonValue'}},
        }, {guid: 'foo@addon'}),
        {guid: 'foo@addon', downloadProgress: 75, addonProp: 'addonValue'});
    });

    it('handles missing data', () => {
      assert.deepEqual(
        mapStateToProps({
          installations: {},
          addons: {},
        }, {guid: 'nope@addon'}),
        {});
    });
  });

  describe('makeProgressHandler', () => {
    it('sets the download progress on STATE_DOWNLOADING', () => {
      const dispatch = sinon.spy();
      const guid = 'foo@addon';
      const handler = makeProgressHandler(dispatch, guid);
      handler({state: 'STATE_DOWNLOADING', progress: 300, maxProgress: 990});
      assert(dispatch.calledWith({
        type: DOWNLOAD_PROGRESS,
        payload: {downloadProgress: 30, guid},
      }));
    });

    it('sets status to installing on STATE_INSTALLING', () => {
      const dispatch = sinon.spy();
      const guid = 'foo@my-addon';
      const handler = makeProgressHandler(dispatch, guid);
      handler({state: 'STATE_INSTALLING'});
      assert(dispatch.calledWith({
        type: START_INSTALL,
        payload: {guid},
      }));
    });

    it('sets status to installed on STATE_INSTALLED', () => {
      const dispatch = sinon.spy();
      const guid = '{my-addon}';
      const handler = makeProgressHandler(dispatch, guid);
      handler({state: 'STATE_INSTALLED'});
      assert(dispatch.calledWith({
        type: INSTALL_COMPLETE,
        payload: {guid},
      }));
    });

    it('sets status to error on onDownloadFailed', () => {
      const dispatch = sinon.spy();
      const guid = '{my-addon}';
      const i18n = getFakeI18nInst();
      const handler = makeProgressHandler(dispatch, guid, i18n);
      handler({state: 'STATE_SOMETHING'}, {type: 'onDownloadFailed'});
      assert(dispatch.calledWith({
        type: 'INSTALL_ERROR',
        payload: {guid, error: DOWNLOAD_FAILED},
      }));
    });

    it('sets status to error on onInstallFailed', () => {
      const dispatch = sinon.spy();
      const guid = '{my-addon}';
      const i18n = getFakeI18nInst();
      const handler = makeProgressHandler(dispatch, guid, i18n);
      handler({state: 'STATE_SOMETHING'}, {type: 'onInstallFailed'});
      assert(dispatch.calledWith({
        type: 'INSTALL_ERROR',
        payload: {guid, error: INSTALL_FAILED},
      }));
    });
  });

  describe('setCurrentStatus', () => {
    it('sets the status to INSTALLED when add-on found', () => {
      const dispatch = sinon.spy();
      const guid = '@foo';
      const installURL = 'http://the.url';
      const { setCurrentStatus } = mapDispatchToProps(
        dispatch, {_addonManager: getFakeAddonManagerWrapper()});
      return setCurrentStatus({guid, installURL})
        .then(() => {
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: {guid, status: INSTALLED, url: installURL},
          }));
        });
    });

    it('sets the status to INSTALLED when an installed theme is found', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper(
        {getAddon: Promise.resolve({type: THEME_TYPE, isEnabled: true})});
      const dispatch = sinon.spy();
      const guid = '@foo';
      const installURL = 'http://the.url';
      const { setCurrentStatus } = mapDispatchToProps(dispatch, {_addonManager: fakeAddonManager});
      return setCurrentStatus({guid, installURL})
        .then(() => {
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: {guid, status: INSTALLED, url: installURL},
          }));
        });
    });

    it('sets the status to UNINSTALLED when an uninstalled theme is found', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper(
        {getAddon: Promise.resolve({type: THEME_TYPE, isEnabled: false})});
      const dispatch = sinon.spy();
      const guid = '@foo';
      const installURL = 'http://the.url';
      const { setCurrentStatus } = mapDispatchToProps(dispatch, {_addonManager: fakeAddonManager});
      return setCurrentStatus({guid, installURL})
        .then(() => {
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: {guid, status: UNINSTALLED, url: installURL},
          }));
        });
    });

    it('sets the status to UNINSTALLED when not found', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper({getAddon: Promise.reject()});
      const dispatch = sinon.spy();
      const guid = '@foo';
      const installURL = 'http://the.url';
      const { setCurrentStatus } = mapDispatchToProps(dispatch, {_addonManager: fakeAddonManager});
      return setCurrentStatus({guid, installURL})
        .then(() => {
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: {guid, status: UNINSTALLED, url: installURL},
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
      const { install } = mapDispatchToProps(dispatch, {_addonManager: fakeAddonManager});
      return install({guid, installURL})
        .then(() => {
          assert(fakeAddonManager.install.calledWith(installURL, sinon.match.func));
        });
    });

    it('tracks an addon install', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const name = 'hai-addon';
      const type = 'extension';
      const dispatch = sinon.spy();
      const fakeTracking = {
        sendEvent: sinon.spy(),
      };
      const { install } = mapDispatchToProps(dispatch,
        {_tracking: fakeTracking, _addonManager: fakeAddonManager});
      return install({guid, installURL, name, type})
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
      const dispatch = sinon.spy();
      const { install } = mapDispatchToProps(dispatch, {_addonManager: fakeAddonManager});
      return install({guid, installURL})
        .then(() => assert(dispatch.calledWith({
          type: START_DOWNLOAD,
          payload: {guid},
        })));
    });
  });

  describe('uninstall', () => {
    const guid = '@uninstall';
    const installURL = 'https://mysite.com/download.xpi';

    it('calls addonManager.uninstall()', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const dispatch = sinon.spy();
      const { uninstall } = mapDispatchToProps(dispatch, {_addonManager: fakeAddonManager});
      return uninstall({guid, installURL})
        .then(() => {
          assert(fakeAddonManager.uninstall.calledWith(guid));
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
        {_tracking: fakeTracking, _addonManager: fakeAddonManager});
      return uninstall({guid, installURL, name, type})
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
        {_tracking: fakeTracking, _addonManager: fakeAddonManager});
      return uninstall({guid, installURL, name, type: THEME_TYPE})
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
        {_tracking: fakeTracking, _addonManager: fakeAddonManager});
      return uninstall({guid, installURL, name, type})
        .then(() => {
          assert(fakeTracking.sendEvent.calledWith({
            action: 'invalid',
            category: UNINSTALL_CATEGORY,
            label: 'whatevs',
          }));
        });
    });

    it('should dispatch START_UNINSTALL', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const dispatch = sinon.spy();
      const { uninstall } = mapDispatchToProps(dispatch, {_addonManager: fakeAddonManager});
      return uninstall({guid, installURL})
        .then(() => assert(dispatch.calledWith({
          type: START_UNINSTALL,
          payload: {guid},
        })));
    });
  });

  describe('installTheme', () => {
    it('installs the theme', () => {
      const name = 'hai-theme';
      const guid = '{install-theme}';
      const node = sinon.stub();
      const spyThemeAction = sinon.spy();
      const dispatch = sinon.spy();
      const { installTheme } = mapDispatchToProps(dispatch);
      return installTheme(node, guid, name, spyThemeAction)
        .then(() => {
          assert(spyThemeAction.calledWith(node, THEME_INSTALL));
          assert(dispatch.calledWith({
            type: INSTALL_STATE,
            payload: {guid, status: INSTALLED},
          }));
        });
    });

    it('tracks a theme install', () => {
      const name = 'hai-theme';
      const guid = '{install-theme}';
      const node = sinon.stub();
      const dispatch = sinon.spy();
      const spyThemeAction = sinon.spy();
      const fakeTracking = {
        sendEvent: sinon.spy(),
      };
      const { installTheme } = mapDispatchToProps(dispatch, {_tracking: fakeTracking});
      return installTheme(node, guid, name, spyThemeAction)
        .then(() => {
          assert(fakeTracking.sendEvent.calledWith({
            action: 'theme',
            category: INSTALL_CATEGORY,
            label: 'hai-theme',
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
