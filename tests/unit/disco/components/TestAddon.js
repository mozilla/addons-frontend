import * as React from 'react';
import { oneLine } from 'common-tags';
import { shallow } from 'enzyme';

import Addon, { AddonBase } from 'disco/components/Addon';
import { setInstallError, setInstallState } from 'core/actions/installations';
import InstallButton from 'core/components/InstallButton';
import AMInstallButton from 'core/components/AMInstallButton';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
  CLICK_CATEGORY,
  DOWNLOAD_FAILED,
  FATAL_ERROR,
  FATAL_INSTALL_ERROR,
  FATAL_UNINSTALL_ERROR,
  INSTALL_FAILED,
  TRACKING_TYPE_EXTENSION,
  INSTALLED,
  UNINSTALLED,
} from 'core/constants';
import { getErrorMessage } from 'core/utils/addons';
import {
  createInternalAddon,
  getAddonByID,
  getGuid,
} from 'core/reducers/addons';
import AddonCompatibilityError from 'disco/components/AddonCompatibilityError';
import createStore from 'disco/store';
import {
  createContextWithFakeRouter,
  createFakeEvent,
  createFakeTracking,
  fakeI18n,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import {
  createDiscoResult,
  loadDiscoResultsIntoState,
} from 'tests/unit/disco/helpers';
import LoadingText from 'ui/components/LoadingText';
import ThemeImage from 'ui/components/ThemeImage';

describe(__filename, () => {
  let fakeEvent;
  let store;

  function getProps({
    addonProps,
    description = 'test-editorial-description',
    heading = 'test-heading',
    ...customProps
  } = {}) {
    const addon = {
      id: 'test-id',
      type: ADDON_TYPE_EXTENSION,
      slug: 'test-slug',
      ...addonProps,
    };

    loadDiscoResultsIntoState(
      [createDiscoResult({ addon, description, heading })],
      { store },
    );

    const props = {
      _getClientCompatibility: () => ({ compatible: true, reason: null }),
      addonId: addon.id,
      description,
      heading,
      i18n: fakeI18n(),
      store,
      ...customProps,
    };

    return props;
  }

  const render = (props = {}) => {
    const allProps = getProps(props);

    return shallowUntilTarget(<Addon {...allProps} />, AddonBase, {
      shallowOptions: createContextWithFakeRouter(),
    });
  };

  beforeEach(() => {
    fakeEvent = createFakeEvent();
    store = createStore().store;
  });

  it('renders okay without data', () => {
    const root = render({
      addonId: undefined,
      description: undefined,
      heading: undefined,
    });

    expect(root.find(LoadingText)).toHaveLength(1);
  });

  it('passes install helper functions to the install button', () => {
    const enable = sinon.stub();
    const install = sinon.stub();
    const installTheme = sinon.stub();
    const uninstall = sinon.stub();

    const root = render({
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
      const addonProps = {
        guid: 'some-guid-with-error',
      };

      // We need an install state before we can dispatch `setInstallError`.
      store.dispatch(
        setInstallState({
          guid: addonProps.guid,
          error: INSTALLED,
        }),
      );

      store.dispatch(setInstallError({ guid: addonProps.guid }));

      const root = render({ addonProps });

      const error = root.find('.notification.error');
      expect(error.find('.close')).toHaveLength(0);
    });

    it('renders a default error overlay with no close link for FATAL_ERROR', () => {
      const addonProps = {
        guid: 'some-guid-with-error',
      };

      // We need an install state before we can dispatch `setInstallError`.
      store.dispatch(
        setInstallState({
          guid: addonProps.guid,
          error: INSTALLED,
        }),
      );

      store.dispatch(
        setInstallError({
          guid: addonProps.guid,
          error: FATAL_ERROR,
        }),
      );

      const root = render({ addonProps });

      const error = root.find('.notification.error');
      expect(error.find('.close')).toHaveLength(0);
    });

    it('renders a specific overlay with no close link for FATAL_INSTALL_ERROR', () => {
      const addonProps = {
        guid: 'some-guid-with-error',
      };
      const installError = FATAL_INSTALL_ERROR;

      // We need an install state before we can dispatch `setInstallError`.
      store.dispatch(
        setInstallState({
          guid: addonProps.guid,
          error: INSTALLED,
        }),
      );

      store.dispatch(
        setInstallError({
          guid: addonProps.guid,
          error: installError,
        }),
      );

      const root = render({ addonProps });

      const error = root.find('.notification.error');
      expect(error.find('p').html()).toContain(
        getErrorMessage({ i18n: fakeI18n(), error: installError }),
      );
      expect(error.find('.close')).toHaveLength(0);
    });

    it('renders a specific overlay with no close link for FATAL_UNINSTALL_ERROR', () => {
      const addonProps = {
        guid: 'some-guid-with-error',
      };

      // We need an install state before we can dispatch `setInstallError`.
      store.dispatch(
        setInstallState({
          guid: addonProps.guid,
          error: INSTALLED,
        }),
      );

      store.dispatch(
        setInstallError({
          guid: addonProps.guid,
          error: FATAL_UNINSTALL_ERROR,
        }),
      );

      const root = render({ addonProps });

      const error = root.find('.notification.error');
      expect(error.find('.close')).toHaveLength(0);
    });

    it('renders an install error overlay', () => {
      const addonProps = {
        guid: 'some-guid-with-error',
      };

      // We need an install state before we can dispatch `setInstallError`.
      store.dispatch(
        setInstallState({
          guid: addonProps.guid,
          error: UNINSTALLED,
        }),
      );

      store.dispatch(
        setInstallError({
          guid: addonProps.guid,
          error: INSTALL_FAILED,
        }),
      );

      const setCurrentStatus = sinon.stub();

      const root = render({ addonProps, setCurrentStatus });

      const error = root.find('.notification.error');
      error.find('.close').simulate('click', fakeEvent);

      sinon.assert.called(setCurrentStatus);
    });

    it('renders an error overlay', () => {
      const addonProps = {
        guid: 'some-guid-with-error',
      };

      // We need an install state before we can dispatch `setInstallError`.
      store.dispatch(
        setInstallState({
          guid: addonProps.guid,
          error: UNINSTALLED,
        }),
      );

      store.dispatch(
        setInstallError({
          guid: addonProps.guid,
          error: DOWNLOAD_FAILED,
        }),
      );

      const setCurrentStatus = sinon.stub();

      const root = render({ addonProps, setCurrentStatus });

      const error = root.find('.notification.error');
      error.find('.close').simulate('click', createFakeEvent());

      sinon.assert.called(setCurrentStatus);
    });

    it('does not normally render an error', () => {
      const root = render();

      expect(root.find('.notification.error')).toHaveLength(0);
    });

    it('renders the heading', () => {
      const heading = 'some heading';
      const root = render({ heading });

      expect(root.find('.heading').html()).toContain(heading);
    });

    it('renders the editorial description', () => {
      const description = 'some desc';
      const root = render({ description });

      expect(root.find('.editorial-description').html()).toContain(description);
    });

    it('purifies the heading', () => {
      const heading =
        '<script>alert("hi")</script><em>Hey!</em> <i>This is <span>an add-on</span></i>';

      const root = render({ heading });

      expect(root.find('.heading').html()).toContain(
        'Hey! This is <span>an add-on</span>',
      );
    });

    it('purifies the heading with a link and adds link attrs', () => {
      const heading =
        'This is <span>an <a href="https://addons.mozilla.org">add-on</a>/span>';

      const root = render({ heading });
      const headingHtml = root.find('.heading').html();

      expect(headingHtml).toContain('rel="noopener noreferrer"');
      expect(headingHtml).toContain('target="_blank"');
    });

    it('purifies the heading with a bad link', () => {
      const heading =
        'This is <span>an <a href="javascript:alert(1)">add-on</a>/span>';

      const root = render({ heading });
      const link = root.find('.heading');

      // Make sure there is an anchor tag.
      expect(link.html()).toContain('<a');
      // Make sure its href has been removed.
      expect(link.html()).not.toContain('href');
    });

    it('purifies the editorial description', () => {
      const description =
        '<script>foo</script><blockquote>This is an add-on!</blockquote> ' +
        '<i>Reviewed by <cite>a person</cite></i>';

      const root = render({ description });

      expect(root.find('.editorial-description').html()).toContain(
        '<blockquote>This is an add-on!</blockquote> Reviewed by <cite>a person</cite>',
      );
    });

    it('purifies an editorial description with a bad link', () => {
      const description =
        'This is a <a href="javascript:alert(1)">description</a>';

      const root = render({ description });

      expect(root.find('.editorial-description').html()).toContain(
        oneLine`<div class="editorial-description">This is a <a target="_blank"
          rel="noopener noreferrer">description</a></div>`,
      );
    });

    it('allows links in the editorial description', () => {
      const description =
        'This is a <a href="https://mozilla.org/">description</a>';

      const root = render({ description });

      expect(root.find('.editorial-description').html()).toContain(
        oneLine`<div class="editorial-description">This is a <a
          href="https://mozilla.org/" target="_blank"
          rel="noopener noreferrer">description</a></div>`,
      );
    });

    it('does render a logo for an extension', () => {
      const root = render({
        addonProps: {
          type: ADDON_TYPE_EXTENSION,
        },
      });

      expect(root.find('.logo')).toHaveLength(1);
    });

    it("doesn't render a theme image for an extension", () => {
      const root = render({
        addonProps: {
          type: ADDON_TYPE_EXTENSION,
        },
      });

      expect(root.find('.Addon-ThemeImage-link')).toHaveLength(0);
      expect(root.find(ThemeImage)).toHaveLength(0);
    });

    it('throws on invalid add-on type', () => {
      const addonProps = {
        type: 'Whatever',
      };

      expect(() => {
        render({ addonProps });
      }).toThrowError('Invalid addon type');
    });

    it('tracks an add-on link click', () => {
      const fakeTracking = createFakeTracking();
      const addonProps = {
        name: 'foo',
        type: ADDON_TYPE_EXTENSION,
      };

      const root = render({
        addonProps,
        heading:
          'This is <span>an <a href="https://addons.mozilla.org">add-on</a>/span>',
        _tracking: fakeTracking,
      });

      const heading = root.find('.heading');
      // We click the heading providing the link nodeName to emulate bubbling.
      heading.simulate(
        'click',
        createFakeEvent({
          target: { nodeName: 'A' },
        }),
      );

      sinon.assert.calledWith(fakeTracking.sendEvent, {
        action: TRACKING_TYPE_EXTENSION,
        category: CLICK_CATEGORY,
        label: addonProps.name,
      });
    });

    it('passes some props to the install button', () => {
      const { addonId, i18n, ...otherProps } = getProps();
      const defaultInstallSource = 'fake-discopane-source';

      const addon = getAddonByID(store.getState(), addonId);
      const allProps = {
        ...otherProps,
        addon,
        defaultInstallSource,
        i18n,
      };

      // We use shallow to be able to inject `defaultInstallSource` here.
      const root = shallow(<AddonBase {...allProps} />, { context: { i18n } });

      const button = root.find(InstallButton);

      expect(button).toHaveLength(1);
      expect(button).toHaveProp('addon', createInternalAddon(addon));
      expect(button).toHaveProp('className', 'Addon-install-button');
      expect(button).toHaveProp('defaultInstallSource', defaultInstallSource);
    });

    it('disables incompatible add-ons', () => {
      const reason = 'WHATEVER';

      const root = render({
        addonProps: {
          current_version: {},
        },
        _getClientCompatibility: () => ({
          compatible: false,
          maxVersion: '4000000.0',
          minVersion: '123',
          reason,
        }),
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
        root = render({ addonProps: { type } });
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
    const renderStaticTheme = ({ addonProps, ...otherProps } = {}) => {
      return render({
        addonProps: {
          type: ADDON_TYPE_STATIC_THEME,
          ...addonProps,
        },
        hasAddonManager: true,
        ...otherProps,
      });
    };

    it('renders a ThemeImage', () => {
      const root = renderStaticTheme();

      expect(root.find(ThemeImage)).toHaveLength(1);
    });

    it("calls install and enable helper functions when clicking on the static theme's header image", async () => {
      const addonProps = {
        guid: 'some-static-theme-guid',
      };

      store.dispatch(
        setInstallState({
          guid: addonProps.guid,
          status: UNINSTALLED,
        }),
      );

      const enable = sinon.spy();
      const install = sinon.spy();

      const root = renderStaticTheme({ addonProps, enable, install });

      const imageLink = root.find('.Addon-ThemeImage-link');

      const onClick = imageLink.prop('onClick');
      await onClick(createFakeEvent());

      sinon.assert.calledOnce(install);
      sinon.assert.calledOnce(enable);
    });

    it('does not call enable helper function when clicking header image if add-on is already enabled', async () => {
      const addonProps = {
        guid: 'some-static-theme-guid',
      };

      store.dispatch(
        setInstallState({
          guid: addonProps.guid,
          status: UNINSTALLED,
        }),
      );

      const enable = sinon.spy();
      const install = sinon.spy();

      const root = renderStaticTheme({
        addonProps,
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
      const root = renderStaticTheme({
        hasAddonManager: false,
      });

      expect(root.find('.Addon-ThemeImage-link')).toHaveLength(0);
    });

    it('does not call the install helper function when clicking header image if add-on is already installed', async () => {
      const addonProps = {
        guid: 'some-static-theme-guid',
      };

      store.dispatch(
        setInstallState({
          guid: addonProps.guid,
          status: INSTALLED,
        }),
      );

      const install = sinon.spy();

      const root = renderStaticTheme({ addonProps, install });

      const imageLink = root.find('.Addon-ThemeImage-link');

      const onClick = imageLink.prop('onClick');
      await onClick(createFakeEvent());

      sinon.assert.notCalled(install);
    });
  });

  describe('addon with type lightweight theme', () => {
    const renderLightweightTheme = ({ addonProps, ...otherProps } = {}) => {
      return render({
        addonProps: {
          type: ADDON_TYPE_THEME,
          ...addonProps,
        },
        ...otherProps,
      });
    };

    it('renders a ThemeImage', () => {
      const root = renderLightweightTheme();

      expect(root.find(ThemeImage)).toHaveLength(1);
    });

    it('makes the ThemeImage clickable when add-on manager is available', () => {
      const addonProps = {
        id: 'some-theme-id',
        name: 'some-theme-name',
        type: ADDON_TYPE_THEME,
      };

      store.dispatch(
        setInstallState({
          // We use this function because the GUID is changed for lightweight
          // themes (to mimic Firefox's internal behavior).
          guid: getGuid(addonProps),
          status: UNINSTALLED,
        }),
      );

      const installTheme = sinon.stub();

      const root = renderLightweightTheme({
        addonProps,
        hasAddonManager: true,
        installTheme,
      });

      expect(root.find(ThemeImage)).toHaveLength(1);

      const imageLink = root.find('.Addon-ThemeImage-link');
      expect(imageLink).toHaveLength(1);

      const event = createFakeEvent({ currentTarget: imageLink });
      imageLink.simulate('click', event);

      sinon.assert.called(event.preventDefault);
      sinon.assert.calledWith(installTheme, imageLink, {
        name: addonProps.name,
        status: UNINSTALLED,
        type: addonProps.type,
      });
    });

    it('does not render wrapper link around ThemeImage if hasAddonManager is false', () => {
      const root = renderLightweightTheme({ hasAddonManager: false });

      expect(root.find('.Addon-ThemeImage-link')).toHaveLength(0);
      expect(root.find(ThemeImage)).toHaveLength(1);
    });
  });

  describe('AMInstallButton', () => {
    const renderWithAMInstallButton = (props = {}) => {
      return render({
        _config: getFakeConfig({ enableFeatureAMInstallButton: true }),
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
