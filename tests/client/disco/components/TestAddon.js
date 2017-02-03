import React from 'react';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
  Simulate,
} from 'react-addons-test-utils';
import {
  findDOMNode,
} from 'react-dom';

import translate from 'core/i18n/translate';
import {
  AddonBase,
  mapStateToProps,
} from 'disco/components/Addon';
import HoverIntent from 'core/components/HoverIntent';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  CLICK_CATEGORY,
  DOWNLOAD_FAILED,
  ERROR,
  FATAL_ERROR,
  FATAL_INSTALL_ERROR,
  FATAL_UNINSTALL_ERROR,
  INSTALL_FAILED,
  TRACKING_TYPE_EXTENSION,
  UNINSTALLED,
  UNINSTALLING,
} from 'core/constants';
import { getFakeI18nInst }
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
  const getBrowserThemeData = () => '{"theme":"data"}';

  return findRenderedComponentWithType(renderIntoDocument(
    <MyAddon
      getBrowserThemeData={getBrowserThemeData} i18n={getFakeI18nInst()} {...props}
      setCurrentStatus={setCurrentStatus} hasAddonManager />
  ), MyAddon).getWrappedInstance();
}

describe('<Addon />', () => {
  describe('<Addon type="extension"/>', () => {
    it('renders a default error overlay with no close link', () => {
      const data = { ...result, status: ERROR, setCurrentStatus: sinon.stub() };
      const root = renderAddon({ addon: data, ...data });
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
      const root = renderAddon({ addon: data, ...data });
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
      const root = renderAddon({ addon: data, ...data });
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
      const root = renderAddon({ addon: data, ...data });
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
      const root = renderAddon({ addon: data, ...data });
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
      const root = renderAddon({ addon: data, ...data });
      const error = findDOMNode(root).querySelector('.notification.error');
      assert.equal(
        error.querySelector('p').textContent,
        'Download failed. Please check your connection.',
        'error message should be present');
      Simulate.click(error.querySelector('.close'));
      assert.ok(data.setCurrentStatus.called, 'setCurrentStatus should be called');
    });

    it('does not normally render an error', () => {
      const root = renderAddon({ addon: result, ...result });
      assert.notOk(findDOMNode(root).querySelector('.notification.error'));
    });

    it('renders a default restart notification', () => {
      const data = { ...result, needsRestart: true };
      const root = renderAddon({ addon: data, ...data });
      const restart = findDOMNode(root).querySelector('.notification.restart');
      assert.equal(
        restart.querySelector('p').textContent,
        'Please restart Firefox to use this add-on.',
        'restart message should be present');
    });

    it('renders a uninstallation restart notification', () => {
      const data = { ...result, needsRestart: true, status: UNINSTALLING };
      const root = renderAddon({ addon: data, ...data });
      const restart = findDOMNode(root).querySelector('.notification.restart');
      assert.equal(
        restart.querySelector('p').textContent,
        'This add-on will be uninstalled after you restart Firefox.',
        'restart uninstallation message should be present');
    });

    it('does not normally render a restart notification', () => {
      const root = renderAddon({ addon: result, ...result });
      assert.notOk(findDOMNode(root).querySelector('.notification.restart'));
    });

    it('renders the heading', () => {
      const root = renderAddon({ addon: result, ...result });
      assert.include(root.heading.textContent, 'test-heading');
    });

    it('renders the editorial description', () => {
      const root = renderAddon({ addon: result, ...result });
      assert.equal(root.editorialDescription.textContent, 'test-editorial-description');
    });

    it('purifies the heading', () => {
      const data = {
        ...result,
        heading: '<script>alert("hi")</script><em>Hey!</em> <i>This is <span>an add-on</span></i>',
      };
      const root = renderAddon({ addon: data, ...data });
      assert.include(root.heading.innerHTML, 'Hey! This is <span>an add-on</span>');
    });

    it('purifies the heading with a link and adds link attrs', () => {
      const data = {
        ...result,
        heading: 'This is <span>an <a href="https://addons.mozilla.org">add-on</a>/span>',
      };
      const root = renderAddon({ addon: data, ...data });
      const link = root.heading.querySelector('a');
      assert.equal(link.getAttribute('rel'), 'noopener noreferrer');
      assert.equal(link.getAttribute('target'), '_blank');
    });

    it('purifies the heading with a bad link', () => {
      const data = {
        ...result,
        heading: 'This is <span>an <a href="javascript:alert(1)">add-on</a>/span>',
      };
      const root = renderAddon({ addon: data, ...data });
      const link = root.heading.querySelector('a');
      assert.equal(link.getAttribute('href'), null);
    });

    it('purifies the editorial description', () => {
      const data = {
        ...result,
        description: '<script>foo</script><blockquote>This is an add-on!</blockquote> ' +
                     '<i>Reviewed by <cite>a person</cite></i>',
      };
      const root = renderAddon({ addon: data, ...data });
      assert.equal(
        root.editorialDescription.innerHTML,
        '<blockquote>This is an add-on!</blockquote> Reviewed by <cite>a person</cite>');
    });

    it('does render a logo for an extension', () => {
      const root = renderAddon({ addon: result, ...result });
      assert.ok(findDOMNode(root).querySelector('.logo'));
    });

    it("doesn't render a theme image for an extension", () => {
      const root = renderAddon({ addon: result, ...result });
      assert.equal(findDOMNode(root).querySelector('.theme-image'), null);
    });

    it('throws on invalid add-on type', () => {
      const root = renderAddon({ addon: result, ...result });
      assert.include(root.heading.textContent, 'test-heading');
      const data = { ...result, type: 'Whatever' };
      assert.throws(() => {
        renderAddon({ addon: data, ...data });
      }, Error, 'Invalid addon type');
    });

    it('tracks an add-on link click', () => {
      const fakeTracking = {
        sendEvent: sinon.stub(),
      };
      const data = {
        ...result,
        _tracking: fakeTracking,
        name: 'foo',
        heading: 'This is <span>an <a href="https://addons.mozilla.org">add-on</a>/span>',
        type: ADDON_TYPE_EXTENSION,
      };
      const root = renderAddon({ addon: data, ...data });
      const heading = findDOMNode(root).querySelector('.heading');
      // We click the heading providing the link nodeName to emulate
      // bubbling.
      Simulate.click(heading, { target: { nodeName: 'A' } });
      assert.ok(fakeTracking.sendEvent.calledWith({
        action: TRACKING_TYPE_EXTENSION,
        category: CLICK_CATEGORY,
        label: 'foo',
      }), sinon.format(fakeTracking.sendEvent.firstCall.args));
    });
  });


  describe('<Addon type="theme"/>', () => {
    let root;

    beforeEach(() => {
      const data = { ...result, type: ADDON_TYPE_THEME };
      root = renderAddon({ addon: data, ...data });
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
    let previewTheme;
    let resetPreviewTheme;

    beforeEach(() => {
      previewTheme = sinon.spy();
      resetPreviewTheme = sinon.spy();
      const data = {
        ...result,
        type: ADDON_TYPE_THEME,
        previewTheme,
        resetPreviewTheme,
      };
      root = renderAddon({ addon: data, ...data });
      themeImage = findDOMNode(root).querySelector('.theme-image');
    });

    it('runs theme preview onHoverIntent on theme image', () => {
      const hoverIntent = findRenderedComponentWithType(root, HoverIntent);
      hoverIntent.props.onHoverIntent({ currentTarget: themeImage });
      assert.ok(previewTheme.calledWith(themeImage));
    });

    it('resets theme preview onHoverIntentEnd on theme image', () => {
      const hoverIntent = findRenderedComponentWithType(root, HoverIntent);
      hoverIntent.props.onHoverIntentEnd({ currentTarget: themeImage });
      assert.ok(resetPreviewTheme.calledWith(themeImage));
    });

    it('runs theme preview onFocus on theme image', () => {
      Simulate.focus(themeImage);
      assert.ok(previewTheme.calledWith(themeImage));
    });

    it('resets theme preview onBlur on theme image', () => {
      Simulate.blur(themeImage);
      assert.ok(resetPreviewTheme.calledWith(themeImage));
    });

    it('calls installTheme on click', () => {
      const installTheme = sinon.stub();
      const data = {
        ...result,
        addon: sinon.stub(),
        type: ADDON_TYPE_THEME,
        status: UNINSTALLED,
        installTheme,
      };
      root = renderAddon(data);
      themeImage = findDOMNode(root).querySelector('.theme-image');
      const preventDefault = sinon.spy();
      Simulate.click(themeImage, { preventDefault });
      assert.ok(preventDefault.called);
      assert.ok(installTheme.calledWith(themeImage, data.addon));
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
        addon: {
          addonProp: 'addonValue',
        },
        guid: 'foo@addon',
        downloadProgress: 75,
        addonProp: 'addonValue',
      });
    });

    it('handles missing data', () => {
      const props = mapStateToProps({
        installations: {},
        addons: {},
      }, { guid: 'nope@addon' });
      assert.deepEqual(props, { addon: {} });
    });
  });
});
