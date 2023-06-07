import * as React from 'react';
import userEvent from '@testing-library/user-event';

import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import {
  ADDON_TYPE_STATIC_THEME,
  DEFAULT_UTM_SOURCE,
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
} from 'amo/constants';
import {
  createInternalAddonWithLang,
  fakeAddon,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';

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

    return defaultRender(<LandingAddonsCard {...props} />);
  }

  it('renders AddonsCard in a non-loading state when not loading', () => {
    render({
      footerLink: '/some-path/',
      footerText: 'Footer text',
      loading: false,
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Footer text' })).toHaveAttribute(
      'href',
      '/en-US/android/some-path/',
    );
  });

  it('renders AddonsCard in a loading state when loading', () => {
    render({
      addons: [],
      footerLink: '/some-path/',
      footerText: 'Footer text',
      loading: true,
    });

    // There will be 4 loading indicators per SearchResult.
    expect(screen.getAllByRole('alert')).toHaveLength(
      LANDING_PAGE_EXTENSION_COUNT * 4,
    );
    expect(
      screen.queryByRole('link', { name: 'Footer text' }),
    ).not.toBeInTheDocument();
  });

  it('passes addons to AddonsCard', () => {
    const addons = [createInternalAddonWithLang(fakeAddon)];
    render({ addons });

    expect(
      screen.getByRole('link', { name: addons[0].name }),
    ).toBeInTheDocument();
  });

  it('passes addonInstallSource to AddonsCard', () => {
    const addonInstallSource = 'featured-on-home-page';
    const addons = [createInternalAddonWithLang(fakeAddon)];
    render({ addons, addonInstallSource });

    const expectedLink = [
      `/en-US/android/addon/${addons[0].slug}/?utm_source=${DEFAULT_UTM_SOURCE}`,
      'utm_medium=referral',
      `utm_content=${addonInstallSource}`,
    ].join('&');
    expect(screen.getByRole('link', { name: addons[0].name })).toHaveAttribute(
      'href',
      expectedLink,
    );
  });

  it('passes isHomepageShelf to AddonsCard', () => {
    render({ isHomepageShelf: true });

    expect(screen.getByClassName('Card-shelf-footer')).toBeInTheDocument();
  });

  it('passes onAddonClick to AddonsCard', async () => {
    const addons = [createInternalAddonWithLang(fakeAddon)];
    const onAddonClick = jest.fn();
    render({ addons, onAddonClick });

    await userEvent.click(screen.getByRole('listitem'));

    expect(onAddonClick).toHaveBeenCalledWith(addons[0]);
  });

  it('overrides the default placeholder value when passed in', () => {
    render({
      addons: [],
      loading: true,
      placeholderCount: 1,
    });

    // There will be 4 loading indicators per SearchResult.
    expect(screen.getAllByRole('alert')).toHaveLength(4);
  });

  it('overrides the placeholder prop value when isTheme is passed in', () => {
    render({
      addons: [],
      isTheme: true,
      loading: true,
      placeholderCount: 1,
    });

    expect(screen.getAllByRole('alert')).toHaveLength(
      LANDING_PAGE_THEME_COUNT * 4,
    );
  });

  it('uses the placeholder prop value when isTheme is passed in as false', () => {
    const placeholderCount = 2;
    render({
      addons: [],
      isTheme: false,
      loading: true,
      placeholderCount,
    });

    expect(screen.getAllByRole('alert')).toHaveLength(placeholderCount * 4);
  });

  it('hides the footer link when there are less add-ons than placeholderCount', () => {
    const addons = [createInternalAddonWithLang(fakeAddon)];
    render({
      addons,
      footerLink: '/some-path/',
      footerText: 'Footer text',
      placeholderCount: 2,
    });

    expect(
      screen.queryByRole('link', { name: 'Footer text' }),
    ).not.toBeInTheDocument();
  });

  it('shows the footer link when there are less add-ons than placeholderCount but alwaysDisplayFooter is true', () => {
    const addons = [createInternalAddonWithLang(fakeAddon)];
    render({
      addons,
      alwaysDisplayFooter: true,
      footerLink: '/some-path/',
      footerText: 'Footer text',
      placeholderCount: 2,
    });

    expect(
      screen.getByRole('link', { name: 'Footer text' }),
    ).toBeInTheDocument();
  });

  it('hides the footer link when there are less add-ons than LANDING_PAGE_THEME_COUNT', () => {
    render({
      addons: Array(LANDING_PAGE_THEME_COUNT - 1).fill(
        createInternalAddonWithLang({
          ...fakeAddon,
          type: ADDON_TYPE_STATIC_THEME,
        }),
      ),
      footerLink: '/some-path/',
      footerText: 'Footer text',
      isTheme: true,
    });

    expect(
      screen.queryByRole('link', { name: 'Footer text' }),
    ).not.toBeInTheDocument();
  });

  it('shows the footer link when there are more or as many add-ons as LANDING_PAGE_THEME_COUNT', () => {
    const footerLink = '/footer-link-path/';
    const footerText = 'footer link text';

    render({
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

    expect(screen.getByRole('link', { name: footerText })).toHaveAttribute(
      'href',
      `/en-US/android${footerLink}`,
    );
  });

  it('shows the footer link when there are more or as many add-ons as placeholderCount', () => {
    const footerLink = '/footer-link-path/';
    const footerText = 'footer link text';
    const placeholderCount = 2;

    render({
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

    expect(screen.getByRole('link', { name: footerText })).toHaveAttribute(
      'href',
      `/en-US/android${footerLink}`,
    );
  });

  it('accepts an object with an href for the footer link', () => {
    const url = '/some/link/';
    const footerLink = { href: url };
    const footerText = 'footer link text';
    render({ footerLink, footerText });

    const link = screen.getByRole('link', { name: footerText });
    expect(link).toHaveAttribute('href', url);
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('sets useThemePlaceholder to true if isTheme is true', () => {
    render({ addons: [], loading: true, isTheme: true });

    expect(screen.getAllByRole('listitem')[0]).toHaveClass(
      'SearchResult--theme',
    );
  });

  it('sets useThemePlaceholder to false if isTheme is false', () => {
    render({ addons: [], loading: true, isTheme: false });

    expect(screen.getAllByRole('listitem')[0]).not.toHaveClass(
      'SearchResult--theme',
    );
  });
});
