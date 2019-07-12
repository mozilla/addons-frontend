import * as React from 'react';

import SearchFilters, { SearchFiltersBase } from 'amo/components/SearchFilters';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEMES_FILTER,
  OS_LINUX,
  SEARCH_SORT_RANDOM,
  SEARCH_SORT_RECOMMENDED,
  SEARCH_SORT_RELEVANCE,
  SEARCH_SORT_TRENDING,
} from 'core/constants';
import { searchStart } from 'core/reducers/search';
import { convertFiltersToQueryParams } from 'core/searchUtils';
import Select from 'ui/components/Select';
import {
  createContextWithFakeRouter,
  createFakeEvent,
  createFakeHistory,
  createFakeLocation,
  createStubErrorHandler,
  dispatchClientMetadata,
  fakeI18n,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let fakeHistory;

  function render({
    _config = getFakeConfig({
      enableFeatureRecommendedBadges: false,
    }),
    filters = {},
    pathname = '/search/',
    store = dispatchClientMetadata().store,
    ...props
  } = {}) {
    const errorHandler = createStubErrorHandler();

    store.dispatch(searchStart({ errorHandlerId: errorHandler.id, filters }));

    return shallowUntilTarget(
      <SearchFilters
        _config={_config}
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
      pathname: `/en-US/android/search/`,
      query: convertFiltersToQueryParams({
        addonType: ADDON_TYPE_EXTENSION,
        query: 'Music player',
      }),
    });
  });

  it('changes the URL when a new OS filter is selected', () => {
    const root = render({ filters: { query: 'Music player' } });

    const select = root.find('.SearchFilters-OperatingSystem');
    const currentTarget = {
      getAttribute: () => {
        return select.prop('name');
      },
      value: OS_LINUX,
    };

    select.simulate('change', createFakeEvent({ currentTarget }));

    sinon.assert.calledWithExactly(fakeHistory.push, {
      pathname: `/en-US/android/search/`,
      query: convertFiltersToQueryParams({
        operatingSystem: OS_LINUX,
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
      pathname: `/en-US/android/search/`,
      query: convertFiltersToQueryParams({
        query: 'Music player',
        sort: SEARCH_SORT_TRENDING,
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
      pathname: `/en-US/android/search/`,
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
      pathname: `/en-US/android/search/`,
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
      pathname: `/en-US/android/search/`,
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

  describe('Checkbox with enableFeatureRecommendedBadges on', () => {
    const _config = getFakeConfig({ enableFeatureRecommendedBadges: true });

    it('defaults the recommended checkbox to true when the filter is set', () => {
      const root = render({ _config, filters: { recommended: true } });

      const checkbox = root.find('.SearchFilters-Recommended');
      expect(checkbox).toHaveProp('checked', true);
    });

    it('defaults the recommended checkbox to false when the filter is not set', () => {
      const root = render({ _config });

      const checkbox = root.find('.SearchFilters-Recommended');
      expect(checkbox).toHaveProp('checked', false);
    });

    it('changes the URL when recommended checkbox is checked', () => {
      const root = render({ _config, filters: { query: 'Music player' } });

      const checkbox = root.find('.SearchFilters-Recommended');
      checkbox.simulate('change', createFakeEvent());

      sinon.assert.calledWithExactly(fakeHistory.push, {
        pathname: `/en-US/android/search/`,
        query: convertFiltersToQueryParams({
          recommended: true,
          query: 'Music player',
        }),
      });
    });

    it('deletes recommended filter when checkbox is unchecked', () => {
      const root = render({
        _config,
        filters: {
          recommended: true,
          query: 'Music player',
        },
      });

      const checkbox = root.find('.SearchFilters-Recommended');
      checkbox.simulate('change', createFakeEvent());

      sinon.assert.calledWithExactly(fakeHistory.push, {
        pathname: `/en-US/android/search/`,
        query: convertFiltersToQueryParams({
          query: 'Music player',
        }),
      });
    });

    it('resets the page filter when checkbox is checked', () => {
      const root = render({
        _config,
        filters: {
          page: 42,
          query: 'Music player',
        },
      });

      const checkbox = root.find('.SearchFilters-Recommended');
      checkbox.simulate('change', createFakeEvent());

      sinon.assert.calledWithExactly(fakeHistory.push, {
        pathname: `/en-US/android/search/`,
        query: convertFiltersToQueryParams({
          recommended: true,
          page: '1',
          query: 'Music player',
        }),
      });
    });

    it('resets the page filter when checkbox is unchecked', () => {
      const root = render({
        _config,
        filters: {
          recommended: true,
          page: '42',
          query: 'Music player',
        },
      });

      const checkbox = root.find('.SearchFilters-Recommended');
      checkbox.simulate('change', createFakeEvent());

      sinon.assert.calledWithExactly(fakeHistory.push, {
        pathname: `/en-US/android/search/`,
        query: convertFiltersToQueryParams({
          page: '1',
          query: 'Music player',
        }),
      });
    });

    it('does not pass sort=random when the recommended checkbox is unchecked', () => {
      const root = render({
        _config,
        filters: {
          recommended: true,
          sort: SEARCH_SORT_RANDOM,
        },
      });

      const checkbox = root.find('.SearchFilters-Recommended');
      checkbox.simulate('change', createFakeEvent());

      sinon.assert.calledWithExactly(fakeHistory.push, {
        pathname: `/en-US/android/search/`,
        query: convertFiltersToQueryParams({}),
      });
    });
  });

  describe('Checkbox with enableFeatureRecommendedBadges off', () => {
    const _config = getFakeConfig({ enableFeatureRecommendedBadges: false });

    it('defaults the featured checkbox to true when the filter is set', () => {
      const root = render({ _config, filters: { featured: true } });

      const checkbox = root.find('.SearchFilters-Recommended');
      expect(checkbox).toHaveProp('checked', true);
    });

    it('defaults the featured checkbox to false when the filter is not set', () => {
      const root = render({ _config });

      const checkbox = root.find('.SearchFilters-Recommended');
      expect(checkbox).toHaveProp('checked', false);
    });

    it('changes the URL when featured checkbox is checked', () => {
      const root = render({ _config, filters: { query: 'Music player' } });

      const checkbox = root.find('.SearchFilters-Recommended');
      checkbox.simulate('change', createFakeEvent());

      sinon.assert.calledWithExactly(fakeHistory.push, {
        pathname: `/en-US/android/search/`,
        query: convertFiltersToQueryParams({
          featured: true,
          query: 'Music player',
        }),
      });
    });

    it('deletes featured filter when checkbox is unchecked', () => {
      const root = render({
        _config,
        filters: {
          featured: true,
          query: 'Music player',
        },
      });

      const checkbox = root.find('.SearchFilters-Recommended');
      checkbox.simulate('change', createFakeEvent());

      sinon.assert.calledWithExactly(fakeHistory.push, {
        pathname: `/en-US/android/search/`,
        query: convertFiltersToQueryParams({
          query: 'Music player',
        }),
      });
    });

    it('resets the page filter when checkbox is checked', () => {
      const root = render({
        _config,
        filters: {
          page: 42,
          query: 'Music player',
        },
      });

      const checkbox = root.find('.SearchFilters-Recommended');
      checkbox.simulate('change', createFakeEvent());

      sinon.assert.calledWithExactly(fakeHistory.push, {
        pathname: `/en-US/android/search/`,
        query: convertFiltersToQueryParams({
          featured: true,
          page: '1',
          query: 'Music player',
        }),
      });
    });

    it('resets the page filter when checkbox is unchecked', () => {
      const root = render({
        _config,
        filters: {
          featured: true,
          page: '42',
          query: 'Music player',
        },
      });

      const checkbox = root.find('.SearchFilters-Recommended');
      checkbox.simulate('change', createFakeEvent());

      sinon.assert.calledWithExactly(fakeHistory.push, {
        pathname: `/en-US/android/search/`,
        query: convertFiltersToQueryParams({
          page: '1',
          query: 'Music player',
        }),
      });
    });

    it('does not pass sort=random when the featured checkbox is unchecked', () => {
      const root = render({
        _config,
        filters: {
          featured: true,
          sort: SEARCH_SORT_RANDOM,
        },
      });

      const checkbox = root.find('.SearchFilters-Recommended');
      checkbox.simulate('change', createFakeEvent());

      sinon.assert.calledWithExactly(fakeHistory.push, {
        pathname: `/en-US/android/search/`,
        query: convertFiltersToQueryParams({}),
      });
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
      pathname: `/en-US/android/search/`,
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

  it('sets themes filters shelf with the ADDON_TYPE_THEMES_FILTER filter', () => {
    const root = render();
    const selectFilters = root.find(Select);

    const optionValues = selectFilters
      .find('#SearchFilters-AddonType')
      .children()
      .map((option) => option.props().value);
    expect(optionValues).toContain(ADDON_TYPE_THEMES_FILTER);
  });
});
