import * as React from 'react';

import SearchContextCard, {
  SearchContextCardBase,
} from 'amo/components/SearchContextCard';
import { fetchCategories, loadCategories } from 'core/reducers/categories';
import { searchStart } from 'core/reducers/search';
import {
  dispatchClientMetadata,
  dispatchSearchResults,
  fakeAddon,
  fakeCategory,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_THEMES_FILTER,
} from 'core/constants';

describe(__filename, () => {
  let _store;

  function render(customProps = {}) {
    const props = {
      store: _store,
      ...customProps,
    };

    return shallowUntilTarget(
      <SearchContextCard i18n={fakeI18n()} {...props} />,
      SearchContextCardBase,
    );
  }

  beforeEach(() => {
    _store = dispatchClientMetadata().store;
  });

  const _searchStart = ({ store = _store, filters = {} } = {}) => {
    store.dispatch(searchStart({ errorHandlerId: 'Search', filters }));
  };

  const _fetchCategories = ({ store = _store } = {}) => {
    store.dispatch(
      fetchCategories({ errorHandlerId: 'SearchContextCard-Categories' }),
    );
  };

  const _loadCategories = ({
    store = _store,
    results = [
      {
        ...fakeCategory,
        name: 'Causes',
        slug: 'causes',
      },
    ],
  } = {}) => {
    store.dispatch(loadCategories({ results }));
  };

  it('should render a card', () => {
    const root = render();

    expect(root).toHaveClassName('SearchContextCard');
  });

  it('should render "Searching" text while search loading without query', () => {
    _searchStart();
    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      'Searching for add-ons',
    );
  });

  it('should render during a search that is search loading', () => {
    _searchStart({ filters: { query: 'test' } });
    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      'Searching for "test"',
    );
  });

  it('should render search results', () => {
    dispatchSearchResults({ store: _store });
    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      '2 results found for "test"',
    );
  });

  it('should render results that lack a query', () => {
    dispatchSearchResults({ store: _store, filters: {} });
    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      '2 results found',
    );
  });

  it('should use singular form when only one result is found', () => {
    dispatchSearchResults({
      store: _store,
      addons: { [fakeAddon.slug]: fakeAddon },
    });
    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      '1 result found for "test"',
    );
  });

  it('should use singular form without query when only one result', () => {
    dispatchSearchResults({
      store: _store,
      addons: { [fakeAddon.slug]: fakeAddon },
      filters: {},
    });
    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      '1 result found',
    );
  });

  it('should render empty results', () => {
    dispatchSearchResults({ store: _store, addons: [], filters: {} });
    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      '0 results found',
    );
  });

  it('should render singular form when only one result is found with addonType ADDON_TYPE_THEMES_FILTER', () => {
    const query = 'test';
    dispatchSearchResults({
      store: _store,
      addons: { [fakeAddon.slug]: fakeAddon },
      filters: {
        addonType: ADDON_TYPE_THEMES_FILTER,
        query,
      },
    });

    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `1 theme found for "${query}"`,
    );
  });

  it('should render plural form when multiple results are found with addonType ADDON_TYPE_THEMES_FILTER', () => {
    const query = 'test';
    dispatchSearchResults({
      store: _store,
      filters: {
        addonType: ADDON_TYPE_THEMES_FILTER,
        query,
      },
    });

    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `2 themes found for "${query}"`,
    );
  });

  it('should fetch categories if there is a category filter', () => {
    dispatchSearchResults({
      store: _store,
      filters: { category: 'causes' },
    });

    const dispatchSpy = sinon.spy(_store, 'dispatch');

    const root = render();

    sinon.assert.calledWith(
      dispatchSpy,
      fetchCategories({
        errorHandlerId: root.instance().props.errorHandler.id,
      }),
    );
  });

  it('should not fetch categories if there is no category filter', () => {
    dispatchSearchResults({
      filters: { query: 'test' },
    });

    const dispatchSpy = sinon.spy(_store, 'dispatch');

    render();

    sinon.assert.notCalled(dispatchSpy);
  });

  it('should not fetch categories if there is a category filter and there is a categoryName', () => {
    _fetchCategories();

    const dispatchSpy = sinon.spy(_store, 'dispatch');

    render();

    sinon.assert.notCalled(dispatchSpy);
  });

  it('should render results with categoryName and query for addonType ADDON_TYPE_THEMES_FILTER when search is loaded', () => {
    const categoryName = 'Causes';

    _fetchCategories();
    _loadCategories();

    dispatchSearchResults({
      store: _store,
      filters: {
        addonType: ADDON_TYPE_THEMES_FILTER,
        category: 'causes',
        query: 'test',
      },
    });

    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `2 themes found for "test" in ${categoryName}`,
    );
  });

  it('should render results with categoryName and no query for addonType ADDON_TYPE_THEMES_FILTER when search is loaded', () => {
    const categoryName = 'Causes';

    _fetchCategories();
    _loadCategories();

    dispatchSearchResults({
      store: _store,
      filters: {
        addonType: ADDON_TYPE_THEMES_FILTER,
        category: 'causes',
      },
    });

    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `2 themes found in ${categoryName}`,
    );
  });

  it('should render results without categoryName or query when neither are present for addonType ADDON_TYPE_THEMES_FILTER', () => {
    dispatchSearchResults({
      store: _store,
      filters: {
        addonType: ADDON_TYPE_THEMES_FILTER,
      },
    });

    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      '2 themes found',
    );
  });

  it('should render singular form when only one result is found with addonType ADDON_TYPE_EXTENSION', () => {
    const query = 'test';
    dispatchSearchResults({
      addons: { [fakeAddon.slug]: fakeAddon },
      filters: {
        addonType: ADDON_TYPE_EXTENSION,
        query,
      },
      store: _store,
    });

    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `1 extension found for "${query}"`,
    );
  });

  it('should render plural form when multiple results are found with addonType ADDON_TYPE_EXTENSION', () => {
    const query = 'test';
    dispatchSearchResults({
      filters: {
        addonType: ADDON_TYPE_EXTENSION,
        query,
      },
      store: _store,
    });

    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `2 extensions found for "${query}"`,
    );
  });

  it('should render results with categoryName and query for addonType ADDON_TYPE_EXTENSION when search is loaded', () => {
    const query = 'test';
    const categoryName = 'Causes';
    dispatchSearchResults({
      filters: {
        addonType: ADDON_TYPE_EXTENSION,
        category: 'causes',
        query,
      },
      store: _store,
    });

    _fetchCategories();
    _loadCategories();

    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `2 extensions found for "${query}" in ${categoryName}`,
    );
  });

  it('should render results with categoryName and no query for addonType ADDON_TYPE_EXTENSION when there is no query and when search is loaded', () => {
    const categoryName = 'Causes';
    dispatchSearchResults({
      filters: {
        addonType: ADDON_TYPE_EXTENSION,
        category: 'causes',
      },
      store: _store,
    });

    _fetchCategories();
    _loadCategories();

    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `2 extensions found in ${categoryName}`,
    );
  });

  it('should render results without categoryName or query when neither are present for addonType ADDON_TYPE_EXTENSION', () => {
    dispatchSearchResults({
      filters: {
        addonType: ADDON_TYPE_EXTENSION,
      },
      store: _store,
    });

    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      '2 extensions found',
    );
  });

  it('should render "Searching" text when query is present and search loading is true', () => {
    const query = 'test';

    _searchStart({ filters: { query } });

    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `Searching for "${query}"`,
    );
  });

  it('should render "Searching" text when no query is present and search loading is true', () => {
    _searchStart({ filters: {} });

    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `Searching for add-ons`,
    );
  });

  it('should render singular form when only one result is found for an addonType that is not an extension nor theme', () => {
    const query = 'test';
    dispatchSearchResults({
      addons: { [fakeAddon.slug]: fakeAddon },
      filters: {
        addonType: ADDON_TYPE_LANG,
        query,
      },
      store: _store,
    });

    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `1 result found for "${query}"`,
    );
  });

  it('should render plural form when multiple results are found for an addonType that is not an extension nor theme', () => {
    const query = 'test';
    dispatchSearchResults({
      filters: {
        addonType: ADDON_TYPE_LANG,
        query,
      },
      store: _store,
    });

    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `2 results found for "${query}"`,
    );
  });

  it("should render results without a query when it's present for an addonType that is not an extension nor theme", () => {
    dispatchSearchResults({
      filters: {
        addonType: ADDON_TYPE_LANG,
      },
      store: _store,
    });

    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      '2 results found',
    );
  });
});
