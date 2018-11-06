import * as React from 'react';

import AddonInstallError from 'amo/components/AddonInstallError';
import AddonTitle from 'amo/components/AddonTitle';
import AddonCompatibilityError from 'amo/components/AddonCompatibilityError';
import GuidesAddonCard, {
  GuidesAddonCardBase,
} from 'amo/components/GuidesAddonCard';
import InstallButtonWrapper from 'amo/components/InstallButtonWrapper';
import { setInstallError, setInstallState } from 'core/actions/installations';
import { FATAL_ERROR, INSTALLING, UNKNOWN } from 'core/constants';
import { createInternalAddon, loadAddonResults } from 'core/reducers/addons';
import {
  createContextWithFakeRouter,
  createFakeLocation,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const _loadAddonResults = ({ addon = fakeAddon }) => {
    return loadAddonResults({ addons: [addon] });
  };

  const getProps = ({
    addon = createInternalAddon(fakeAddon),
    addonCustomText = 'Some text',
    hasAddonManager = true,
    i18n = fakeI18n(),
    location = createFakeLocation(),
    setCurrentStatus = sinon.spy(),
    store = dispatchClientMetadata().store,
    ...customProps
  } = {}) => {
    return {
      addon,
      addonCustomText,
      hasAddonManager,
      i18n,
      location,
      setCurrentStatus,
      status: UNKNOWN,
      store,
      ...customProps,
    };
  };

  const render = (customProps = {}) => {
    const allProps = getProps(customProps);

    return shallowUntilTarget(
      <GuidesAddonCard {...allProps} />,
      GuidesAddonCardBase,
      {
        shallowOptions: createContextWithFakeRouter(),
      },
    );
  };

  it('renders a GuidesAddonCard', () => {
    const { store } = dispatchClientMetadata();
    const iconURL = 'https://addons.cdn.mozilla.net/foo.jpg';
    const addonName = 'special-addon';
    const addonCustomText = 'Everyone needs this cool addon.';
    const addon = createInternalAddon({
      ...fakeAddon,
      icon_url: iconURL,
      name: addonName,
    });

    const root = render({
      addon,
      addonCustomText,
      store,
    });

    const image = root.find('.GuidesAddonCard-content-icon');
    expect(image).toHaveLength(1);
    expect(image.prop('src')).toEqual(iconURL);
    expect(image.prop('alt')).toEqual(addonName);

    expect(root.find('.GuidesAddonCard-content-description')).toHaveText(
      addonCustomText,
    );
    expect(root.find(AddonTitle)).toHaveLength(1);
    expect(root.find(InstallButtonWrapper)).toHaveLength(1);
  });

  // TODO: This will be updated when we address the following issue:
  // https://github.com/mozilla/addons-frontend/issues/6900.
  it('returns null when there is no addon', () => {
    const root = render({
      addon: null,
    });
    expect(root.html()).toEqual(null);
  });

  it('passes the addon to AddonCompatibilityError', () => {
    const addon = createInternalAddon(fakeAddon);
    const root = render({ addon });

    expect(root.find(AddonCompatibilityError)).toHaveProp('addon', addon);
  });

  it('renders Staff Pick content by default', () => {
    const root = render();
    expect(
      root.find('.GuidesAddonCard-content-header-staff-pick'),
    ).toHaveLength(1);
  });

  it('does not render Staff Pick content when staffPick prop is false', () => {
    const root = render({ staffPick: false });
    expect(
      root.find('.GuidesAddonCard-content-header-staff-pick'),
    ).toHaveLength(0);
  });

  it('passes the addon to AddonTitle', () => {
    const addon = createInternalAddon(fakeAddon);
    const root = render({ addon });

    expect(root.find(AddonTitle)).toHaveProp('addon', addon);
    expect(root.find(AddonTitle)).toHaveProp('linkToAddon', true);
  });

  it('passes the addon to InstallButtonWrapper', () => {
    const { store } = dispatchClientMetadata();
    const addon = createInternalAddon(fakeAddon);

    const root = render({ addon, store });

    expect(root.find(InstallButtonWrapper)).toHaveProp('addon', addon);
  });

  it('passes install helper functions to InstallButtonWrapper', () => {
    const { store } = dispatchClientMetadata();
    const enable = sinon.stub();
    const install = sinon.stub();
    const installTheme = sinon.stub();
    const uninstall = sinon.stub();

    const root = render({
      enable,
      install,
      installTheme,
      uninstall,
      store,
    });

    const installButton = root.find(InstallButtonWrapper);
    expect(installButton).toHaveProp('enable', enable);
    expect(installButton).toHaveProp('install', install);
    expect(installButton).toHaveProp('installTheme', installTheme);
    expect(installButton).toHaveProp('uninstall', uninstall);
  });

  it('renders an AddonInstallError component', () => {
    const root = render();

    expect(root.find(AddonInstallError)).toHaveLength(1);
  });

  it('passes an error to the AddonInstallError component', () => {
    const addon = fakeAddon;
    const { store } = dispatchClientMetadata();
    store.dispatch(_loadAddonResults({ addon }));
    // User clicks the install button.
    store.dispatch(
      setInstallState({
        guid: addon.guid,
        status: INSTALLING,
      }),
    );
    // An error has occurred in FF.
    const error = FATAL_ERROR;
    store.dispatch(setInstallError({ error, guid: addon.guid }));

    const root = render({ store });

    expect(root.find(AddonInstallError)).toHaveProp('error', error);
  });
});
