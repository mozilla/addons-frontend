import React from 'react';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
  Simulate,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import config from 'config';
import Addon, {
  makeProgressHandler,
  mapDispatchToProps,
  mapStateToProps,
} from 'disco/components/Addon';
import * as addonManager from 'disco/addonManager';
import {
  ERROR,
  INSTALLED,
  THEME_INSTALL,
  THEME_PREVIEW,
  THEME_RESET_PREVIEW,
  THEME_TYPE,
  UNINSTALLED,
} from 'disco/constants';
import { stubAddonManager, getFakeI18nInst } from 'tests/client/helpers';
import I18nProvider from 'core/i18n/Provider';

const result = {
  id: 'test-id',
  type: 'extension',
  heading: 'test-heading',
  slug: 'test-slug',
  description: 'test-editorial-description',
};

const store = createStore((s) => s, {installations: {}, addons: {}});

function renderAddon(data) {
  return findRenderedComponentWithType(renderIntoDocument(
    <I18nProvider i18n={getFakeI18nInst()}>
      <Provider store={store}>
        <Addon {...data} />
      </Provider>
    </I18nProvider>
  ), Addon).getWrappedInstance().getWrappedInstance();
}

describe('<Addon />', () => {
  describe('<Addon type="extension"/>', () => {
    let root;

    beforeEach(() => {
      stubAddonManager();
      root = renderAddon(result);
    });

    it('renders an error overlay', () => {
      const data = {...result, status: ERROR,
        errorMessage: 'this is an error', closeErrorAction: sinon.stub()};
      root = renderAddon(data);
      const error = findDOMNode(root).querySelector('.error');
      assert.equal(error.querySelector('p').textContent, 'this is an error',
                  'error message should be present');
      Simulate.click(error.querySelector('.close'));
      assert.ok(data.closeErrorAction.called, 'close link action should be called');
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
      stubAddonManager();
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
      stubAddonManager();
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
      stubAddonManager();
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
  });

  describe('makeProgressHandler', () => {
    it('sets the download progress on STATE_DOWNLOADING', () => {
      const dispatch = sinon.spy();
      const guid = 'foo@addon';
      const handler = makeProgressHandler(dispatch, guid);
      handler({state: 'STATE_DOWNLOADING', progress: 300, maxProgress: 990});
      assert(dispatch.calledWith({
        type: 'DOWNLOAD_PROGRESS',
        payload: {downloadProgress: 30, guid},
      }));
    });

    it('sets status to installing on STATE_INSTALLING', () => {
      const dispatch = sinon.spy();
      const guid = 'foo@my-addon';
      const handler = makeProgressHandler(dispatch, guid);
      handler({state: 'STATE_INSTALLING'});
      assert(dispatch.calledWith({
        type: 'START_INSTALL',
        payload: {guid},
      }));
    });

    it('sets status to installed on STATE_INSTALLED', () => {
      const dispatch = sinon.spy();
      const guid = '{my-addon}';
      const handler = makeProgressHandler(dispatch, guid);
      handler({state: 'STATE_INSTALLED'});
      assert(dispatch.calledWith({
        type: 'INSTALL_COMPLETE',
        payload: {guid},
      }));
    });
  });

  describe('setInitialStatus', () => {
    it('sets the status to INSTALLED when add-on found', () => {
      stubAddonManager();
      const dispatch = sinon.spy();
      const guid = '@foo';
      const installURL = 'http://the.url';
      const { setInitialStatus } = mapDispatchToProps(dispatch);
      return setInitialStatus({guid, installURL})
        .then(() => {
          assert(dispatch.calledWith({
            type: 'INSTALL_STATE',
            payload: {guid, status: INSTALLED, url: installURL},
          }));
        });
    });

    it('sets the status to INSTALLED when an installed theme is found', () => {
      stubAddonManager({getAddon: Promise.resolve({type: THEME_TYPE, isEnabled: true})});
      const dispatch = sinon.spy();
      const guid = '@foo';
      const installURL = 'http://the.url';
      const { setInitialStatus } = mapDispatchToProps(dispatch);
      return setInitialStatus({guid, installURL})
        .then(() => {
          assert(dispatch.calledWith({
            type: 'INSTALL_STATE',
            payload: {guid, status: INSTALLED, url: installURL},
          }));
        });
    });

    it('sets the status to UNINSTALLED when an uninstalled theme is found', () => {
      stubAddonManager({getAddon: Promise.resolve({type: THEME_TYPE, isEnabled: false})});
      const dispatch = sinon.spy();
      const guid = '@foo';
      const installURL = 'http://the.url';
      const { setInitialStatus } = mapDispatchToProps(dispatch);
      return setInitialStatus({guid, installURL})
        .then(() => {
          assert(dispatch.calledWith({
            type: 'INSTALL_STATE',
            payload: {guid, status: UNINSTALLED, url: installURL},
          }));
        });
    });

    it('sets the status to UNINSTALLED when not found', () => {
      stubAddonManager({getAddon: Promise.reject()});
      const dispatch = sinon.spy();
      const guid = '@foo';
      const installURL = 'http://the.url';
      const { setInitialStatus } = mapDispatchToProps(dispatch);
      return setInitialStatus({guid, installURL})
        .then(() => {
          assert(dispatch.calledWith({
            type: 'INSTALL_STATE',
            payload: {guid, status: UNINSTALLED, url: installURL},
          }));
        });
    });
  });

  describe('install', () => {
    const guid = '@install';
    const installURL = 'https://mysite.com/download.xpi';

    it('installs the addon on a new AddonManager', () => {
      stubAddonManager();
      const dispatch = sinon.spy();
      const { install } = mapDispatchToProps(dispatch);
      return install({guid, installURL})
        .then(() => {
          assert(addonManager.AddonManager.calledWithNew, 'new AddonManager() called');
          assert(addonManager.AddonManager.calledWith(guid, installURL, sinon.match.func));
        });
    });

    it('should dispatch START_DOWNLOAD', () => {
      stubAddonManager();
      const dispatch = sinon.spy();
      const { install } = mapDispatchToProps(dispatch);
      return install({guid, installURL})
        .then(() => assert(dispatch.calledWith({
          type: 'START_DOWNLOAD',
          payload: {guid},
        })));
    });
  });

  describe('uninstall', () => {
    const guid = '@uninstall';
    const installURL = 'https://mysite.com/download.xpi';

    it('prepares the addon on a new AddonManager', () => {
      stubAddonManager();
      const dispatch = sinon.spy();
      const { uninstall } = mapDispatchToProps(dispatch);
      return uninstall({guid, installURL})
        .then(() => {
          assert(addonManager.AddonManager.calledWithNew, 'new AddonManager() called');
          assert(addonManager.AddonManager.calledWith(guid, installURL));
        });
    });

    it('should dispatch START_UNINSTALL', () => {
      stubAddonManager();
      const dispatch = sinon.spy();
      const { uninstall } = mapDispatchToProps(dispatch);
      return uninstall({guid, installURL})
        .then(() => assert(dispatch.calledWith({
          type: 'START_UNINSTALL',
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
            type: 'INSTALL_STATE',
            payload: {guid, status: INSTALLED},
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
