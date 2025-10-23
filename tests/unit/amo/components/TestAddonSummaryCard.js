import * as React from 'react';

import AddonSummaryCard from 'amo/components/AddonSummaryCard';
import { getAddonURL } from 'amo/utils';
import {
  createHistory,
  createInternalAddonWithLang,
  createLocalizedString,
  fakeAddon,
  render as defaultRender,
  screen,
  within,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({ addon, headerText, location, ...props } = {}) => {
    const renderOptions = {
      history: createHistory({
        initialEntries: [location || '/'],
      }),
    };

    return defaultRender(
      <AddonSummaryCard
        addon={addon ? createInternalAddonWithLang(addon) : addon}
        headerText={headerText}
        {...props}
      />,
      renderOptions,
    );
  };

  describe('Card header', () => {
    it('renders a fallback icon without an add-on', () => {
      render({ addon: null });

      expect(screen.getByAltText('Add-on icon')).toHaveAttribute(
        'src',
        'default.svg',
      );
    });

    it("renders the add-on's icon in the header", () => {
      const addon = fakeAddon;
      render({ addon });

      expect(screen.getByAltText('Add-on icon')).toHaveAttribute(
        'src',
        addon.icons[64],
      );
    });

    it('adds a link on the icon when there is an add-on', () => {
      const addon = fakeAddon;
      render({ addon });

      expect(screen.getByRole('link', { name: 'Add-on icon' })).toHaveAttribute(
        'href',
        `/en-US/android${getAddonURL(addon.slug)}`,
      );
    });

    it('adds UTM query parameters to the link on the icon when there are some', () => {
      const addon = fakeAddon;
      const utmMedium = 'some-utm-medium';
      render({
        addon,
        location: `/?utm_medium=${utmMedium}`,
      });

      expect(screen.getByRole('link', { name: 'Add-on icon' })).toHaveAttribute(
        'href',
        `/en-US/android${getAddonURL(addon.slug)}?utm_medium=${utmMedium}`,
      );
    });

    it('renders a hidden h1 for SEO', () => {
      const headerText = 'Expected header text';
      render({ headerText });

      expect(screen.getByRole('heading', { name: headerText })).toHaveClass(
        'visually-hidden',
      );
    });

    it('renders an AddonTitle', () => {
      const addonName = 'My Add-On';
      const addon = { ...fakeAddon, name: createLocalizedString(addonName) };
      render({ addon });

      expect(screen.getByRole('link', { name: addonName })).toHaveAttribute(
        'href',
        `/en-US/android${getAddonURL(addon.slug)}`,
      );
    });

    it('passes an empty queryParamsForAttribution when there is no UTM parameter', () => {
      const addonName = 'My Add-On';
      const addon = { ...fakeAddon, name: createLocalizedString(addonName) };
      render({
        addon,
        location: `/?src=someSrc`,
      });

      expect(screen.getByRole('link', { name: addonName })).toHaveAttribute(
        'href',
        `/en-US/android${getAddonURL(addon.slug)}`,
      );
    });

    it('passes queryParamsForAttribution with the value of `utm_content` when available', () => {
      const addonName = 'My Add-On';
      const addon = { ...fakeAddon, name: createLocalizedString(addonName) };
      const utmContent = 'some-src';
      render({
        addon,
        location: `/?utm_content=${utmContent}`,
      });

      expect(screen.getByRole('link', { name: addonName })).toHaveAttribute(
        'href',
        `/en-US/android${getAddonURL(addon.slug)}?utm_content=${utmContent}`,
      );
    });
  });

  describe('overallRatingStars', () => {
    it('renders Rating without an add-on', () => {
      render({ addon: null });

      expect(screen.getAllByTitle('There are no ratings yet')).toHaveLength(6);
    });

    it('renders Rating without add-on ratings', () => {
      const addon = { ...fakeAddon, ratings: undefined };
      render({ addon });

      expect(screen.getAllByTitle('There are no ratings yet')).toHaveLength(6);
    });

    it('renders Rating with add-on ratings', () => {
      const addon = {
        ...fakeAddon,
        ratings: {
          ...fakeAddon.ratings,
          average: 4.5,
        },
      };
      render({ addon });

      expect(screen.getAllByTitle('Rated 4.5 out of 5')).toHaveLength(6);
    });

    it('renders RatingsByStar without an add-on', () => {
      render({ addon: null });

      // There will be two loading indicators per row.
      expect(
        within(screen.getByClassName('RatingsByStar')).getAllByRole('alert'),
      ).toHaveLength(10);
    });

    it('renders RatingsByStar with an add-on', () => {
      const addon = fakeAddon;
      render({ addon });

      // Do a sanity check to make sure the right add-on was used.
      const links = screen.getAllByTitle('There are no five-star reviews');
      // 3 because we have the same link 3 times (1 per column in the rating
      // component).
      expect(links).toHaveLength(3);
      for (const link of links) {
        expect(link).toHaveAttribute(
          'href',
          `/en-US/android/addon/${addon.slug}/reviews/?score=5`,
        );
      }
    });

    it('renders loading text without an add-on', () => {
      render({ addon: null });

      expect(
        within(
          screen.getByClassName('AddonSummaryCard-addonAverage'),
        ).getByRole('alert'),
      ).toBeInTheDocument();
    });

    it('renders empty text without add-on ratings', () => {
      render({ addon: { ...fakeAddon, ratings: undefined } });

      expect(
        screen.getByClassName('AddonSummaryCard-addonAverage'),
      ).toHaveTextContent('');
    });

    it('renders a fixed star average', () => {
      render({
        addon: {
          ...fakeAddon,
          ratings: {
            ...fakeAddon.ratings,
            average: 4.6667,
          },
        },
      });

      expect(screen.getByText('4.7 Stars out of 5')).toBeInTheDocument();
    });

    it('renders whole number star averages', () => {
      render({
        addon: {
          ...fakeAddon,
          ratings: {
            ...fakeAddon.ratings,
            average: 4.0,
          },
        },
      });

      expect(screen.getByText('4 Stars out of 5')).toBeInTheDocument();
    });

    it('renders a single star average with singular text', () => {
      render({
        addon: {
          ...fakeAddon,
          ratings: {
            ...fakeAddon.ratings,
            average: 1.0,
          },
        },
      });

      expect(screen.getByText('1 Star out of 5')).toBeInTheDocument();
    });
  });
});
