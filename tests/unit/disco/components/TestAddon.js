import { shallow } from 'enzyme';
import React from 'react';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
  Simulate,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';

import I18nProvider from 'core/i18n/Provider';
import Addon, { AddonBase, mapStateToProps } from 'disco/components/Addon';
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
import createStore from 'disco/store';
import { getFakeI18nInst, signedInApiState } from 'tests/unit/helpers';

const result = {
  id: 'test-id',
  type: 'extension',
  heading: 'test-heading',
  slug: 'test-slug',
  description: 'test-editorial-description',
};

function renderAddon({ setCurrentStatus = sinon.stub(), ...props }) {
  const getBrowserThemeData = () => '{"theme":"data"}';
  const { store } = createStore({ api: signedInApiState });

  return findRenderedComponentWithType(renderIntoDocument(
    <Provider store={store}>
      <I18nProvider i18n={getFakeI18nInst()}>
        <Addon
          getBrowserThemeData={getBrowserThemeData}
          getClientCompatibility={() => ({ compatible: true, reason: null })}
          hasAddonManager
          setCurrentStatus={setCurrentStatus}
          {...props}
        />
      </I18nProvider>
    </Provider>
  ), Addon);
}

describe('<Addon />', () => {
  describe('<Addon type="extension"/>', () => {
    it('renders a default error overlay with no close link', () => {
      const data = { ...result, status: ERROR, setCurrentStatus: sinon.stub() };
      const root = renderAddon({ addon: data, ...data });
      const error = findDOMNode(root).querySelector('.notification.error');
      expect(error.querySelector('p').textContent).toEqual('An unexpected error occurred.');
      expect(error.querySelector('.close')).toEqual(null);
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
      expect(error.querySelector('p').textContent).toEqual('An unexpected error occurred.');
      expect(error.querySelector('.close')).toEqual(null);
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
      expect(error.querySelector('p').textContent).toEqual('An unexpected error occurred during installation.');
      expect(error.querySelector('.close')).toEqual(null);
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
      expect(error.querySelector('p').textContent).toEqual('An unexpected error occurred during uninstallation.');
      expect(error.querySelector('.close')).toEqual(null);
    });

    it('renders an install error overlay', () => {
      const data = {
        ...result, status: ERROR, error: INSTALL_FAILED, setCurrentStatus: sinon.stub(),
      };
      const root = renderAddon({ addon: data, ...data });
      const error = findDOMNode(root).querySelector('.notification.error');
      expect(error.querySelector('p').textContent).toEqual('Installation failed. Please try again.');
      Simulate.click(error.querySelector('.close'));
      expect(data.setCurrentStatus.called).toBeTruthy();
    });

    it('renders an error overlay', () => {
      const data = {
        ...result, status: ERROR, error: DOWNLOAD_FAILED, setCurrentStatus: sinon.stub(),
      };
      const root = renderAddon({ addon: data, ...data });
      const error = findDOMNode(root).querySelector('.notification.error');
      expect(error.querySelector('p').textContent).toEqual('Download failed. Please check your connection.');
      Simulate.click(error.querySelector('.close'));
      expect(data.setCurrentStatus.called).toBeTruthy();
    });

    it('does not normally render an error', () => {
      const root = renderAddon({ addon: result, ...result });
      expect(findDOMNode(root).querySelector('.notification.error')).toBeFalsy();
    });

    it('renders a default restart notification', () => {
      const data = { ...result, needsRestart: true };
      const root = renderAddon({ addon: data, ...data });
      const restart = findDOMNode(root).querySelector('.notification.restart');
      expect(restart.querySelector('p').textContent).toEqual('Please restart Firefox to use this add-on.');
    });

    it('renders a uninstallation restart notification', () => {
      const data = { ...result, needsRestart: true, status: UNINSTALLING };
      const root = renderAddon({ addon: data, ...data });
      const restart = findDOMNode(root).querySelector('.notification.restart');

      expect(restart.querySelector('p').textContent).toEqual(
        'This add-on will be uninstalled after you restart Firefox.');
    });

    it('does not normally render a restart notification', () => {
      const root = renderAddon({ addon: result, ...result });

      expect(findDOMNode(root).querySelector('.notification.restart'))
        .toBeFalsy();
    });

    it('renders the heading', () => {
      const root = renderAddon({ addon: result, ...result });

      expect(findDOMNode(root).querySelector('.heading').textContent)
        .toContain('test-heading');
    });

    it('renders the editorial description', () => {
      const root = renderAddon({ addon: result, ...result });

      expect(
        findDOMNode(root).querySelector('.editorial-description').textContent
      ).toContain('test-editorial-description');
    });

    it('purifies the heading', () => {
      const data = {
        ...result,
        heading: '<script>alert("hi")</script><em>Hey!</em> <i>This is <span>an add-on</span></i>',
      };
      const root = renderAddon({ addon: data, ...data });

      expect(findDOMNode(root).querySelector('.heading').innerHTML)
        .toContain('Hey! This is <span>an add-on</span>');
    });

    it('purifies the heading with a link and adds link attrs', () => {
      const data = {
        ...result,
        heading: 'This is <span>an <a href="https://addons.mozilla.org">add-on</a>/span>',
      };
      const root = renderAddon({ addon: data, ...data });
      const link = findDOMNode(root).querySelector('.heading a');

      expect(link.getAttribute('rel')).toEqual('noopener noreferrer');
      expect(link.getAttribute('target')).toEqual('_blank');
    });

    it('purifies the heading with a bad link', () => {
      const data = {
        ...result,
        heading: 'This is <span>an <a href="javascript:alert(1)">add-on</a>/span>',
      };
      const root = renderAddon({ addon: data, ...data });
      const link = findDOMNode(root).querySelector('.heading a');

      expect(link.getAttribute('href')).toEqual(null);
    });

    it('purifies the editorial description', () => {
      const data = {
        ...result,
        description: '<script>foo</script><blockquote>This is an add-on!</blockquote> ' +
                     '<i>Reviewed by <cite>a person</cite></i>',
      };
      const root = renderAddon({ addon: data, ...data });

      expect(
        findDOMNode(root).querySelector('.editorial-description').innerHTML
      ).toEqual(
        '<blockquote>This is an add-on!</blockquote> Reviewed by <cite>a person</cite>'
      );
    });

    it('does render a logo for an extension', () => {
      const root = renderAddon({ addon: result, ...result });

      expect(findDOMNode(root).querySelector('.logo')).toBeTruthy();
    });

    it("doesn't render a theme image for an extension", () => {
      const root = renderAddon({ addon: result, ...result });

      expect(findDOMNode(root).querySelector('.theme-image')).toEqual(null);
    });

    it('throws on invalid add-on type', () => {
      const root = renderAddon({ addon: result, ...result });
      expect(findDOMNode(root).querySelector('.heading').textContent)
        .toContain('test-heading');

      const data = { ...result, type: 'Whatever' };
      expect(() => {
        renderAddon({ addon: data, ...data });
      }).toThrowError('Invalid addon type');
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

      expect(fakeTracking.sendEvent.calledWith({
        action: TRACKING_TYPE_EXTENSION,
        category: CLICK_CATEGORY,
        label: 'foo',
      })).toBeTruthy();
    });

    it('disables incompatible add-ons', () => {
      const { store } = createStore();
      const root = renderAddon({
        addon: {
          ...result,
          current_version: {},
        },
        ...result,
        getClientCompatibility: () => ({
          compatible: false,
          maxVersion: '4000000.0',
          minVersion: '400000.0',
          reason: 'WHATEVER',
        }),
        store,
      });
      expect(
        findDOMNode(root).querySelector('.AddonCompatibilityError').textContent
      ).toEqual('This add-on does not support your browser.');
    });
  });


  describe('<Addon type="theme"/>', () => {
    let root;

    beforeEach(() => {
      const data = { ...result, type: ADDON_TYPE_THEME };
      root = renderAddon({ addon: data, ...data });
    });

    it('does render the theme image for a theme', () => {
      expect(findDOMNode(root).querySelector('.theme-image')).toBeTruthy();
    });

    it("doesn't render the logo for a theme", () => {
      expect(findDOMNode(root).querySelector('.logo')).toBeFalsy();
    });
  });


  describe('Theme Previews', () => {
    let root;
    let themeImage;
    let previewTheme;
    let resetThemePreview;

    beforeEach(() => {
      previewTheme = sinon.spy();
      resetThemePreview = sinon.spy();
      const data = {
        ...result,
        type: ADDON_TYPE_THEME,
        previewTheme,
        resetThemePreview,
      };
      root = renderAddon({ addon: data, ...data });
      themeImage = findDOMNode(root).querySelector('.theme-image');
    });

    it('runs theme preview onHoverIntent on theme image', () => {
      const hoverIntent = findRenderedComponentWithType(root, HoverIntent);
      hoverIntent.props.onHoverIntent({ currentTarget: themeImage });
      expect(previewTheme.calledWith(themeImage)).toBeTruthy();
    });

    it('resets theme preview onHoverIntentEnd on theme image', () => {
      const hoverIntent = findRenderedComponentWithType(root, HoverIntent);
      hoverIntent.props.onHoverIntentEnd({ currentTarget: themeImage });
      expect(resetThemePreview.calledWith(themeImage)).toBeTruthy();
    });

    it('runs theme preview onFocus on theme image', () => {
      Simulate.focus(themeImage);
      expect(previewTheme.calledWith(themeImage)).toBeTruthy();
    });

    it('resets theme preview onBlur on theme image', () => {
      Simulate.blur(themeImage);
      expect(resetThemePreview.calledWith(themeImage)).toBeTruthy();
    });

    it('calls installTheme on click', () => {
      const installTheme = sinon.stub();
      const props = {
        addon: result,
        clientApp: signedInApiState.clientApp,
        getBrowserThemeData: () => '{"theme":"data"}',
        getClientCompatibility: () => ({ compatible: true, reason: null }),
        hasAddonManager: true,
        i18n: getFakeI18nInst(),
        installTheme,
        setCurrentStatus: sinon.stub(),
        status: UNINSTALLED,
        type: ADDON_TYPE_THEME,
        userAgentInfo: signedInApiState.userAgentInfo,
      };
      const shallowRoot = shallow(<AddonBase {...props} />);
      themeImage = shallowRoot.find('.theme-image');

      const preventDefault = sinon.stub();
      const fakeEvent = { currentTarget: themeImage, preventDefault };
      themeImage.simulate('click', fakeEvent);

      sinon.assert.called(preventDefault);
      sinon.assert.calledWith(installTheme, themeImage, props.addon);
    });
  });

  describe('mapStateToProps', () => {
    it('pulls the installation data from the state', () => {
      const addon = {
        guid: 'foo@addon',
        downloadProgress: 75,
      };
      const props = mapStateToProps({
        api: signedInApiState,
        installations: { foo: { some: 'data' }, 'foo@addon': addon },
        addons: { 'foo@addon': { addonProp: 'addonValue' } },
      }, { guid: 'foo@addon' });
      expect(props).toEqual({
        addon: {
          addonProp: 'addonValue',
        },
        guid: 'foo@addon',
        downloadProgress: 75,
        addonProp: 'addonValue',
        clientApp: signedInApiState.clientApp,
        userAgentInfo: signedInApiState.userAgentInfo,
      });
    });

    it('handles missing data', () => {
      const props = mapStateToProps({
        api: signedInApiState,
        installations: {},
        addons: {},
      }, { guid: 'nope@addon' });

      expect(props).toEqual({
        addon: {},
        clientApp: null,
        userAgentInfo: signedInApiState.userAgentInfo,
      });
    });
  });
});
