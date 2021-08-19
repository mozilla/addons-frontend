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
      2: 22,
      1: 0,
    };
    const addon = addonForGrouping(grouping);
    const root = render({ addon });
    const counts = root.find('.RatingsByStar-star').find(Link);
    const bars = root.find('.RatingsByStar-barContainer').find(Link);

    function validateLink(link, score, expectedTitle) {
      expect(link).toHaveProp(
        'to',
        reviewListURL({ addonSlug: addon.slug, score }),
      );
      expect(link).toHaveProp('title', expectedTitle);
    }

    [counts, bars].forEach((links) => {
      validateLink(links.at(0), '5', 'Read all five-star reviews');
      validateLink(links.at(1), '4', 'Read all four-star reviews');
      validateLink(links.at(2), '3', 'Read all three-star reviews');
      validateLink(links.at(3), '2', 'Read all two-star reviews');
      validateLink(links.at(4), '1', 'Read all one-star reviews');
    });

    expect(counts.at(0).children()).toHaveText('5');
    expect(counts.at(1).children()).toHaveText('4');
    expect(counts.at(2).children()).toHaveText('3');
    expect(counts.at(3).children()).toHaveText('2');
    expect(counts.at(4).children()).toHaveText('1');
  });

  it('renders star counts', () => {
    const grouping = {
      5: 964,
      4: 821,
      3: 543,
      2: 22,
      1: 0,
    };
    const addon = addonForGrouping(grouping);
    const root = render({ addon });
    const counts = root.find('.RatingsByStar-count').find(Link);

    function validateLink(link, score, expectedTitle) {
      expect(link.children()).toHaveText(grouping[score].toString());
      expect(link).toHaveProp(
        'to',
        reviewListURL({ addonSlug: addon.slug, score }),
      );
      expect(link).toHaveProp('title', expectedTitle);
    }

    validateLink(counts.at(0), '5', 'Read all five-star reviews');
    validateLink(counts.at(1), '4', 'Read all four-star reviews');
    validateLink(counts.at(2), '3', 'Read all three-star reviews');
    validateLink(counts.at(3), '2', 'Read all two-star reviews');
    validateLink(counts.at(4), '1', 'Read all one-star reviews');
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
    const counts = root.find('.RatingsByStar-count').find(Link);

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

    validateLink(counts.at(0), '5');
    validateLink(counts.at(1), '4');
    validateLink(counts.at(2), '3');
    validateLink(counts.at(3), '2');
    validateLink(counts.at(4), '1');
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
    expect(barValues.at(0)).toHaveClassName('RatingsByStar-barValue--7px');
    expect(barValues.at(1)).toHaveClassName('RatingsByStar-barValue--13px');
    expect(barValues.at(2)).toHaveClassName('RatingsByStar-barValue--20px');
    expect(barValues.at(3)).toHaveClassName('RatingsByStar-barValue--27px');
    expect(barValues.at(4)).toHaveClassName('RatingsByStar-barValue--33px');
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

    expect(barValues.at(0)).toHaveClassName('RatingsByStar-barValue--100px');
    expect(barValues.at(0)).not.toHaveClassName('RatingsByStar-partialBar');

    expect(barValues.at(1)).toHaveClassName('RatingsByStar-barValue--0px');
    expect(barValues.at(1)).toHaveClassName('RatingsByStar-partialBar');
  });

  it('renders 0% bar values when ratings are all 0', () => {
    const grouping = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const addon = addonForGrouping(grouping);
    const root = render({ addon });

    const barValues = root.find('.RatingsByStar-barValue');
    for (const index of [0, 1, 2, 3, 4]) {
      expect(barValues.at(index)).toHaveClassName(
        'RatingsByStar-barValue--0px',
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

    expect(
      root.find('.RatingsByStar-count').at(0).find(Link).children(),
    ).toHaveText('1.000');
  });
});
