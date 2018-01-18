import React from 'react';
import { oneLine } from 'common-tags';
import { shallow } from 'enzyme';

import { AddonBase, mapStateToProps } from 'disco/components/Addon';
import { setInstallState } from 'core/actions/installations';
import HoverIntent from 'core/components/HoverIntent';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  CLICK_CATEGORY,
  CLIENT_APP_FIREFOX,
  DOWNLOAD_FAILED,
  ENABLED,
  ERROR,
  FATAL_ERROR,
  FATAL_INSTALL_ERROR,
  FATAL_UNINSTALL_ERROR,
  INSTALL_FAILED,
  TRACKING_TYPE_EXTENSION,
  UNINSTALLED,
  UNINSTALLING,
} from 'core/constants';
import AddonCompatibilityError from 'disco/components/AddonCompatibilityError';
import { loadedAddons } from 'disco/containers/DiscoPane';
import createStore from 'disco/store';
import {
  createFakeEvent, fakeI18n, signedInApiState,
} from 'tests/unit/helpers';
import {
  dispatchClientMetadata, fakeInstalledAddon,
} from 'tests/unit/amo/helpers';
import {
  fakeDiscoAddon, loadDiscoResultsIntoState,
} from 'tests/unit/disco/helpers';
import LoadingText from 'ui/components/LoadingText';

function renderAddon(customProps = {}) {
  const props = {
    setCurrentStatus: sinon.stub(),
    getBrowserThemeData: () => '{"theme":"data"}',
    getClientCompatibility: () => ({ compatible: true, reason: null }),
    hasAddonManager: true,
    i18n: fakeI18n(),
    ...customProps,
  };
  return shallow(<AddonBase {...props} />);
}

