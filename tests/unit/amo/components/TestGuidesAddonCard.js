import * as React from 'react';

import GuidesAddonCard, {
  GuidesAddonCardBase,
} from 'amo/components/GuidesAddonCard';
import AddonTitle from 'amo/components/AddonTitle';
import AMInstallButton from 'core/components/AMInstallButton';
import AddonCompatibilityError from 'amo/components/AddonCompatibilityError';
import {
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import {
  FATAL_ERROR,
  INCOMPATIBLE_NOT_FIREFOX,
  INCOMPATIBLE_UNDER_MIN_VERSION,
  INSTALLING,
  UNKNOWN,
} from 'core/constants';
import { setInstallError, setInstallState } from 'core/actions/installations';
import { getErrorMessage } from 'core/utils/addons';
import { createInternalAddon, loadAddonResults } from 'core/reducers/addons';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const _loadAddonResults = (addon = createInternalAddon(fakeAddon)) => {
    store.dispatch(
      loadAddonResults({
        addons: [addon],
      }),
    );
  };

  const render = ({
    addon = createInternalAddon(fakeAddon),
    addonGuid = addon.guid,
    addonCustomText = 'Some text',
    i18n = fakeI18n(),
    setCurrentStatus = sinon.spy(),
    ...customProps
  } = {}) => {
    const allProps = {
      addon,
      addonGuid,
      addonCustomText,
      setCurrentStatus,
      i18n,
      status: UNKNOWN,
      store,
      ...customProps,
    };

    if (addon) {
      _loadAddonResults(addon);
    }

    return shallowUntilTarget(
      <GuidesAddonCard {...allProps} />,
      GuidesAddonCardBase,
    );
  };

  it('renders a GuidesAddonCard', () => {
    const iconURL = 'https://addons.cdn.mozilla.net/foo.jpg';
    const addonName = 'special-addon';
    const addonCustomText = 'Everyone needs this cool addon.';
    const addon = createInternalAddon({
      ...fakeAddon,
      icon_url: iconURL,
      name: addonName,
    });

    const root = render({
      _getClientCompatibility: sinon.stub().returns({
        compatible: true,
        reason: null,
      }),
      addon,
      addonGuid: addon.guid,
      addonCustomText,
    });

    const image = root.find('.GuidesAddonCard-content-icon');
    expect(image).toHaveLength(1);
    expect(image.prop('src')).toEqual(iconURL);
    expect(image.prop('alt')).toEqual(addonName);

    expect(root.find('.GuidesAddonCard-content-description')).toHaveText(
      addonCustomText,
    );
    expect(root.find(AddonTitle)).toHaveLength(1);
    expect(root.find(AMInstallButton)).toHaveLength(1);
    expect(root.find(AddonCompatibilityError)).toHaveLength(0);
  });

  it('returns null when there is no addon', () => {
    const root = render({
      addon: null,
      addonGuid: null,
    });
    expect(root.html()).toEqual(null);
  });

  it('renders AddonCompatibilityError when there is incompatibility', () => {
    const root = render({
      _getClientCompatibility: sinon.stub().returns({
        compatible: false,
        reason: INCOMPATIBLE_UNDER_MIN_VERSION,
      }),
    });

    expect(root.find(AddonCompatibilityError)).toHaveLength(1);
  });

  it('renders STAFF PICK content by default', () => {
    const root = render();
    expect(
      root.find('.GuidesAddonCard-content-header-staff-pick'),
    ).toHaveLength(1);
  });

  it('does not renders STAFF PICK content when staffPick prop is false', () => {
    const root = render({ staffPick: false });
    expect(
      root.find('.GuidesAddonCard-content-header-staff-pick'),
    ).toHaveLength(0);
  });

  it('passes the addon to the InstallButton', () => {
    const addon = createInternalAddon(fakeAddon);
    const root = render({ addon, hasAddonManager: true });

    expect(root.find(AMInstallButton)).toHaveProp('addon', addon);
    expect(root.find(AMInstallButton)).toHaveProp('hasAddonManager', true);
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

    const installButton = root.find(AMInstallButton);
    expect(installButton).toHaveProp('enable', enable);
    expect(installButton).toHaveProp('install', install);
    expect(installButton).toHaveProp('installTheme', installTheme);
    expect(installButton).toHaveProp('uninstall', uninstall);
  });

  // // TODO: waiting for feedback on this.
  it('renders "Get Firefox Now" button when the client is not Firefox', () => {
    const root = render({
      _getClientCompatibility: sinon.stub().returns({
        compatible: false,
        reason: INCOMPATIBLE_NOT_FIREFOX,
      }),
    });

    expect(root.find('.Button--get-firefox')).toHaveLength(1);
  });

  it('passes the add-on GUID to Firefox install button', () => {
    const guid = 'some-guid';
    const addon = createInternalAddon({
      ...fakeAddon,
      guid,
    });

    const root = render({
      _getClientCompatibility: sinon.stub().returns({
        compatible: false,
        reason: INCOMPATIBLE_NOT_FIREFOX,
      }),
      addon,
    });

    expect(root.find('.Button--get-firefox')).toHaveLength(1);
    expect(root.find('.Button--get-firefox').prop('href')).toMatch(
      `&utm_content=${guid}`,
    );
  });

  it('renders an install error if there is one', () => {
    const addon = fakeAddon;

    // User clicks the install button.
    store.dispatch(
      setInstallState({
        guid: addon.guid,
        status: INSTALLING,
      }),
    );
    // An error has occured in FF.
    const error = FATAL_ERROR;
    store.dispatch(setInstallError({ error, guid: addon.guid }));

    const root = render();

    expect(root.find('.Addon-header-install-error')).toHaveLength(1);
    expect(root.find('.Addon-header-install-error')).toHaveProp(
      'children',
      getErrorMessage({ i18n: fakeI18n(), error }),
    );
  });
});
