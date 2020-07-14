import * as React from 'react';

import AddonInstallError from 'amo/components/AddonInstallError';
import AddonTitle from 'amo/components/AddonTitle';
import AddonCompatibilityError from 'amo/components/AddonCompatibilityError';
import GuidesAddonCard, {
  GuidesAddonCardBase,
} from 'amo/components/GuidesAddonCard';
import InstallButtonWrapper from 'amo/components/InstallButtonWrapper';
import InstallWarning from 'amo/components/InstallWarning';
import { setInstallError, setInstallState } from 'core/reducers/installations';
import { FATAL_ERROR, INSTALLING, UNKNOWN } from 'core/constants';
import { createInternalAddon, loadAddonResults } from 'core/reducers/addons';
import {
  dispatchClientMetadata,
  fakeAddon,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import PromotedBadge from 'ui/components/PromotedBadge';

describe(__filename, () => {
  const _loadAddonResults = ({ addon = fakeAddon }) => {
    return loadAddonResults({ addons: [addon] });
  };

  const getProps = ({
    addonCustomText = 'Some text',
    hasAddonManager = true,
    setCurrentStatus = sinon.spy(),
    store = dispatchClientMetadata().store,
    ...customProps
  } = {}) => {
    return {
      addonCustomText,
      hasAddonManager,
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

  it("renders a loading class when the addon hasn't been loaded yet", () => {
    const root = render({ addon: undefined });

    expect(
      root.find('.GuidesAddonCard-content-header-title--loading'),
    ).toHaveLength(1);
  });

  it("renders nothing when the addon doesn't exist", () => {
    const root = render({ addon: null });
    expect(root.html()).toEqual(null);
  });

  it('passes the addon to AddonCompatibilityError', () => {
    const addon = createInternalAddon(fakeAddon);
    const root = render({ addon });

    expect(root.find(AddonCompatibilityError)).toHaveProp('addon', addon);
  });

  it('does not render AddonCompatibilityError when addon is undefined', () => {
    const root = render({ addon: undefined });

    expect(root.find(AddonCompatibilityError)).toHaveLength(0);
  });

  it('renders a PromotedBadge when the add-on is recommended', () => {
    const root = render({
      addon: createInternalAddon({ ...fakeAddon, is_recommended: true }),
    });
    expect(root.find(PromotedBadge)).toHaveLength(1);
  });

  it('does not render a PromotedBadge when the add-on is not recommended', () => {
    const root = render({
      addon: createInternalAddon({ ...fakeAddon, is_recommended: false }),
    });
    expect(root.find(PromotedBadge)).toHaveLength(0);
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

  it('renders an AddonInstallError component', () => {
    const root = render({ addon: createInternalAddon(fakeAddon) });

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

    const root = render({ addon, store });

    expect(root.find(AddonInstallError)).toHaveProp('error', error);
  });

  describe('InstallWarning', () => {
    it('renders the InstallWarning if an add-on exists', () => {
      const root = render({ addon: createInternalAddon(fakeAddon) });

      expect(root.find(InstallWarning)).toHaveLength(1);
    });

    it('does not render the InstallWarning if an add-on does not exist', () => {
      const root = render({ addon: undefined });

      expect(root.find(InstallWarning)).toHaveLength(0);
    });

    it('passes the addon to the InstallWarning', () => {
      const addon = createInternalAddon(fakeAddon);
      const root = render({ addon });

      expect(root.find(InstallWarning)).toHaveProp('addon', addon);
    });
  });
});
