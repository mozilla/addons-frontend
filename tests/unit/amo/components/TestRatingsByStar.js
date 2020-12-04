import * as React from 'react';

import Link from 'amo/components/Link';
import { fetchGroupedRatings, setGroupedRatings } from 'amo/actions/reviews';
import RatingsByStar, {
  extractId,
  RatingsByStarBase,
} from 'amo/components/RatingsByStar';
import { reviewListURL } from 'amo/reducers/reviews';
import { ErrorHandler } from 'core/errorHandler';
import {
  createContextWithFakeRouter,
  createFakeLocation,
  createInternalAddonWithLang,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import ErrorList from 'ui/components/ErrorList';
import IconStar from 'ui/components/IconStar';
import LoadingText from 'ui/components/LoadingText';

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
      },
      ...addonParams,
    });
  };

  const createErrorHandlerWithError = () => {
    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(new Error('some unexpected error'));
    return errorHandler;
  };

  it('fetches groupedRatings upon construction', () => {
    const addon = createInternalAddonWithLang({ ...fakeAddon, id: 222 });
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ addon });

    sinon.assert.calledWith(
      dispatchSpy,
      fetchGroupedRatings({
        addonId: addon.id,
        errorHandlerId: root.instance().props.errorHandler.id,
      }),
    );
  });

  it('fetches groupedRatings on update', () => {
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ addon: null });

    dispatchSpy.resetHistory();
    const addon = createInternalAddonWithLang({ ...fakeAddon, id: 222 });
    root.setProps({ addon });

    sinon.assert.calledWith(
      dispatchSpy,
      fetchGroupedRatings({
        addonId: addon.id,
        errorHandlerId: root.instance().props.errorHandler.id,
      }),
    );
  });

  it('only fetches groupedRatings when needed', () => {
    const addon = createInternalAddonWithLang({ ...fakeAddon, id: 222 });
    const dispatchSpy = sinon.spy(store, 'dispatch');
    store.dispatch(
      setGroupedRatings({
        addonId: addon.id,
        grouping: {
          5: 1,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      }),
    );
    const root = render({ addon });

    dispatchSpy.resetHistory();
    // Simulate any kind of props update.
    root.setProps();

    sinon.assert.notCalled(dispatchSpy);
  });

  it('renders a loading state without an add-on', () => {
    const root = render({ addon: null });

    expect(root.find('.RatingsByStar-count').find(LoadingText)).toHaveLength(5);
    expect(root.find('.RatingsByStar-barContainer')).toHaveLength(5);
    expect(root.find('.RatingsByStar-barFrame')).toHaveLength(5);
    // In loading state, we do not render a bar value
    expect(root.find('.RatingsByStar-barValue')).toHaveLength(0);
  });

  it('renders a loading state without grouped ratings', () => {
    const root = render({ addon: createInternalAddonWithLang(fakeAddon) });

    expect(root.find('.RatingsByStar-count').find(LoadingText)).toHaveLength(5);
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
    store.dispatch(setGroupedRatings({ addonId: addon.id, grouping }));
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
    store.dispatch(setGroupedRatings({ addonId: addon.id, grouping }));
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
    store.dispatch(setGroupedRatings({ addonId: addon.id, grouping }));
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
    // Set up an add-on with one 5-star rating and one 4-star rating.
    const grouping = {
      5: 1,
      4: 1,
      3: 0,
      2: 0,
      1: 0,
    };
    const addon = addonForGrouping(grouping);
    store.dispatch(setGroupedRatings({ addonId: addon.id, grouping }));
    const root = render({ addon });

    const barValues = root.find('.RatingsByStar-barValue');
    expect(barValues.at(0)).toHaveProp('style', { width: '50%' });
    expect(barValues.at(1)).toHaveProp('style', { width: '50%' });
    expect(barValues.at(2)).toHaveProp('style', { width: '0%' });
    expect(barValues.at(3)).toHaveProp('style', { width: '0%' });
    expect(barValues.at(4)).toHaveProp('style', { width: '0%' });
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
    store.dispatch(setGroupedRatings({ addonId: addon.id, grouping }));
    const root = render({ addon });

    const barValues = root.find('.RatingsByStar-barValue');

    expect(barValues.at(0)).toHaveProp('style', { width: '100%' });
    expect(barValues.at(0)).not.toHaveClassName('RatingsByStar-partialBar');

    expect(barValues.at(1)).toHaveProp('style', { width: '0%' });
    expect(barValues.at(1)).toHaveClassName('RatingsByStar-partialBar');
  });

  it('renders 0% bar values when ratings do not exist', () => {
    const grouping = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const addon = addonForGrouping(grouping, {
      // This add-on does not have any ratings yet.
      ratings: undefined,
    });
    store.dispatch(setGroupedRatings({ addonId: addon.id, grouping }));
    const root = render({ addon });

    const barValues = root.find('.RatingsByStar-barValue');
    for (const index of [0, 1, 2, 3, 4]) {
      expect(barValues.at(index)).toHaveProp('style', { width: '0%' });
    }
  });

  it('renders 0% bar values when ratings are all 0', () => {
    const grouping = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const addon = addonForGrouping(grouping);
    store.dispatch(setGroupedRatings({ addonId: addon.id, grouping }));
    const root = render({ addon });

    const barValues = root.find('.RatingsByStar-barValue');
    for (const index of [0, 1, 2, 3, 4]) {
      expect(barValues.at(index)).toHaveProp('style', { width: '0%' });
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
    store.dispatch(setGroupedRatings({ addonId: addon.id, grouping }));
    const root = render({ addon, i18n: fakeI18n({ lang: 'de' }) });

    expect(
      root.find('.RatingsByStar-count').at(0).find(Link).children(),
    ).toHaveText('1.000');
  });

  it('renders errors', () => {
    const errorHandler = createErrorHandlerWithError();
    const root = render({ errorHandler });

    expect(root.find(ErrorList)).toHaveLength(1);
  });

  it('does not fetch data when there is an error', () => {
    const errorHandler = createErrorHandlerWithError();
    const dispatchSpy = sinon.spy(store, 'dispatch');

    render({ errorHandler, addon: createInternalAddonWithLang(fakeAddon) });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('does not render a loading state when there is an error', () => {
    const errorHandler = createErrorHandlerWithError();

    // Render without setGroupedRatings to trigger a loading state.
    const root = render({ errorHandler });

    expect(root.find(LoadingText)).toHaveLength(0);
  });

  describe('extractId', () => {
    it('returns empty without an add-on', () => {
      expect(extractId(getProps({ addon: null }))).toEqual('');
    });

    it('makes an ID with the add-on', () => {
      const addon = createInternalAddonWithLang({ ...fakeAddon, id: 1 });
      expect(extractId(getProps({ addon }))).toEqual(`addon-${addon.id}`);
    });
  });
});
