import * as React from 'react';
import { oneLine } from 'common-tags';
import { shallow } from 'enzyme';

import { AddonBase, mapStateToProps } from 'disco/components/Addon';
import { setInstallState } from 'core/actions/installations';
import InstallButton from 'core/components/InstallButton';
import AMInstallButton from 'core/components/AMInstallButton';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
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
  INSTALLED,
  UNINSTALLED,
} from 'core/constants';
import { getErrorMessage } from 'core/utils/addons';
import AddonCompatibilityError from 'disco/components/AddonCompatibilityError';
import { loadedAddons } from 'disco/pages/DiscoPane';
import createStore from 'disco/store';
import {
  createFakeEvent,
  createFakeTracking,
  fakeI18n,
  getFakeConfig,
  sampleUserAgentParsed,
} from 'tests/unit/helpers';
import {
  dispatchClientMetadata,
  fakeInstalledAddon,
} from 'tests/unit/amo/helpers';
import {
  fakeDiscoAddon,
  loadDiscoResultsIntoState,
} from 'tests/unit/disco/helpers';
import LoadingText from 'ui/components/LoadingText';
import ThemeImage from 'ui/components/ThemeImage';

function renderAddon(customProps = {}) {
  const props = {
    _getClientCompatibility: () => ({ compatible: true, reason: null }),
    clientApp: CLIENT_APP_FIREFOX,
    enable: sinon.stub(),
    getBrowserThemeData: () => '{"theme":"data"}',
    i18n: fakeI18n(),
    installTheme: sinon.stub(),
    setCurrentStatus: sinon.stub(),
    status: UNINSTALLED,
    uninstall: sinon.stub(),
    userAgentInfo: sampleUserAgentParsed,
    ...customProps,
  };
  return shallow(<AddonBase {...props} />);
}

