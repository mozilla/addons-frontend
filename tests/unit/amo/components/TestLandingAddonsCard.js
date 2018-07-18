import * as React from 'react';
import { shallow } from 'enzyme';

import AddonsCard from 'amo/components/AddonsCard';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import {
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
} from 'amo/constants';
import { ADDON_TYPE_THEME } from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import { fakeAddon } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  function render(customProps = {}) {
    const addons = Array(LANDING_PAGE_EXTENSION_COUNT).fill(
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
    expect(root).toHaveProp('placeholderCount', LANDING_PAGE_EXTENSION_COUNT);
  });

  it('overrides the default placeholder value when passed in', () => {
    const root = render({ placeholderCount: LANDING_PAGE_THEME_COUNT });

    expect(root.find(AddonsCard)).toHaveProp(
      'placeholderCount',
      LANDING_PAGE_THEME_COUNT,
    );
  });

  it('overrides the placeholder prop value when isTheme is passed in', () => {
    const root = render({ isTheme: true, placeholderCount: 2 });

    expect(root.find(AddonsCard)).toHaveProp(
      'placeholderCount',
      LANDING_PAGE_THEME_COUNT,
    );
  });

  it('uses the placeholder prop value when isTheme is passed in as false', () => {
    const placeholderCount = 2;
    const root = render({ isTheme: false, placeholderCount });

    expect(root.find(AddonsCard)).toHaveProp(
      'placeholderCount',
      placeholderCount,
    );
  });

  it('hides the footer link when there are less add-ons than placeholderCount', () => {
    const addons = [
      createInternalAddon({
        ...fakeAddon,
        slug: 'custom-addon',
      }),
    ];
    const root = render({ addons, placeholderCount: 2 });
    expect(root.find(AddonsCard)).toHaveProp('footerLink', null);
  });

  it('hides the footer link when there are less add-ons than LANDING_PAGE_THEME_COUNT', () => {
    const addons = [
      createInternalAddon({
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
        slug: 'custom-addon',
      }),
    ];
    const root = render({ addons, isTheme: true });
    expect(root.find(AddonsCard)).toHaveProp('footerLink', null);
  });

  it('shows the footer link when there are more or as many add-ons than LANDING_PAGE_THEME_COUNT', () => {
    const addons = [
      createInternalAddon({
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
        slug: 'custom-addon',
      }),
      createInternalAddon({
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
        slug: 'custom-addon-1',
      }),
      createInternalAddon({
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
        slug: 'custom-addon-2',
      }),
    ];
    const root = render({ addons, isTheme: true });
    expect(root.find(AddonsCard)).not.toHaveProp('footerLink', null);

    expect(root.find(AddonsCard).prop('footerLink')).toMatchObject({
      key: null,
      ref: null,
      props: {
        to: { pathname: '/some-path/', query: {} },
        children: 'some text',
      },
      _owner: null,
      _store: {},
    });
  });

  it('shows the footer link when there are as many or more add-ons than placeholderCount', () => {
    const addons = [
      createInternalAddon({
        ...fakeAddon,
        slug: 'custom-addon',
      }),
      createInternalAddon({
        ...fakeAddon,
        slug: 'custom-addon-1',
      }),
    ];
    const root = render({ addons, placeholderCount: 2 });
    expect(root.find(AddonsCard)).not.toHaveProp('footerLink', null);

    expect(root.find(AddonsCard).prop('footerLink')).toMatchObject({
      key: null,
      ref: null,
      props: {
        to: { pathname: '/some-path/', query: {} },
        children: 'some text',
      },
      _owner: null,
      _store: {},
    });
  });

  it('accepts a string for the footer link', () => {
    const linkString = '/some/link/';
    const root = render({ footerLink: linkString });
    expect(root.find(AddonsCard).prop('footerLink').props.to).toEqual(
      linkString,
    );
  });
});
