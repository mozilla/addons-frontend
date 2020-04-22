import * as React from 'react';

import { fetchGroupedRatings, setGroupedRatings } from 'amo/actions/reviews';
import RatingsByStar, {
  extractId,
  RatingsByStarBase,
} from 'amo/components/RatingsByStar';
import { reviewListURL } from 'amo/reducers/reviews';
import { CLIENT_APP_FIREFOX } from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import { createInternalAddon } from 'core/reducers/addons';
import {
  createContextWithFakeRouter,
  createFakeHistory,
  createFakeLocation,
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
  let fakeHistory;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
    fakeHistory = createFakeHistory();
  });

  const getProps = ({
    addon = createInternalAddon(fakeAddon),
    ...customProps
  } = {}) => {
    return { addon, i18n: fakeI18n(), store, ...customProps };
  };

  const render = ({ location, ...customProps } = {}) => {
    const props = getProps(customProps);

    return shallowUntilTarget(<RatingsByStar {...props} />, RatingsByStarBase, {
      shallowOptions: createContextWithFakeRouter({
        history: fakeHistory,
        location,
      }),
    });
  };

  const addonForGrouping = (grouping, addonParams = {}) => {
    return createInternalAddon({
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
    const addon = createInternalAddon({ ...fakeAddon, id: 222 });
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
    const addon = createInternalAddon({ ...fakeAddon, id: 222 });
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
    const addon = createInternalAddon({ ...fakeAddon, id: 222 });
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
    const tableRow = root.find('.RatingByStar-table-row');

    expect(tableRow.at(0)).not.toHaveProp('onClick');
    expect(tableRow.at(0)).not.toHaveProp('title');
    expect(root.find('.RatingsByStar-count').find(LoadingText)).toHaveLength(5);
    expect(root.find('.RatingsByStar-barContainer')).toHaveLength(5);
    expect(root.find('.RatingsByStar-barFrame')).toHaveLength(5);
    // In loading state, we do not render a bar value
    expect(root.find('.RatingsByStar-barValue')).toHaveLength(0);
  });

  it('renders a loading state without grouped ratings', () => {
    const root = render({ addon: createInternalAddon(fakeAddon) });

    expect(root.find('.RatingsByStar-count').find(LoadingText)).toHaveLength(5);
  });

  it('renders star labels, star counts and links', () => {
    const grouping = {
      5: 964,
      4: 821,
      3: 543,
      2: 22,
      1: 0,
    };
    const addon = addonForGrouping(grouping);
    const clientApp = CLIENT_APP_FIREFOX;
    const lang = 'en-US';

    dispatchClientMetadata({ clientApp, lang, store });
    store.dispatch(setGroupedRatings({ addonId: addon.id, grouping }));

    const root = render({ addon, history: fakeHistory, store });

    const tableRow = root.find('.RatingByStar-table-row');

    function validateLink(row, score, expectedTitle) {
      expect(row).toHaveProp(
        'to',
        `/${lang}/${clientApp}/${reviewListURL({
          addonSlug: addon.slug,
          score,
        })}`,
      );
      expect(row).toHaveProp('title', expectedTitle);

      const count = row.find('.RatingsByStar-star');
      const starCounts = row.find('.RatingsByStar-count');

      expect(count.children()).toHaveText(score);
      expect(starCounts.at(0).children()).toHaveText(
        grouping[score].toString(),
      );
    }

    it.each([[tableRow]], (row) => {
      validateLink(
        row.at(0),
        '5',
        `Read all ${grouping['5']} five-star reviews`,
      );
      validateLink(
        row.at(1),
        '4',
        `Read all ${grouping['4']} four-star reviews`,
      );
      validateLink(
        row.at(2),
        '3',
        `Read all ${grouping['3']} three-star reviews`,
      );
      validateLink(
        row.at(3),
        '2',
        `Read all ${grouping['2']} two-star reviews`,
      );
      validateLink(
        row.at(4),
        '1',
        `Read all ${grouping['1']} one-star reviews`,
      );
    });
  });

  it('adds a `src` query parameter to the review links when available in the location', () => {
    const src = 'some-src';
    const grouping = {
      5: 964,
      4: 821,
      3: 543,
      2: 22,
      1: 0,
    };
    const addon = addonForGrouping(grouping);
    const clientApp = CLIENT_APP_FIREFOX;
    const lang = 'en-US';

    dispatchClientMetadata({ clientApp, lang, store });
    store.dispatch(setGroupedRatings({ addonId: addon.id, grouping }));

    const root = render({
      addon,
      history: fakeHistory,
      location: createFakeLocation({ query: { src } }),
      store,
    });
    const tableRow = root.find('.RatingByStar-table-row');

    function validateLink(row, score) {
      expect(row).toHaveProp(
        'to',
        `/${lang}/${clientApp}/${reviewListURL({
          addonSlug: addon.slug,
          score,
          src,
        })}`,
      );
    }

    validateLink(tableRow.at(0), '5');
    validateLink(tableRow.at(1), '4');
    validateLink(tableRow.at(2), '3');
    validateLink(tableRow.at(3), '2');
    validateLink(tableRow.at(4), '1');
  });

  it('renders IconStar', () => {
    const root = render();
    const star = root.find(IconStar).at(0);

    expect(star).toHaveLength(1);
    expect(star).toHaveProp('selected');
  });

  it('renders when star count is undefined', () => {
    const grouping = {
      5: undefined,
      4: 1,
      3: 0,
      2: 0,
      1: 0,
    };
    const addon = addonForGrouping(grouping);
    store.dispatch(setGroupedRatings({ addonId: addon.id, grouping }));
    const root = render({ addon });
    const bar = root.find('.RatingsByStar-bar');

    expect(bar.at(0).children()).toHaveLength(0);
    expect(bar.at(1).children()).toHaveLength(1);
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
    const tableRow = root.find('.RatingByStar-table-row');

    expect(tableRow.at(0).find('.RatingsByStar-count').children()).toHaveText(
      '1.000',
    );
  });

  it('renders errors', () => {
    const errorHandler = createErrorHandlerWithError();
    const root = render({ errorHandler });

    expect(root.find(ErrorList)).toHaveLength(1);
  });

  it('does not fetch data when there is an error', () => {
    const errorHandler = createErrorHandlerWithError();
    const dispatchSpy = sinon.spy(store, 'dispatch');

    render({ errorHandler, addon: createInternalAddon(fakeAddon) });

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
      const addon = createInternalAddon({ ...fakeAddon, id: 1 });
      expect(extractId(getProps({ addon }))).toEqual(`addon-${addon.id}`);
    });
  });
});
