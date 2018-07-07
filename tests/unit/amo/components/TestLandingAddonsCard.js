import * as React from 'react';
import { shallow } from 'enzyme';

import AddonsCard from 'amo/components/AddonsCard';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import {
  LANDING_PAGE_ADDON_COUNT,
  LANDING_PAGE_THEME_ADDON_COUNT,
} from 'amo/constants';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
  ADDON_TYPE_THEMES_FILTER,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import { fakeAddon } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  function render(customProps = {}) {
    const addons = Array(LANDING_PAGE_ADDON_COUNT).fill(
      createInternalAddon(fakeAddon),
    );

    const props = {
      addons,
      footerLink: {
        pathname: '/some-path/',
        query: { param: 'something' },
      },
      footerText: 'some text',
      header: 'Some Header',
      loading: false,
      ...customProps,
    };

    return shallow(<LandingAddonsCard {...props} />);
  }

  it('passes loading parameter to AddonsCard', () => {
    const root = render({ loading: true });
    expect(root.find(AddonsCard)).toHaveProp('loading', true);

    root.setProps({ loading: false });
    expect(root.find(AddonsCard)).toHaveProp('loading', false);
    expect(root.find(AddonsCard)).not.toHaveProp('footerLink', null);
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

  it('passes addonInstallSource to AddonsCard', () => {
    const addonInstallSource = 'featured-on-home-page';
    const addons = [createInternalAddon(fakeAddon)];
    const root = render({ addons, addonInstallSource });

    expect(root.find(AddonsCard)).toHaveProp(
      'addonInstallSource',
      addonInstallSource,
    );
  });

  it('sets the number of placeholders to render while loading', () => {
    const root = render({ loading: true });
    expect(root).toHaveProp('placeholderCount', LANDING_PAGE_ADDON_COUNT);
  });

  it('sets the correct number of placeholders for lightweight and static theme types', () => {
    const root = render({
      footerLink: {
        pathname: '/some-path/',
        query: { addonType: ADDON_TYPE_THEMES_FILTER },
      },
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'placeholderCount',
      LANDING_PAGE_THEME_ADDON_COUNT,
    );
  });

  it('sets the correct number of placeholders for a lightweight theme type', () => {
    const root = render({
      footerLink: {
        pathname: '/some-path/',
        query: { addonType: ADDON_TYPE_THEME },
      },
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'placeholderCount',
      LANDING_PAGE_THEME_ADDON_COUNT,
    );
  });

  it('sets the correct number of placeholders for a static theme type', () => {
    const root = render({
      footerLink: {
        pathname: '/some-path/',
        query: { addonType: ADDON_TYPE_STATIC_THEME },
      },
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'placeholderCount',
      LANDING_PAGE_THEME_ADDON_COUNT,
    );
  });

  it('sets the correct number of placeholders for an extension type', () => {
    const root = render({
      footerLink: {
        pathname: '/some-path/',
        query: { addonType: ADDON_TYPE_EXTENSION },
      },
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'placeholderCount',
      LANDING_PAGE_ADDON_COUNT,
    );
  });

  it('hides the footer link when less add-ons than placeholderCount', () => {
    const addons = [
      createInternalAddon({
        ...fakeAddon,
        slug: 'custom-addon',
      }),
    ];
    const root = render({ addons, placeholderCount: 2 });
    expect(root.find(AddonsCard)).toHaveProp('footerLink', null);
  });

  it('accepts a string for the footer link', () => {
    const linkString = '/some/link/';
    const root = render({ footerLink: linkString });
    expect(root.find(AddonsCard).prop('footerLink').props.to).toEqual(
      linkString,
    );
  });
});
