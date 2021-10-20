import * as React from 'react';

import Link from 'amo/components/Link';
import RatingsByStar, { RatingsByStarBase } from 'amo/components/RatingsByStar';
import { reviewListURL } from 'amo/reducers/reviews';
import {
  createContextWithFakeRouter,
  createFakeLocation,
  createInternalAddonWithLang,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import IconStar from 'amo/components/IconStar';
import LoadingText from 'amo/components/LoadingText';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const getProps = ({
    addon = createInternalAddonWithLang(fakeAddon),
    ...customProps
  } = {}) => {
    return { addon, i18n: fakeI18n(), store, ...customProps };
  };

  const render = ({ location, ...customProps } = {}) => {
    const props = getProps(customProps);

    return shallowUntilTarget(<RatingsByStar {...props} />, RatingsByStarBase, {
      shallowOptions: createContextWithFakeRouter({ location }),
    });
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
    const root = render({ addon: null });

    expect(root.find('.RatingsByStar-row')).toHaveLength(5);
    expect(root.find('.RatingsByStar-count').find(LoadingText)).toHaveLength(5);
    expect(root.find('.RatingsByStar-barContainer')).toHaveLength(5);
    expect(root.find('.RatingsByStar-barFrame')).toHaveLength(5);
    // In loading state, we do not render a bar value
    expect(root.find('.RatingsByStar-barValue')).toHaveLength(0);
  });

  it('renders star labels, bars and links', () => {
    const grouping = {
      5: 964,
      4: 821,
      3: 543,
      2: 1,
      1: 0,
    };
    const addon = addonForGrouping(grouping);
    const root = render({ addon });
    const ratingsByStarRow = root.find('.RatingsByStar-row').find(Link);

    function validateLink(link, score, expectedTitle) {
      expect(link).toHaveProp(
        'to',
        reviewListURL({ addonSlug: addon.slug, score }),
      );
      expect(link).toHaveProp('title', expectedTitle);
    }

    [ratingsByStarRow].forEach((links) => {
      validateLink(links.at(0), '5', 'Read all 964 five-star reviews');
      validateLink(links.at(1), '4', 'Read all 821 four-star reviews');
      validateLink(links.at(2), '3', 'Read all 543 three-star reviews');
      validateLink(links.at(3), '2', 'Read the 1 two-star review');
      validateLink(links.at(4), '1', 'There are no one-star reviews');
    });
  });

  it('renders star counts', () => {
    const grouping = {
      5: 964,
      4: 821,
      3: 543,
      2: 1,
      1: 0,
    };
    const addon = addonForGrouping(grouping);
    const root = render({ addon });
    const rows = root.find('.RatingsByStar-row').find(Link);

    function validateLink(link, score, expectedTitle) {
      expect(link).toHaveProp(
        'to',
        reviewListURL({ addonSlug: addon.slug, score }),
      );
      expect(link).toHaveProp('title', expectedTitle);
    }

    validateLink(rows.at(0), '5', 'Read all 964 five-star reviews');
    validateLink(rows.at(1), '4', 'Read all 821 four-star reviews');
    validateLink(rows.at(2), '3', 'Read all 543 three-star reviews');
    validateLink(rows.at(3), '2', 'Read the 1 two-star review');
    validateLink(rows.at(4), '1', 'There are no one-star reviews');
  });

  it('adds UTM query parameters to the review links when there are some', () => {
    const utm_medium = 'some-utm-medium';
    const location = createFakeLocation({ query: { utm_medium } });
    const grouping = {
      5: 964,
      4: 821,
      3: 543,
      2: 22,
      1: 0,
    };
    const addon = addonForGrouping(grouping);
    const root = render({ addon, location });
    const rows = root.find('.RatingsByStar-row').find(Link);

    function validateLink(link, score) {
      const expectedQueryString = [
        `score=${score}`,
        `utm_medium=${utm_medium}`,
      ].join('&');
      expect(link).toHaveProp(
        'to',
        `/addon/${addon.slug}/reviews/?${expectedQueryString}`,
      );
    }

    validateLink(rows.at(0), '5');
    validateLink(rows.at(1), '4');
    validateLink(rows.at(2), '3');
    validateLink(rows.at(3), '2');
    validateLink(rows.at(4), '1');
  });

  it('renders IconStar', () => {
    const root = render();
    const star = root.find(IconStar).at(0);
    expect(star).toHaveLength(1);
    expect(star).toHaveProp('selected');
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
    const root = render({ addon });

    const barValues = root.find('.RatingsByStar-barValue');
    expect(barValues.at(0)).toHaveClassName('RatingsByStar-barValue--7pct');
    expect(barValues.at(1)).toHaveClassName('RatingsByStar-barValue--13pct');
    expect(barValues.at(2)).toHaveClassName('RatingsByStar-barValue--20pct');
    expect(barValues.at(3)).toHaveClassName('RatingsByStar-barValue--27pct');
    expect(barValues.at(4)).toHaveClassName('RatingsByStar-barValue--33pct');
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
    const root = render({ addon });

    const barValues = root.find('.RatingsByStar-barValue');

    expect(barValues.at(0)).toHaveClassName('RatingsByStar-barValue--100pct');
    expect(barValues.at(0)).not.toHaveClassName('RatingsByStar-partialBar');

    expect(barValues.at(1)).toHaveClassName('RatingsByStar-barValue--0pct');
    expect(barValues.at(1)).toHaveClassName('RatingsByStar-partialBar');
  });

  it('renders 0% bar values when ratings are all 0', () => {
    const grouping = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const addon = addonForGrouping(grouping);
    const root = render({ addon });

    const barValues = root.find('.RatingsByStar-barValue');
    for (const index of [0, 1, 2, 3, 4]) {
      expect(barValues.at(index)).toHaveClassName(
        'RatingsByStar-barValue--0pct',
      );
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
    const root = render({ addon, i18n: fakeI18n({ lang: 'de' }) });

    expect(root.find('.RatingsByStar-count').at(0)).toHaveText('1.000');
  });
});
