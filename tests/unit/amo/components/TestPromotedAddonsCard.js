import { shallow } from 'enzyme';
import * as React from 'react';

import AddonsCard from 'amo/components/AddonsCard';
import PromotedAddonsCard, {
  PROMOTED_ADDON_CLICK_ACTION,
  PROMOTED_ADDON_HOMEPAGE_CLICK_CATEGORY,
  PROMOTED_ADDON_HOMEPAGE_IMPRESSION_CATEGORY,
  PROMOTED_ADDON_IMPRESSION_ACTION,
  PromotedAddonsCardBase,
} from 'amo/components/PromotedAddonsCard';
import { getPromotedBadgesLinkUrl } from 'amo/utils';
import { createInternalAddon } from 'core/reducers/addons';
import {
  createFakeTracking,
  fakeAddon,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (customProps = {}) => {
    const props = {
      i18n: fakeI18n(),
      loading: false,
      ...customProps,
    };

    return shallowUntilTarget(
      <PromotedAddonsCard {...props} />,
      PromotedAddonsCardBase,
    );
  };

  it('passes loading parameter to AddonsCard', () => {
    const root = render({ loading: true });
    expect(root.find(AddonsCard)).toHaveProp('loading', true);

    root.setProps({ loading: false });
    expect(root.find(AddonsCard)).toHaveProp('loading', false);
  });

  it('passes addons to AddonsCard', () => {
    const addons = [
      createInternalAddon({
        ...fakeAddon,
        slug: 'custom-addon',
      }),
    ];
    const root = render({ addons });
    expect(root.find(AddonsCard)).toHaveProp('addons', addons);
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

  it('uses the proper `rel` property for the header link in AddonsCard', () => {
    const root = render();
    const headerProp = root.find(AddonsCard).prop('header');
    const header = shallow(<div>{headerProp}</div>);

    expect(header.find('.PromotedAddonsCard-headerLink')).toHaveProp(
      'rel',
      'noopener noreferrer',
    );
    expect(header.find('.PromotedAddonsCard-headerLink')).toHaveProp(
      'href',
      `${getPromotedBadgesLinkUrl({
        utm_content: 'promoted-addon-shelf',
      })}#sponsored`,
    );
  });

  it('configures AddonsCard to send a tracking event when an add-on is clicked', () => {
    const _tracking = createFakeTracking();
    const guid = 'some-guid';
    const addon = createInternalAddon({ ...fakeAddon, guid });

    const root = render({ _tracking, addons: [addon] });
    const onAddonClick = root.find(AddonsCard).prop('onAddonClick');
    onAddonClick(addon);

    sinon.assert.calledWith(_tracking.sendEvent, {
      action: PROMOTED_ADDON_CLICK_ACTION,
      category: PROMOTED_ADDON_HOMEPAGE_CLICK_CATEGORY,
      label: guid,
    });
  });

  it('configures AddonsCard to send a tracking event when an add-on is displayed', () => {
    const _tracking = createFakeTracking();
    const guid = 'some-guid';
    const addon = createInternalAddon({ ...fakeAddon, guid });

    const root = render({ _tracking, addons: [addon] });
    const onAddonImpression = root.find(AddonsCard).prop('onAddonImpression');
    onAddonImpression(addon);

    sinon.assert.calledWith(_tracking.sendEvent, {
      action: PROMOTED_ADDON_IMPRESSION_ACTION,
      category: PROMOTED_ADDON_HOMEPAGE_IMPRESSION_CATEGORY,
      label: guid,
    });
  });
});
