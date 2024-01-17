import * as React from 'react';

import AddonMeta, { roundToOneDigit } from 'amo/components/AddonMeta';
import { reviewListURL } from 'amo/reducers/reviews';
import {
  createHistory,
  createInternalAddonWithLang,
  fakeAddon,
  fakeI18n,
  render as defaultRender,
  screen,
  within,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({
    addon = createInternalAddonWithLang(fakeAddon),
    location,
    ...props
  } = {}) => {
    const renderOptions = {
      history: createHistory({
        initialEntries: [location || '/'],
      }),
    };

    return defaultRender(<AddonMeta addon={addon} {...props} />, renderOptions);
  };

  it('can render without an addon', () => {
    render({ addon: null });

    expect(screen.getAllByRole('alert')).toHaveLength(13);
    expect(screen.getByText('Reviews')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Not rated yet')).toBeInTheDocument();
  });

  describe('average daily users', () => {
    it('renders the user count', () => {
      render({
        addon: createInternalAddonWithLang({
          ...fakeAddon,
          average_daily_users: 2,
        }),
      });

      const overallRating = screen.getByClassName('AddonMeta-overallRating');
      expect(within(overallRating).getByText('Users')).toBeInTheDocument();
      expect(within(overallRating).getByText('2')).toBeInTheDocument();
    });

    it('renders one user', () => {
      render({
        addon: createInternalAddonWithLang({
          ...fakeAddon,
          average_daily_users: 1,
        }),
      });

      const overallRating = screen.getByClassName('AddonMeta-overallRating');
      expect(within(overallRating).getByText('User')).toBeInTheDocument();
      expect(within(overallRating).getByText('1')).toBeInTheDocument();
    });

    it('renders no users', () => {
      render({
        addon: createInternalAddonWithLang({
          ...fakeAddon,
          average_daily_users: 0,
        }),
      });

      const overallRating = screen.getByClassName('AddonMeta-overallRating');
      expect(within(overallRating).getByText('No Users')).toBeInTheDocument();
      expect(
        within(overallRating).getAllByClassName('MetadataCard-content')[0],
      ).toHaveTextContent('');
    });

    it('localizes the user count', () => {
      const jed = fakeI18n({ lang: 'de' });
      render({
        addon: createInternalAddonWithLang({
          ...fakeAddon,
          average_daily_users: 1000,
        }),
        jed,
      });

      const overallRating = screen.getByClassName('AddonMeta-overallRating');
      expect(within(overallRating).getByText(/^1\.000/)).toBeInTheDocument();
    });
  });

  describe('ratings', () => {
    function renderWithRatings(ratings = {}, otherProps = {}) {
      return render({
        addon: createInternalAddonWithLang({
          ...fakeAddon,
          ratings: {
            ...fakeAddon.ratings,
            ...ratings,
          },
        }),
        ...otherProps,
      });
    }

    it('renders a count of multiple reviews', () => {
      const slug = 'some-slug';
      const ratingsCount = 5;
      render({
        addon: createInternalAddonWithLang({
          ...fakeAddon,
          ratings: {
            ...fakeAddon.ratings,
            text_count: 3,
            count: ratingsCount,
          },
          slug,
        }),
      });

      const listURL = `/en-US/android${reviewListURL({ addonSlug: slug })}`;
      expect(screen.getByRole('link', { name: 'Reviews' })).toHaveAttribute(
        'href',
        listURL,
      );
      expect(screen.getByRole('link', { name: ratingsCount })).toHaveAttribute(
        'href',
        listURL,
      );
    });

    it('renders links with UTM query parameters when the location has some', () => {
      const count = 123;
      const slug = 'some-slug';
      const utm_source = 'some-src';
      const utm_medium = 'some-medium';

      render({
        addon: createInternalAddonWithLang({
          ...fakeAddon,
          ratings: { ...fakeAddon.ratings, text_count: 3, count },
          slug,
        }),
        location: `/?utm_source=${utm_source}&utm_medium=${utm_medium}`,
      });

      const listURL = `/en-US/android/addon/${slug}/reviews/?utm_medium=${utm_medium}&utm_source=${utm_source}`;

      expect(screen.getByRole('link', { name: 'Reviews' })).toHaveAttribute(
        'href',
        listURL,
      );
      expect(screen.getByRole('link', { name: count })).toHaveAttribute(
        'href',
        listURL,
      );
    });

    it('renders a count of one review', () => {
      renderWithRatings({ count: 1 });

      expect(screen.getByRole('link', { name: 'Review' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: '1' })).toBeInTheDocument();
    });

    it('localizes review count', () => {
      const jed = fakeI18n({ lang: 'de' });
      renderWithRatings({ count: 1000 }, { jed });

      expect(screen.getByRole('link', { name: '1.000' })).toBeInTheDocument();
    });

    it('handles zero reviews', () => {
      render({
        addon: createInternalAddonWithLang({ ...fakeAddon, ratings: null }),
      });

      expect(screen.getByText('No Reviews')).toBeInTheDocument();
      expect(screen.getByText('Not rated yet')).toBeInTheDocument();
    });

    it('handles an addon without ratings', () => {
      render({
        addon: createInternalAddonWithLang({
          ...fakeAddon,
          ratings: undefined,
        }),
      });

      expect(screen.getByText('No Reviews')).toBeInTheDocument();
      expect(screen.getByText('Not rated yet')).toBeInTheDocument();
      // The Ratings should not render in a loading state.
      expect(
        screen.queryByClassName('Rating--loading'),
      ).not.toBeInTheDocument();
    });

    it('renders RatingsByStar with an add-on', () => {
      const addon = createInternalAddonWithLang(fakeAddon);
      render({ addon });

      const link = screen.getByTitle('There are no five-star reviews');
      expect(link).toHaveAttribute(
        'href',
        `/en-US/android/addon/${addon.slug}/reviews/?score=5`,
      );
    });

    it('renders RatingsByStar without an add-on', () => {
      render({ addon: null });

      expect(
        within(screen.getByClassName('RatingsByStar')).getAllByRole('alert'),
      ).toHaveLength(10);
    });

    it('renders the average rating', () => {
      const average = 2.34;
      renderWithRatings({ average });

      expect(
        screen.getByText(`${roundToOneDigit(average)} Stars`),
      ).toBeInTheDocument();
      expect(
        screen.getByText(`Rated ${roundToOneDigit(average)} out of 5`),
      ).toBeInTheDocument();
    });

    it('renders a 1 star average rating', () => {
      renderWithRatings({ average: 1.0 });

      expect(screen.getByText('1 Star')).toBeInTheDocument();
    });
  });

  describe('roundToOneDigit', () => {
    it('returns a 0 for a null', () => {
      expect(roundToOneDigit(null)).toEqual(0);
    });

    it('returns a 0 for a 0', () => {
      expect(roundToOneDigit(0)).toEqual(0);
    });

    it('rounds a float down to one digit', () => {
      expect(roundToOneDigit(2.34)).toEqual(2.3);
    });

    it('rounds a float up to one digit', () => {
      expect(roundToOneDigit(2.36)).toEqual(2.4);
    });

    it('returns an integer with no decimal point', () => {
      expect(roundToOneDigit(2)).toEqual(2);
    });
  });
});
