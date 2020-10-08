import { shallow } from 'enzyme';
import * as React from 'react';

import AddonsCard from 'amo/components/AddonsCard';
import SponsoredAddonsShelf, {
  PROMOTED_ADDON_CLICK_ACTION,
  PROMOTED_ADDON_HOMEPAGE_CLICK_CATEGORY,
  PROMOTED_ADDON_HOMEPAGE_IMPRESSION_CATEGORY,
  PROMOTED_ADDON_IMPRESSION_ACTION,
  SponsoredAddonsShelfBase,
} from 'amo/components/SponsoredAddonsShelf';
import { fetchHomeData, loadHomeData } from 'amo/reducers/home';
import { getPromotedBadgesLinkUrl } from 'amo/utils';
import { createInternalAddon } from 'core/reducers/addons';
import {
  createAddonsApiResult,
  createFakeTracking,
  createHeroShelves,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let _tracking;
  let store;

  beforeEach(() => {
    _tracking = createFakeTracking();
    store = dispatchClientMetadata().store;
  });

  const render = (customProps = {}) => {
    const props = {
      _tracking,
      i18n: fakeI18n(),
      loading: false,
      store,
      ...customProps,
    };

    return shallowUntilTarget(
      <SponsoredAddonsShelf {...props} />,
      SponsoredAddonsShelfBase,
    );
  };

  const _loadPromotedExtensions = ({ addons = [] }) => {
    store.dispatch(
      loadHomeData({
        collections: [],
        heroShelves: createHeroShelves(),
        shelves: { promotedExtensions: createAddonsApiResult(addons) },
      }),
    );
  };

  it('displays nothing when promotedExtensions is an empty array', () => {
    _loadPromotedExtensions({ addons: [] });
    const root = render();
    expect(root.find(AddonsCard)).toHaveLength(0);
  });

  it('passes loading parameter to AddonsCard', () => {
    store.dispatch(
      fetchHomeData({ collectionsToFetch: [], errorHandlerId: 'some-id' }),
    );

    let root = render();
    expect(root.find(AddonsCard)).toHaveProp('loading', true);

    _loadPromotedExtensions({ addons: [fakeAddon] });
    root = render();
    expect(root.find(AddonsCard)).toHaveProp('loading', false);
  });

  it('passes promotedExtensions to AddonsCard', () => {
    const addon = fakeAddon;
    _loadPromotedExtensions({ addons: [addon] });
    const root = render();

    expect(root.find(AddonsCard)).toHaveProp('addons', [
      createInternalAddon(addon),
    ]);
  });

  it('can pass a custom classname to AddonsCard', () => {
    const className = 'some-class-name';
    const root = render({ className });

    expect(root.find(AddonsCard)).toHaveClassName(className);
  });

  it('passes addonInstallSource to AddonsCard', () => {
    const addonInstallSource = 'featured-on-home-page';
    const addons = [createInternalAddon(fakeAddon)];
    const root = render({ addons, addonInstallSource });

    expect(root.find(AddonsCard)).toHaveProp(
      'addonInstallSource',
      addonInstallSource,
    );
  });

  it('uses the expected properties for the header link in AddonsCard', () => {
    const root = render();
    const headerProp = root.find(AddonsCard).prop('header');
    const header = shallow(<div>{headerProp}</div>);

    expect(header.find('.SponsoredAddonsShelf-headerLink')).toHaveProp(
      'rel',
      'noopener noreferrer',
    );
    expect(header.find('.SponsoredAddonsShelf-headerLink')).toHaveProp(
      'href',
      `${getPromotedBadgesLinkUrl({
        utm_content: 'promoted-addon-shelf',
      })}#sponsored`,
    );
  });

  it('configures AddonsCard to send a tracking event when an add-on is clicked', () => {
    const guid = 'some-guid';
    const addon = { ...fakeAddon, guid };
    _loadPromotedExtensions({ addons: [addon] });

    const root = render();
    const onAddonClick = root.find(AddonsCard).prop('onAddonClick');
    onAddonClick(createInternalAddon(addon));

    sinon.assert.calledWith(_tracking.sendEvent, {
      action: PROMOTED_ADDON_CLICK_ACTION,
      category: PROMOTED_ADDON_HOMEPAGE_CLICK_CATEGORY,
      label: guid,
    });
  });

  it('configures AddonsCard to send a tracking event when an add-on is displayed', () => {
    const guid = 'some-guid';
    const addon = { ...fakeAddon, guid };
    _loadPromotedExtensions({ addons: [addon] });

    const root = render();
    const onAddonImpression = root.find(AddonsCard).prop('onAddonImpression');
    onAddonImpression(createInternalAddon(addon));

    sinon.assert.calledWith(_tracking.sendEvent, {
      action: PROMOTED_ADDON_IMPRESSION_ACTION,
      category: PROMOTED_ADDON_HOMEPAGE_IMPRESSION_CATEGORY,
      label: guid,
    });
  });

  it('only includes 3 promoted extensions if fewer than 6 are returned', () => {
    _loadPromotedExtensions({ addons: Array(5).fill(fakeAddon) });

    const root = render();

    const addons = root.find(AddonsCard).prop('addons');
    expect(addons.length).toEqual(3);
  });
});