describe(__filename, () => {
  let fakeEvent;
  const _state = loadDiscoResultsIntoState([
    {
      heading: 'test-heading',
      description: 'test-editorial-description',
      addon: {
        ...fakeDiscoAddon,
        id: 'test-id',
        type: ADDON_TYPE_EXTENSION,
        slug: 'test-slug',
      },
    },
  ]);
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
  });

  it('passes install helper functions to the install button', () => {
    const enable = sinon.stub();
    const install = sinon.stub();
    const installTheme = sinon.stub();
    const uninstall = sinon.stub();

    const root = renderAddon({
      addon: { ...result },
      enable,
      install,
      installTheme,
      uninstall,
    });

    const installButton = root.find(InstallButton);
    expect(installButton).toHaveProp('enable', enable);
    expect(installButton).toHaveProp('install', install);
    expect(installButton).toHaveProp('installTheme', installTheme);
    expect(installButton).toHaveProp('uninstall', uninstall);
  });

  describe('<Addon type="extension"/>', () => {
    it('renders a default error overlay with no close link', () => {
      const root = renderAddon({
        addon: result,
        status: ERROR,
      });
      const error = root.find('.notification.error');
      expect(error.find('.close')).toHaveLength(0);
    });

    it('renders a default error overlay with no close link for FATAL_ERROR', () => {
      const root = renderAddon({
        addon: result,
        status: ERROR,
        setCurrentStatus: sinon.stub(),
        error: FATAL_ERROR,
      });
      const error = root.find('.notification.error');
      expect(error.find('.close')).toHaveLength(0);
    });

    it('renders a specific overlay with no close link for FATAL_INSTALL_ERROR', () => {
      const installError = FATAL_INSTALL_ERROR;
      const root = renderAddon({
        addon: result,
        status: ERROR,
        setCurrentStatus: sinon.stub(),
        error: installError,
      });
      const error = root.find('.notification.error');
      expect(error.find('p').html()).toContain(
        getErrorMessage({ i18n: fakeI18n(), error: installError }),
      );
      expect(error.find('.close')).toHaveLength(0);
    });

    it('renders a specific overlay with no close link for FATAL_UNINSTALL_ERROR', () => {
      const root = renderAddon({
        addon: result,
        status: ERROR,
        setCurrentStatus: sinon.stub(),
        error: FATAL_UNINSTALL_ERROR,
      });
      const error = root.find('.notification.error');
      expect(error.find('.close')).toHaveLength(0);
    });

    it('renders an install error overlay', () => {
      const setCurrentStatus = sinon.stub();
      const root = renderAddon({
        addon: result,
        status: ERROR,
        error: INSTALL_FAILED,
        setCurrentStatus,
      });
      const error = root.find('.notification.error');
      error.find('.close').simulate('click', fakeEvent);
      sinon.assert.called(setCurrentStatus);
    });

    it('renders an error overlay', () => {
      const setCurrentStatus = sinon.stub();
      const root = renderAddon({
        addon: result,
        status: ERROR,
        error: DOWNLOAD_FAILED,
        setCurrentStatus,
      });
      const error = root.find('.notification.error');
      error.find('.close').simulate('click', fakeEvent);
      sinon.assert.called(setCurrentStatus);
    });

    it('does not normally render an error', () => {
      const root = renderAddon({ addon: result });
      expect(root.find('.notification.error')).toHaveLength(0);
    });

    it('renders the heading', () => {
      const { heading, ...addon } = result;
      const root = renderAddon({ addon, heading });

      expect(root.find('.heading').html()).toContain(heading);
    });

    it('renders the editorial description', () => {
      const root = renderAddon({ addon: result });

      expect(root.find('.editorial-description').html()).toContain(
        'test-editorial-description',
      );
    });

    it('purifies the heading', () => {
      const heading =
        '<script>alert("hi")</script><em>Hey!</em> <i>This is <span>an add-on</span></i>';

      const root = renderAddon({ addon: result, heading });

      expect(root.find('.heading').html()).toContain(
        'Hey! This is <span>an add-on</span>',
      );
    });

    it('purifies the heading with a link and adds link attrs', () => {
      const heading =
        'This is <span>an <a href="https://addons.mozilla.org">add-on</a>/span>';

      const root = renderAddon({ addon: result, heading });
      const headingHtml = root.find('.heading').html();

      expect(headingHtml).toContain('rel="noopener noreferrer"');
      expect(headingHtml).toContain('target="_blank"');
    });

    it('purifies the heading with a bad link', () => {
      const heading =
        'This is <span>an <a href="javascript:alert(1)">add-on</a>/span>';

      const root = renderAddon({ addon: result, heading });
      const link = root.find('.heading');

      // Make sure there is an anchor tag.
      expect(link.html()).toContain('<a');
      // Make sure its href has been removed.
      expect(link.html()).not.toContain('href');
    });

    it('purifies the editorial description', () => {
      const data = {
        ...result,
        description:
          '<script>foo</script><blockquote>This is an add-on!</blockquote> ' +
          '<i>Reviewed by <cite>a person</cite></i>',
      };
      const root = renderAddon({ addon: data });

      expect(root.find('.editorial-description').html()).toContain(
        '<blockquote>This is an add-on!</blockquote> Reviewed by <cite>a person</cite>',
      );
    });

    it('purifies an editorial description with a bad link', () => {
      const data = {
        ...result,
        description: 'This is a <a href="javascript:alert(1)">description</a>',
      };
      const root = renderAddon({ addon: data });
      expect(root.find('.editorial-description').html()).toContain(
        oneLine`<div class="editorial-description">This is a <a target="_blank"
          rel="noopener noreferrer">description</a></div>`,
      );
    });

    it('allows links in the editorial description', () => {
      const data = {
        ...result,
        description: 'This is a <a href="https://mozilla.org/">description</a>',
      };
      const root = renderAddon({ addon: data });
      expect(root.find('.editorial-description').html()).toContain(
        oneLine`<div class="editorial-description">This is a <a
          href="https://mozilla.org/" target="_blank"
          rel="noopener noreferrer">description</a></div>`,
      );
    });

    it('does render a logo for an extension', () => {
      const { heading, ...addon } = result;
      const root = renderAddon({ addon });

      expect(root.find('.logo')).toHaveLength(1);
    });

    it("doesn't render a theme image for an extension", () => {
      const { heading, ...addon } = result;
      const root = renderAddon({ addon });

      expect(root.find('.Addon-ThemeImage-link')).toHaveLength(0);
      expect(root.find(ThemeImage)).toHaveLength(0);
    });

    it('throws on invalid add-on type', () => {
      const { heading, ...addon } = result;
      const root = renderAddon({ addon, heading });

      expect(root.find('.heading').html()).toContain('test-heading');

      const data = { ...result, type: 'Whatever' };
      expect(() => {
        renderAddon({ addon: data });
      }).toThrowError('Invalid addon type');
    });

    it('tracks an add-on link click', () => {
      const fakeTracking = createFakeTracking();
      const addon = {
        ...result,
        name: 'foo',
        type: ADDON_TYPE_EXTENSION,
      };
      const root = renderAddon({
        addon,
        heading:
          'This is <span>an <a href="https://addons.mozilla.org">add-on</a>/span>',
        _tracking: fakeTracking,
      });
      const heading = root.find('.heading');
      // We click the heading providing the link nodeName to emulate
      // bubbling.
      heading.simulate(
        'click',
        createFakeEvent({
          target: { nodeName: 'A' },
        }),
      );

      sinon.assert.calledWith(fakeTracking.sendEvent, {
        action: TRACKING_TYPE_EXTENSION,
        category: CLICK_CATEGORY,
        label: addon.name,
      });
    });

    it('passes a defaultInstallSource to the install button', () => {
      const defaultInstallSource = 'fake-discopane-source';
      const addon = {
        ...result,
        type: ADDON_TYPE_EXTENSION,
      };
      const root = renderAddon({
        addon,
        ...addon,
        defaultInstallSource,
      });

      const button = root.find(InstallButton);
      expect(button).toHaveLength(1);
      expect(button).toHaveProp('addon', result.addon);
      expect(button).toHaveProp('className', 'Addon-install-button');
      expect(button).toHaveProp('defaultInstallSource', defaultInstallSource);
    });

    it('disables incompatible add-ons', () => {
      const { store } = createStore();
      const reason = 'WHATEVER';
      const root = renderAddon({
        addon: {
          ...result,
          current_version: {},
        },
        ...result,
        _getClientCompatibility: () => ({
          compatible: false,
          maxVersion: '4000000.0',
          minVersion: '123',
          reason,
        }),
        store,
      });

      const compatError = root.find(AddonCompatibilityError);
      expect(compatError.prop('reason')).toEqual(reason);
    });
  });

  describe.each([ADDON_TYPE_THEME, ADDON_TYPE_STATIC_THEME])(
    `Addon with type = %s`,
    async (type) => {
      let root;

      beforeEach(() => {
        const data = { ...result, type };
        root = renderAddon({ addon: data });
      });

      it("doesn't render the logo", () => {
        expect(root.find('.logo')).toHaveLength(0);
      });

      it("doesn't render the description", () => {
        expect(root.find('.editorial-description')).toHaveLength(0);
      });
    },
  );

  describe('addon with type static theme', () => {
    const renderWithStaticTheme = (props = {}) => {
      return renderAddon({
        addon: {
          ...fakeDiscoAddon,
          type: ADDON_TYPE_STATIC_THEME,
        },
        enable: sinon.stub(),
        hasAddonManager: true,
        install: sinon.stub(),
        isAddonEnabled: sinon.stub().resolves(false),
        status: UNINSTALLED,
        ...props,
      });
    };

    it('renders a ThemeImage', () => {
      const root = renderWithStaticTheme();

      expect(root.find(ThemeImage)).toHaveLength(1);
    });

    it("calls install and enable helper functions when clicking on the static theme's header image if hasAddonManager is true", async () => {
      const enable = sinon.spy();
      const install = sinon.spy();

      const root = renderWithStaticTheme({ enable, install });

      const imageLink = root.find('.Addon-ThemeImage-link');

      const onClick = imageLink.prop('onClick');
      await onClick(createFakeEvent());

      sinon.assert.calledOnce(install);
      sinon.assert.calledOnce(enable);
    });

    it('does not call enable helper function when clicking header image if add-on is already enabled', async () => {
      const enable = sinon.spy();
      const install = sinon.spy();

      const root = renderWithStaticTheme({
        enable,
        install,
        isAddonEnabled: sinon.stub().resolves(true),
      });

      const imageLink = root.find('.Addon-ThemeImage-link');

      const onClick = imageLink.prop('onClick');
      await onClick(createFakeEvent());

      sinon.assert.called(install);
      sinon.assert.notCalled(enable);
    });

    it('does not render wrapper link around ThemeImage if hasAddonManager is false', async () => {
      const enable = sinon.spy();
      const install = sinon.spy();

      const root = renderWithStaticTheme({
        enable,
        install,
        hasAddonManager: false,
      });

      expect(root.find('.Addon-ThemeImage-link')).toHaveLength(0);
    });

    it('does not call the install helper function when clicking header image if add-on is already installed', async () => {
      const enable = sinon.spy();
      const install = sinon.spy();

      const root = renderWithStaticTheme({
        enable,
        install,
        status: INSTALLED,
      });

      const imageLink = root.find('.Addon-ThemeImage-link');

      const onClick = imageLink.prop('onClick');
      await onClick(createFakeEvent());

      sinon.assert.notCalled(install);
    });
  });

  describe('addon with type lightweight theme', () => {
    const renderWithLightweightTheme = (props = {}) => {
      const addon = {
        ...result,
        type: ADDON_TYPE_THEME,
        previews: [],
      };

      return renderAddon({ addon, ...props });
    };

    it('renders a ThemeImage', () => {
      const root = renderWithLightweightTheme();

      expect(root.find(ThemeImage)).toHaveLength(1);
    });

    it('makes the ThemeImage clickable when add-on manager is available', () => {
      const addon = {
        ...result,
        type: ADDON_TYPE_THEME,
        previews: [],
      };
      const installTheme = sinon.stub();

      const root = renderWithLightweightTheme({
        addon,
        hasAddonManager: true,
        installTheme,
        status: UNINSTALLED,
      });

      expect(root.find(ThemeImage)).toHaveLength(1);

      const imageLink = root.find('.Addon-ThemeImage-link');
      expect(imageLink).toHaveLength(1);

      imageLink.simulate('click', {
        ...fakeEvent,
        currentTarget: imageLink,
      });

      sinon.assert.called(fakeEvent.preventDefault);
      sinon.assert.calledWith(installTheme, imageLink, {
        name: addon.name,
        status: UNINSTALLED,
        type: addon.type,
      });
    });

    it('does not render wrapper link around ThemeImage if hasAddonManager is false', () => {
      const root = renderWithLightweightTheme({ hasAddonManager: false });

      expect(root.find('.Addon-ThemeImage-link')).toHaveLength(0);
      expect(root.find(ThemeImage)).toHaveLength(1);
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

      store.dispatch(
        setInstallState({
          ...fakeInstalledAddon,
          status: ENABLED,
          guid,
        }),
      );

      const props = mapStateToProps(store.getState(), { addon });

      expect(props).toMatchObject({
        clientApp,
        status: ENABLED,
      });

      const { userAgentInfo } = store.getState().api;
      // Do a quick check to make sure we grabbed a real object.
      expect(userAgentInfo).toBeTruthy();
      // Use equality to check this prop since toMatchObject will get
      // confused by the class instances in deep properties.
      expect(props.userAgentInfo).toEqual(userAgentInfo);
    });
  });

  describe('AMInstallButton', () => {
    const renderWithAMInstallButton = (props = {}) => {
      return renderAddon({
        _config: getFakeConfig({ enableAMInstallButton: true }),
        addon: { ...result },
        hasAddonManager: true,
        ...props,
      });
    };

    it('renders the AMInstallButton when config allows it', () => {
      const root = renderWithAMInstallButton();

      expect(root.find(InstallButton)).toHaveLength(0);
      expect(root.find(AMInstallButton)).toHaveLength(1);
      expect(root.find(AMInstallButton)).toHaveProp('puffy', false);
      expect(root.find(AMInstallButton)).toHaveProp('hasAddonManager', true);
    });

    it('passes install helper functions to the install button', () => {
      const enable = sinon.stub();
      const install = sinon.stub();
      const installTheme = sinon.stub();
      const uninstall = sinon.stub();

      const root = renderWithAMInstallButton({
        enable,
        install,
        installTheme,
        uninstall,
      });

      const installButton = root.find(AMInstallButton);
      expect(installButton).toHaveProp('enable', enable);
      expect(installButton).toHaveProp('install', install);
      expect(installButton).toHaveProp('installTheme', installTheme);
      expect(installButton).toHaveProp('uninstall', uninstall);
    });
  });
});
