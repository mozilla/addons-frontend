import * as React from 'react';
import { shallow } from 'enzyme';

import AddonsCard from 'amo/components/AddonsCard';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import Link from 'amo/components/Link';
import {
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
  ADDON_TYPE_STATIC_THEME,
} from 'amo/constants';
import { createInternalAddonWithLang, fakeAddon } from 'tests/unit/helpers';

describe(__filename, () => {
  function render(customProps = {}) {
    const addons = Array(LANDING_PAGE_EXTENSION_COUNT).fill(
      createInternalAddonWithLang(fakeAddon),
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
      createInternalAddonWithLang({
        ...fakeAddon,
        slug: 'custom-addon',
      }),
    ];
    const root = render({ addons });
    expect(root.find(AddonsCard)).toHaveProp('addons', addons);
  });

  it('passes addonInstallSource to AddonsCard', () => {
    const addonInstallSource = 'featured-on-home-page';
    const addons = [createInternalAddonWithLang(fakeAddon)];
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
      createInternalAddonWithLang({
        ...fakeAddon,
        slug: 'custom-addon',
      }),
    ];
    const root = render({ addons, placeholderCount: 2 });
    expect(root.find(AddonsCard)).toHaveProp('footerLink', null);
  });

  it('hides the footer link when there are less add-ons than LANDING_PAGE_THEME_COUNT', () => {
    const root = render({
      addons: Array(LANDING_PAGE_THEME_COUNT - 1).fill(
        createInternalAddonWithLang({
          ...fakeAddon,
          type: ADDON_TYPE_STATIC_THEME,
        }),
      ),
      isTheme: true,
    });
    expect(root.find(AddonsCard)).toHaveProp('footerLink', null);
  });

  it('shows the footer link when there are more or as many add-ons as LANDING_PAGE_THEME_COUNT', () => {
    const footerLink = 'footer-link-path';
    const footerText = 'footer link text';

    const root = render({
      addons: Array(LANDING_PAGE_THEME_COUNT).fill(
        createInternalAddonWithLang({
          ...fakeAddon,
          type: ADDON_TYPE_STATIC_THEME,
        }),
      ),
      isTheme: true,
      footerLink,
      footerText,
    });

    expect(root.find(AddonsCard).prop('footerLink')).toEqual(
      <Link to={footerLink}>{footerText}</Link>,
    );
  });

  it('shows the footer link when there are more or as many add-ons as placeholderCount', () => {
    const footerLink = 'footer-link-path';
    const footerText = 'footer link text';
    const placeholderCount = 2;

    const root = render({
      addons: Array(placeholderCount).fill(
        createInternalAddonWithLang({
          ...fakeAddon,
          type: ADDON_TYPE_STATIC_THEME,
        }),
      ),
      placeholderCount,
      footerLink,
      footerText,
    });

    expect(root.find(AddonsCard).prop('footerLink')).toEqual(
      <Link to={footerLink}>{footerText}</Link>,
    );
  });

  it('accepts a string for the footer link', () => {
    const linkString = '/some/link/';
    const root = render({ footerLink: linkString });
    expect(root.find(AddonsCard).prop('footerLink').props.to).toEqual(
      linkString,
    );
  });

  it('accepts an object with an href for the footer link', () => {
    const url = '/some/link/';
    const footerLink = { href: url };
    const root = render({ footerLink });
    expect(root.find(AddonsCard).prop('footerLink').props.href).toEqual(url);
    expect(root.find(AddonsCard).prop('footerLink').props.to).toEqual(
      undefined,
    );
    expect(root.find(AddonsCard).prop('footerLink').props.target).toEqual(
      '_blank',
    );
  });

  it.each([true, false])(
    'sets useThemePlaceholder to the value of isTheme on the AddonsCard',
    (isTheme) => {
      const root = render({ isTheme });

      expect(root.find(AddonsCard)).toHaveProp('useThemePlaceholder', isTheme);
    },
  );
});