describe(__filename, () => {
  let fakeEvent;
  const _state = loadDiscoResultsIntoState([{
    heading: 'test-heading',
    description: 'test-editorial-description',
    addon: {
      ...fakeDiscoAddon,
      id: 'test-id',
      type: ADDON_TYPE_EXTENSION,
      slug: 'test-slug',
    },
  }]);
  const result = loadedAddons(_state)[0];

  beforeEach(() => {
    fakeEvent = createFakeEvent();
  });

  it('renders okay without data', () => {
    const root = renderAddon({
      addon: undefined,
      description: undefined,
      heading: undefined,
      id: undefined,
      slug: undefined,
      type: undefined,
    });

    expect(root.find(LoadingText)).toHaveLength(1);
    expect(root.instance().props.installURLs).toEqual({});
  });

  describe('<Addon type="extension"/>', () => {
    it('renders a default error overlay with no close link', () => {
      const data = { ...result, status: ERROR, setCurrentStatus: sinon.stub() };
      const root = renderAddon({ addon: data, ...data });
      const error = root.find('.notification.error');
      expect(error.find('p').html())
        .toContain('An unexpected error occurred.');
      expect(error.find('.close')).toHaveLength(0);
    });

    it('renders a default error overlay with no close link for FATAL_ERROR', () => {
      const data = {
        ...result,
        status: ERROR,
        setCurrentStatus: sinon.stub(),
        error: FATAL_ERROR,
      };
      const root = renderAddon({ addon: data, ...data });
      const error = root.find('.notification.error');
      expect(error.find('p').html())
        .toContain('An unexpected error occurred.');
      expect(error.find('.close')).toHaveLength(0);
    });

    it('renders a specific overlay with no close link for FATAL_INSTALL_ERROR', () => {
      const data = {
        ...result,
        status: ERROR,
        setCurrentStatus: sinon.stub(),
        error: FATAL_INSTALL_ERROR,
      };
      const root = renderAddon({ addon: data, ...data });
      const error = root.find('.notification.error');
      expect(error.find('p').html())
        .toContain('An unexpected error occurred during installation.');
      expect(error.find('.close')).toHaveLength(0);
    });

    it('renders a specific overlay with no close link for FATAL_UNINSTALL_ERROR', () => {
      const data = {
        ...result,
        status: ERROR,
        setCurrentStatus: sinon.stub(),
        error: FATAL_UNINSTALL_ERROR,
      };
      const root = renderAddon({ addon: data, ...data });
      const error = root.find('.notification.error');
      expect(error.find('p').html())
        .toContain('An unexpected error occurred during uninstallation.');
      expect(error.find('.close')).toHaveLength(0);
    });

    it('renders an install error overlay', () => {
      const data = {
        ...result, status: ERROR, error: INSTALL_FAILED, setCurrentStatus: sinon.stub(),
      };
      const root = renderAddon({ addon: data, ...data });
      const error = root.find('.notification.error');
      expect(error.find('p').html())
        .toContain('Installation failed. Please try again.');
      error.find('.close').simulate('click', fakeEvent);
      sinon.assert.called(data.setCurrentStatus);
    });

    it('renders an error overlay', () => {
      const data = {
        ...result, status: ERROR, error: DOWNLOAD_FAILED, setCurrentStatus: sinon.stub(),
      };
      const root = renderAddon({ addon: data, ...data });
      const error = root.find('.notification.error');
      expect(error.find('p').html())
        .toContain('Download failed. Please check your connection.');
      error.find('.close').simulate('click', fakeEvent);
      sinon.assert.called(data.setCurrentStatus);
    });

    it('does not normally render an error', () => {
      const root = renderAddon({ addon: result, ...result });
      expect(root.find('.notification.error')).toHaveLength(0);
    });

    it('renders a default restart notification', () => {
      const data = { ...result, needsRestart: true };
      const root = renderAddon({ addon: data, ...data });
      const restartNotice = root.find('.notification.restart p');
      expect(restartNotice.html())
        .toContain('Please restart Firefox to use this add-on.');
    });

    it('renders a uninstallation restart notification', () => {
      const data = { ...result, needsRestart: true, status: UNINSTALLING };
      const root = renderAddon({ addon: data, ...data });
      const restartNotice = root.find('.notification.restart p');

      expect(restartNotice.html()).toContain(
        'This add-on will be uninstalled after you restart Firefox.');
    });

    it('does not normally render a restart notification', () => {
      const root = renderAddon({ addon: result, ...result });

      expect(root.find('.notification.restart')).toHaveLength(0);
    });

    it('renders the heading', () => {
      const root = renderAddon({ addon: result, ...result });

      expect(root.find('.heading').html()).toContain('test-heading');
    });

    it('renders the editorial description', () => {
      const root = renderAddon({ addon: result, ...result });

      expect(root.find('.editorial-description').html())
        .toContain('test-editorial-description');
    });

    it('purifies the heading', () => {
      const data = {
        ...result,
        heading: '<script>alert("hi")</script><em>Hey!</em> <i>This is <span>an add-on</span></i>',
      };
      const root = renderAddon({ addon: data, ...data });

      expect(root.find('.heading').html())
        .toContain('Hey! This is <span>an add-on</span>');
    });

    it('purifies the heading with a link and adds link attrs', () => {
      const data = {
        ...result,
        heading: 'This is <span>an <a href="https://addons.mozilla.org">add-on</a>/span>',
      };
      const root = renderAddon({ addon: data, ...data });
      const headingHtml = root.find('.heading').html();

      expect(headingHtml).toContain('rel="noopener noreferrer"');
      expect(headingHtml).toContain('target="_blank"');
    });

    it('purifies the heading with a bad link', () => {
      const data = {
        ...result,
        heading: 'This is <span>an <a href="javascript:alert(1)">add-on</a>/span>',
      };
      const root = renderAddon({ addon: data, ...data });
      const link = root.find('.heading');

      // Make sure there is an anchor tag.
      expect(link.html()).toContain('<a');
      // Make sure its href has been removed.
      expect(link.html()).not.toContain('href');
    });

    it('purifies the editorial description', () => {
      const data = {
        ...result,
        description: '<script>foo</script><blockquote>This is an add-on!</blockquote> ' +
                     '<i>Reviewed by <cite>a person</cite></i>',
      };
      const root = renderAddon({ addon: data, ...data });

      expect(root.find('.editorial-description').html()).toContain(
        '<blockquote>This is an add-on!</blockquote> Reviewed by <cite>a person</cite>'
      );
    });

    it('purifies an editorial description with a bad link', () => {
      const data = {
        ...result,
        description: 'This is a <a href="javascript:alert(1)">description</a>',
      };
      const root = renderAddon({ addon: data, ...data });
      expect(root.find('.editorial-description').html()).toContain(
        oneLine`<div class="editorial-description">This is a <a target="_blank"
          rel="noopener noreferrer">description</a></div>`
      );
    });

    it('allows links in the editorial description', () => {
      const data = {
        ...result,
        description: 'This is a <a href="https://mozilla.org/">description</a>',
      };
      const root = renderAddon({ addon: data, ...data });
      expect(root.find('.editorial-description').html()).toContain(
        oneLine`<div class="editorial-description">This is a <a
          href="https://mozilla.org/" target="_blank"
          rel="noopener noreferrer">description</a></div>`
      );
    });

    it('does render a logo for an extension', () => {
      const root = renderAddon({ addon: result, ...result });

      expect(root.find('.logo')).toHaveLength(1);
    });

    it("doesn't render a theme image for an extension", () => {
      const root = renderAddon({ addon: result, ...result });

      expect(root.find('.theme-image')).toHaveLength(0);
    });

    it('throws on invalid add-on type', () => {
      const root = renderAddon({ addon: result, ...result });
      expect(root.find('.heading').html()).toContain('test-heading');

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
      const heading = root.find('.heading');
      // We click the heading providing the link nodeName to emulate
      // bubbling.
      heading.simulate('click', createFakeEvent({
        target: { nodeName: 'A' },
      }));

      sinon.assert.calledWith(fakeTracking.sendEvent, {
        action: TRACKING_TYPE_EXTENSION,
        category: CLICK_CATEGORY,
        label: 'foo',
      });
    });

    it('disables incompatible add-ons', () => {
      const { store } = createStore();
      const minVersion = '400000.0';
      const reason = 'WHATEVER';
      const root = renderAddon({
        addon: {
          ...result,
          current_version: {},
        },
        ...result,
        getClientCompatibility: () => ({
          compatible: false,
          maxVersion: '4000000.0',
          minVersion,
          reason,
        }),
        store,
      });

      const compatError = root.find(AddonCompatibilityError);
      expect(compatError.prop('minVersion')).toEqual(minVersion);
      expect(compatError.prop('reason')).toEqual(reason);
    });
  });


  describe('<Addon type="theme"/>', () => {
    let root;

    beforeEach(() => {
      const data = { ...result, type: ADDON_TYPE_THEME };
      root = renderAddon({ addon: data, ...data });
    });

    it('does render the theme image for a theme', () => {
      expect(root.find('.theme-image')).toHaveLength(1);
    });

    it("doesn't render the logo for a theme", () => {
      expect(root.find('.logo')).toHaveLength(0);
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
      themeImage = root.find('.theme-image');
    });

    it('runs theme preview onHoverIntent on theme image', () => {
      const onHoverIntent = root.find(HoverIntent).prop('onHoverIntent');
      onHoverIntent({ currentTarget: fakeEvent.currentTarget });
      sinon.assert.calledWith(previewTheme, fakeEvent.currentTarget);
    });

    it('resets theme preview onHoverIntentEnd on theme image', () => {
      const onHoverIntentEnd = root.find(HoverIntent).prop('onHoverIntentEnd');
      onHoverIntentEnd({ currentTarget: fakeEvent.currentTarget });
      sinon.assert.calledWith(resetThemePreview, fakeEvent.currentTarget);
    });

    it('runs theme preview onFocus on theme image', () => {
      themeImage.simulate('focus', fakeEvent);
      sinon.assert.calledWith(previewTheme, fakeEvent.currentTarget);
    });

    it('resets theme preview onBlur on theme image', () => {
      themeImage.simulate('blur', fakeEvent);
      sinon.assert.calledWith(resetThemePreview, fakeEvent.currentTarget);
    });

    it('calls installTheme on click', () => {
      const installTheme = sinon.stub();
      const addon = result;
      const shallowRoot = renderAddon({
        addon,
        clientApp: signedInApiState.clientApp,
        installTheme,
        status: UNINSTALLED,
        type: ADDON_TYPE_THEME,
        userAgentInfo: signedInApiState.userAgentInfo,
      });
      themeImage = shallowRoot.find('.theme-image');

      themeImage.simulate('click', {
        ...fakeEvent,
        currentTarget: themeImage,
      });

      sinon.assert.called(fakeEvent.preventDefault);
      sinon.assert.calledWith(installTheme, themeImage, addon);
    });
  });

  describe('mapStateToProps', () => {
    let store;

    beforeEach(() => {
      store = createStore().store;
    });

    it('pulls the installation data from the state', () => {
      const clientApp = CLIENT_APP_FIREFOX;
      dispatchClientMetadata({ store, clientApp });

      const guid = 'foo@addon';
      const addonId = 5432111;

      const addon = {
        ...fakeDiscoAddon,
        guid,
        id: addonId,
      };
      loadDiscoResultsIntoState([{
        heading: 'Discovery Addon 1',
        description: 'informative text',
        addon,
      }], { store });

      store.dispatch(setInstallState({
        ...fakeInstalledAddon,
        status: ENABLED,
        guid,
      }));

      const props = mapStateToProps(
        store.getState(), { guid }
      );

      expect(props).toMatchObject({
        // Check that `addon` and its properties are spread.
        addon,
        id: addonId,
        // Check that the installed add-on properties are spread.
        status: ENABLED,
        // Check that client app is copied.
        clientApp,
      });

      const { userAgentInfo } = store.getState().api;
      // Do a quick check to make sure we grabbed a real object.
      expect(userAgentInfo).toBeTruthy();
      // Use equality to check this prop since toMatchObject will get
      // confused by the class instances in deep properties.
      expect(props.userAgentInfo).toEqual(userAgentInfo);
    });

    it('handles missing data', () => {
      const props = mapStateToProps(
        store.getState(), { guid: 'not-loaded-yet@addon' },
      );

      expect(props.addon).toEqual(null);
      expect(props.installURLs).toEqual({});
    });
  });
});
