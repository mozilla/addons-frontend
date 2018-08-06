import * as React from 'react';

import { fetchGroupedRatings, setGroupedRatings } from 'amo/actions/reviews';
import RatingsByStar, {
  extractId,
  RatingsByStarBase,
} from 'amo/components/RatingsByStar';
import { ErrorHandler } from 'core/errorHandler';
import { createInternalAddon } from 'core/reducers/addons';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';
import { dispatchClientMetadata, fakeAddon } from 'tests/unit/amo/helpers';
import ErrorList from 'ui/components/ErrorList';
import LoadingText from 'ui/components/LoadingText';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const getProps = ({
    addon = createInternalAddon(fakeAddon),
    ...customProps
  } = {}) => {
    return { addon, i18n: fakeI18n(), store, ...customProps };
  };

  const render = (customProps = {}) => {
    const props = getProps(customProps);

    return shallowUntilTarget(<RatingsByStar {...props} />, RatingsByStarBase);
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

    expect(root.find('.RatingsByStar-count').find(LoadingText)).toHaveLength(5);
  });

  it('renders a loading state without grouped ratings', () => {
    const root = render({ addon: createInternalAddon(fakeAddon) });

    expect(root.find('.RatingsByStar-count').find(LoadingText)).toHaveLength(5);
  });

  it('renders star labels', () => {
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

    const counts = root.find('.RatingsByStar-star span');
    expect(counts.at(0)).toHaveText('5');
    expect(counts.at(1)).toHaveText('4');
    expect(counts.at(2)).toHaveText('3');
    expect(counts.at(3)).toHaveText('2');
    expect(counts.at(4)).toHaveText('1');
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

    const counts = root.find('.RatingsByStar-count');
    expect(counts.at(0)).toHaveText(grouping[5].toString());
    expect(counts.at(1)).toHaveText(grouping[4].toString());
    expect(counts.at(2)).toHaveText(grouping[3].toString());
    expect(counts.at(3)).toHaveText(grouping[2].toString());
    expect(counts.at(4)).toHaveText(grouping[1].toString());
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

    expect(root.find('.RatingsByStar-count').at(0)).toHaveText('1.000');
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

    // Render without an add-on to trigger a loading state.
    const root = render({ addon: null, errorHandler });

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
