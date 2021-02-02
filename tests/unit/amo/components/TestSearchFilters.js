import * as React from 'react';

import SearchFilters, {
  NO_FILTER,
  SearchFiltersBase,
} from 'amo/components/SearchFilters';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  RECOMMENDED,
  SEARCH_SORT_RANDOM,
  SEARCH_SORT_RECOMMENDED,
  SEARCH_SORT_RELEVANCE,
  SEARCH_SORT_TRENDING,
} from 'amo/constants';
import { searchStart } from 'amo/reducers/search';
import { convertFiltersToQueryParams } from 'amo/searchUtils';
import Select from 'amo/components/Select';
import {
  createContextWithFakeRouter,
  createFakeEvent,
  createFakeHistory,
  createFakeLocation,
  createStubErrorHandler,
  dispatchClientMetadata,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let fakeHistory;

  function render({
    filters = {},
    pathname = '/search/',
    store = dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX }).store,
    ...props
  } = {}) {
    const errorHandler = createStubErrorHandler();

    store.dispatch(searchStart({ errorHandlerId: errorHandler.id, filters }));

    return shallowUntilTarget(
      <SearchFilters
        i18n={fakeI18n()}
        pathname={pathname}
        store={store}
        {...props}
      />,
      SearchFiltersBase,
      {
        shallowOptions: createContextWithFakeRouter({
          history: fakeHistory,
          location: createFakeLocation({ pathname }),
        }),
      },
    );
  }

  beforeEach(() => {
    fakeHistory = createFakeHistory();
  });

  it('renders a SearchFilters component', () => {
    const root = render();

    expect(root.find('.SearchFilters')).toHaveLength(1);
  });

  it('changes the URL when a new addonType filter is selected', () => {
    const root = render({ filters: { query: 'Music player' } });

    const select = root.find('.SearchFilters-AddonType');
    const currentTarget = {
      getAttribute: () => {
        return select.prop('name');
      },
      value: ADDON_TYPE_EXTENSION,
    };

    select.simulate('change', createFakeEvent({ currentTarget }));

    sinon.assert.calledWithExactly(fakeHistory.push, {
      pathname: `/en-US/${CLIENT_APP_FIREFOX}/search/`,
      query: convertFiltersToQueryParams({
        addonType: ADDON_TYPE_EXTENSION,
        query: 'Music player',
      }),
    });
  });

  it('changes the URL when a new sort filter is selected', () => {
    const root = render({ filters: { query: 'Music player' } });

    const select = root.find('.SearchFilters-Sort');
    const currentTarget = {
      getAttribute: () => {
        return select.prop('name');
      },
      value: SEARCH_SORT_TRENDING,
    };

    select.simulate('change', createFakeEvent({ currentTarget }));

    sinon.assert.calledWithExactly(fakeHistory.push, {
      pathname: `/en-US/${CLIENT_APP_FIREFOX}/search/`,
      query: convertFiltersToQueryParams({
        query: 'Music player',
        sort: SEARCH_SORT_TRENDING,
      }),
    });
  });

  it('changes the URL when a new promoted filter is selected', () => {
    const root = render({ filters: { query: 'Music player' } });

    const select = root.find('.SearchFilters-Badging');
    const currentTarget = {
      getAttribute: () => {
        return select.prop('name');
      },
      value: RECOMMENDED,
    };

    select.simulate('change', createFakeEvent({ currentTarget }));

    sinon.assert.calledWithExactly(fakeHistory.push, {
      pathname: `/en-US/${CLIENT_APP_FIREFOX}/search/`,
      query: convertFiltersToQueryParams({
        promoted: RECOMMENDED,
        query: 'Music player',
      }),
    });
  });

  it('forces recommended add-ons to the top when a category is specified and a new sort filter is selected', () => {
    const root = render({
      filters: { query: 'Music player', category: 'some-category' },
    });

    const select = root.find('.SearchFilters-Sort');
    const currentTarget = {
      getAttribute: () => {
        return select.prop('name');
      },
      value: SEARCH_SORT_TRENDING,
    };

    select.simulate('change', createFakeEvent({ currentTarget }));

    sinon.assert.calledWithExactly(fakeHistory.push, {
      pathname: `/en-US/${CLIENT_APP_FIREFOX}/search/`,
      query: convertFiltersToQueryParams({
        category: 'some-category',
        query: 'Music player',
        sort: `${SEARCH_SORT_RECOMMENDED},${SEARCH_SORT_TRENDING}`,
      }),
    });
  });

  it('does not add recommended twice when a category is specified and a recommended sort filter is selected', () => {
    const root = render({
      filters: { query: 'Music player', category: 'some-category' },
    });

    const select = root.find('.SearchFilters-Sort');
    const currentTarget = {
      getAttribute: () => {
        return select.prop('name');
      },
      value: SEARCH_SORT_RECOMMENDED,
    };

    select.simulate('change', createFakeEvent({ currentTarget }));

    sinon.assert.calledWithExactly(fakeHistory.push, {
      pathname: `/en-US/${CLIENT_APP_FIREFOX}/search/`,
      query: convertFiltersToQueryParams({
        category: 'some-category',
        query: 'Music player',
        sort: SEARCH_SORT_RECOMMENDED,
      }),
    });
  });

  it('selects the sort criterion in the sort select', () => {
    const sort = SEARCH_SORT_TRENDING;
    const root = render({
      filters: {
        query: 'Music player',
        sort,
      },
    });

    expect(root.find('.SearchFilters-Sort')).toHaveProp('value', sort);
  });

  it.each([
    `${SEARCH_SORT_RECOMMENDED},${SEARCH_SORT_TRENDING}`,
    `${SEARCH_SORT_TRENDING},${SEARCH_SORT_RECOMMENDED}`,
    `${SEARCH_SORT_TRENDING},${SEARCH_SORT_RECOMMENDED},${SEARCH_SORT_RELEVANCE}`,
  ])(
    'selects the first non-recommended sort criterion in the sort select: %s',
    (sort) => {
      const root = render({
        filters: {
          query: 'Music player',
          sort,
        },
      });

      expect(root.find('.SearchFilters-Sort')).toHaveProp(
        'value',
        SEARCH_SORT_TRENDING,
      );
    },
  );

  it('selects SEARCH_SORT_RELEVANCE in the sort select if there is no sort criteria', () => {
    const root = render({
      filters: {
        query: 'Music player',
      },
    });

    expect(root.find('.SearchFilters-Sort')).toHaveProp(
      'value',
      SEARCH_SORT_RELEVANCE,
    );
  });

  it('selects SEARCH_SORT_RELEVANCE if the only the sort criterion is SEARCH_SORT_RECOMMENDED', () => {
    const root = render({
      filters: {
        query: 'Music player',
        sort: SEARCH_SORT_RECOMMENDED,
      },
    });

    expect(root.find('.SearchFilters-Sort')).toHaveProp(
      'value',
      SEARCH_SORT_RELEVANCE,
    );
  });

  it('deletes the filter if it is empty', () => {
    const root = render({
      filters: {
        addonType: ADDON_TYPE_EXTENSION,
        query: 'Cool things',
      },
    });

    const select = root.find('.SearchFilters-AddonType');
    const currentTarget = {
      getAttribute: () => {
        return select.prop('name');
      },
      value: '',
    };

    select.simulate('change', createFakeEvent({ currentTarget }));

    sinon.assert.calledWithExactly(fakeHistory.push, {
      pathname: `/en-US/${CLIENT_APP_FIREFOX}/search/`,
      query: convertFiltersToQueryParams({
        query: 'Cool things',
      }),
    });
  });

  it('does not change the URL when the same filter is selected', () => {
    const root = render({
      filters: {
        addonType: ADDON_TYPE_EXTENSION,
        query: 'Music player',
      },
    });

    const select = root.find('.SearchFilters-AddonType');
    const currentTarget = {
      getAttribute: () => {
        return select.prop('name');
      },
      value: ADDON_TYPE_EXTENSION,
    };

    select.simulate('change', createFakeEvent({ currentTarget }));

    sinon.assert.notCalled(fakeHistory.push);
  });

  it('does not pass sort=random when a promoted filter is not selected', () => {
    const root = render({
      filters: {
        promoted: RECOMMENDED,
        sort: SEARCH_SORT_RANDOM,
      },
    });

    const select = root.find('.SearchFilters-Badging');
    const currentTarget = {
      getAttribute: () => {
        return select.prop('name');
      },
      value: NO_FILTER,
    };

    select.simulate('change', createFakeEvent({ currentTarget }));

    sinon.assert.calledWithExactly(fakeHistory.push, {
      pathname: `/en-US/${CLIENT_APP_FIREFOX}/search/`,
      query: convertFiltersToQueryParams({}),
    });
  });

  it('resets the page filter when a select is updated', () => {
    const root = render({
      filters: {
        page: '42',
        query: 'Cool things',
      },
    });

    const select = root.find('.SearchFilters-AddonType');
    const currentTarget = {
      getAttribute: () => {
        return select.prop('name');
      },
      value: ADDON_TYPE_EXTENSION,
    };

    select.simulate('change', createFakeEvent({ currentTarget }));

    sinon.assert.calledWithExactly(fakeHistory.push, {
      pathname: `/en-US/${CLIENT_APP_FIREFOX}/search/`,
      query: convertFiltersToQueryParams({
        addonType: ADDON_TYPE_EXTENSION,
        page: '1',
        query: 'Cool things',
      }),
    });
  });

  it('does not display the addonType filter when a category is defined', () => {
    // See: https://github.com/mozilla/addons-frontend/issues/3747
    const root = render({ filters: { category: 'abstract' } });

    expect(root.find('.SearchFilters-AddonType')).toHaveLength(0);
  });

  it('does not display the addonType filter on Android', () => {
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID });
    const root = render({ store });

    expect(root.find('.SearchFilters-AddonType')).toHaveLength(0);
  });

  it('does not display the badging filter on Android', () => {
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID });
    const root = render({ store });

    expect(root.find('.SearchFilters-Badging')).toHaveLength(0);
  });

  it('renders a theme option', () => {
    const root = render();
    const selectFilters = root.find(Select);

    const optionValues = selectFilters
      .find('#SearchFilters-AddonType')
      .children()
      .map((option) => option.props().value);
    expect(optionValues).toContain(ADDON_TYPE_STATIC_THEME);
  });

  it('selects the promoted criterion in the promoted select', () => {
    const promoted = RECOMMENDED;
    const root = render({
      filters: {
        query: 'Music player',
        promoted,
      },
    });

    expect(root.find('.SearchFilters-Badging')).toHaveProp('value', promoted);
  });
});
