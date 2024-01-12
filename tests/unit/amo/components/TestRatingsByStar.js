import * as React from 'react';

import RatingsByStar from 'amo/components/RatingsByStar';
import { reviewListURL } from 'amo/reducers/reviews';
import {
  createHistory,
  createInternalAddonWithLang,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  render as defaultRender,
  screen,
  within,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = ({
    addon = createInternalAddonWithLang(fakeAddon),
    location,
    ...props
  } = {}) => {
    const renderOptions = {
      history: createHistory({
        initialEntries: [location || '/'],
      }),
      store,
    };

    return defaultRender(
      <RatingsByStar addon={addon} {...props} />,
      renderOptions,
    );
  };

  const addonForGrouping = (grouping, addonParams = {}) => {
    return createInternalAddonWithLang({
      ...fakeAddon,
      ratings: {
        ...fakeAddon.ratings,
        // This is the sum of all grouped rating counts.
        count: Object.values(grouping).reduce(
          (total, currentValue) => total + currentValue,
        ),
        grouped_counts: grouping,
      },
      ...addonParams,
    });
  };

  it('renders a loading state without an add-on', () => {
    render({ addon: null });

    // There will be two loading indicators, and one Icon per row.
    expect(screen.getAllByRole('alert')).toHaveLength(10);
    expect(screen.getAllByClassName('Icon-star-yellow')).toHaveLength(5);
  });

  it('renders star labels, counts and links', () => {
    const grouping = {
      5: 964,
      4: 821,
      3: 543,
      2: 1,
      1: 0,
    };
    const addon = addonForGrouping(grouping);
    render({ addon });

    function validateLink(score, count, expectedTitle) {
      const link = screen.getByTitle(expectedTitle);
      expect(link).toHaveAttribute(
        'href',
        `/en-US/android${reviewListURL({ addonSlug: addon.slug, score })}`,
      );
      expect(within(link).getByText(count)).toBeInTheDocument();
    }

    validateLink('5', 964, 'Read all 964 five-star reviews');
    validateLink('4', 821, 'Read all 821 four-star reviews');
    validateLink('3', 543, 'Read all 543 three-star reviews');
    validateLink('2', 1, 'Read the 1 two-star review');
    validateLink('1', 0, 'There are no one-star reviews');
  });

  it('adds UTM query parameters to the review links when there are some', () => {
    const utm_medium = 'some-utm-medium';
    const location = `/?utm_medium=${utm_medium}`;
    const grouping = {
      5: 964,
      4: 821,
      3: 543,
      2: 1,
      1: 0,
    };
    const addon = addonForGrouping(grouping);
    render({ addon, location });

    function validateLink(score, expectedTitle) {
      const link = screen.getByTitle(expectedTitle);
      const expectedQueryString = [
        `score=${score}`,
        `utm_medium=${utm_medium}`,
      ].join('&');
      expect(link).toHaveAttribute(
        'href',
        `/en-US/android/addon/${addon.slug}/reviews/?${expectedQueryString}`,
      );
    }

    validateLink('5', 'Read all 964 five-star reviews');
    validateLink('4', 'Read all 821 four-star reviews');
    validateLink('3', 'Read all 543 three-star reviews');
    validateLink('2', 'Read the 1 two-star review');
    validateLink('1', 'There are no one-star reviews');
  });

  it('renders bar value widths based on total ratings', () => {
    const grouping = {
      5: 1, // 6.6%
      4: 2, // 13%
      3: 3, // 20%
      2: 4, // 26.6%
      1: 5, // 33.3%
    };
    const addon = addonForGrouping(grouping);
    render({ addon });

    const barValues = screen.getAllByClassName('RatingsByStar-barValue');
    expect(barValues[0]).toHaveClass('RatingsByStar-barValue--7pct');
    expect(barValues[1]).toHaveClass('RatingsByStar-barValue--13pct');
    expect(barValues[2]).toHaveClass('RatingsByStar-barValue--20pct');
    expect(barValues[3]).toHaveClass('RatingsByStar-barValue--27pct');
    expect(barValues[4]).toHaveClass('RatingsByStar-barValue--33pct');
  });

  it('renders different styles for partial / full bars', () => {
    // Set up an add-on with one 5-star rating.
    const grouping = {
      5: 1,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };
    const addon = addonForGrouping(grouping);
    render({ addon });

    const barValues = screen.getAllByClassName('RatingsByStar-barValue');

    expect(barValues[0]).toHaveClass('RatingsByStar-barValue--100pct');
    expect(barValues[0]).not.toHaveClass('RatingsByStar-partialBar');

    expect(barValues[1]).toHaveClass('RatingsByStar-barValue--0pct');
    expect(barValues[1]).toHaveClass('RatingsByStar-partialBar');
  });

  it('renders 0% bar values when ratings are all 0', () => {
    const grouping = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const addon = addonForGrouping(grouping);
    render({ addon });

    const barValues = screen.getAllByClassName('RatingsByStar-barValue');
    for (const index of [0, 1, 2, 3, 4]) {
      expect(barValues[index]).toHaveClass('RatingsByStar-barValue--0pct');
    }
  });

  it('localizes star counts', () => {
    const grouping = {
      5: 1000,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };
    const addon = addonForGrouping(grouping);
    render({ addon, jed: fakeI18n({ lang: 'de' }) });

    expect(screen.getByText('1.000')).toBeInTheDocument();
  });
});
