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
  ADDON_TYPE_DICT,
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

  function _searchStart(props = {}) {
    _store.dispatch(searchStart({ errorHandlerId: 'Search', ...props }));
  }

  const _fetchCategories = ({ store }) => {
    store.dispatch(fetchCategories({ errorHandlerId: 'SearchContextCard' }));
  };

  const _loadCategories = ({
    store,
    results = [
      {
        ...fakeCategory,
        name: 'Causes',
        slug: 'causes',
      },
    ],
  }) => {
    store.dispatch(loadCategories({ results }));
  };

  it('should render a card', () => {
    const root = render();

    expect(root).toHaveClassName('SearchContextCard');
  });

  it('should render "searching" while loading without query', () => {
    _searchStart({ filters: {} });
    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      'Loading add-ons',
    );
  });

  it('should render during a search that is loading', () => {
    _searchStart({ filters: { query: 'test' } });
    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      'Searching for "test"',
    );
  });

  it('should render search results', () => {
    const { store } = dispatchSearchResults();
    const root = render({ store });

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      '2 results found for "test"',
    );
  });

  it('should render results that lack a query', () => {
    const { store } = dispatchSearchResults({ filters: {} });
    const root = render({ store });

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      '2 results found',
    );
  });

  it('should use singular form when only one result is found', () => {
    const { store } = dispatchSearchResults({
      addons: { [fakeAddon.slug]: fakeAddon },
    });
    const root = render({ store });

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      '1 result found for "test"',
    );
  });

  it('should use singular form without query when only one result', () => {
    const { store } = dispatchSearchResults({
      addons: { [fakeAddon.slug]: fakeAddon },
      filters: {},
    });
    const root = render({ store });

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      '1 result found',
    );
  });

  it('should render empty results', () => {
    const { store } = dispatchSearchResults({ addons: [], filters: {} });
    const root = render({ store });

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      '0 results found',
    );
  });

  it('should render singular form when only one result is found with addonType ADDON_TYPE_THEMES_FILTER', () => {
    const query = 'test';
    const { store } = dispatchSearchResults({
      addons: { [fakeAddon.slug]: fakeAddon },
      filters: {
        addonType: ADDON_TYPE_THEMES_FILTER,
        query,
      },
    });

    const root = render({ store });

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `1 theme found for "${query}"`,
    );
  });

  it('should render plural form when multiple results are found with addonType ADDON_TYPE_THEMES_FILTER', () => {
    const query = 'test';
    const { store } = dispatchSearchResults({
      filters: {
        addonType: ADDON_TYPE_THEMES_FILTER,
        query,
      },
    });

    const root = render({ store });

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `2 themes found for "${query}"`,
    );
  });

  it('should render results with categoryName and query for addonType ADDON_TYPE_THEMES_FILTER when loading is false', () => {
    const categoryName = 'Causes';

    const { store } = dispatchSearchResults({
      addons: {
        [fakeAddon.slug]: fakeAddon,
      },
      filters: {
        addonType: ADDON_TYPE_THEMES_FILTER,
        category: 'causes',
        query: 'test',
      },
    });

    _fetchCategories({ store });
    _loadCategories({ store });

    const root = render({ store });

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `1 theme found for "test" in ${categoryName}`,
    );
  });

  it('should render results with categoryName and no query if not present for addonType ADDON_TYPE_THEMES_FILTER when loading is false', () => {
    const categoryName = 'Causes';

    const { store } = dispatchSearchResults({
      addons: { [fakeAddon.slug]: fakeAddon },
      filters: {
        addonType: ADDON_TYPE_THEMES_FILTER,
        category: 'causes',
      },
    });

    _fetchCategories({ store });
    _loadCategories({ store });

    const root = render({ store });

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `1 theme found in ${categoryName}`,
    );
  });

  it('should render results without categoryName or query when not present for addonType ADDON_TYPE_THEMES_FILTER', () => {
    const { store } = dispatchSearchResults({
      addons: { [fakeAddon.slug]: fakeAddon },
      filters: {
        addonType: ADDON_TYPE_THEMES_FILTER,
      },
    });

    const root = render({ store });

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      '1 theme found',
    );
  });

  it('should render singular form when only one result is found with addonType ADDON_TYPE_DICT', () => {
    const query = 'test';
    const { store } = dispatchSearchResults({
      addons: { [fakeAddon.slug]: fakeAddon },
      filters: {
        addonType: ADDON_TYPE_DICT,
        query,
      },
    });

    const root = render({ store });

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `1 result found for "${query}"`,
    );
  });

  it('should render plural form when multiple results are found with addonType ADDON_TYPE_DICT', () => {
    const query = 'test';
    const { store } = dispatchSearchResults({
      filters: {
        addonType: ADDON_TYPE_DICT,
        query,
      },
    });

    const root = render({ store });

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `2 results found for "${query}"`,
    );
  });

  it('should render results without query when not present for addonType ADDON_TYPE_DICT', () => {
    const { store } = dispatchSearchResults({
      addons: { [fakeAddon.slug]: fakeAddon },
      filters: {
        addonType: ADDON_TYPE_DICT,
      },
    });

    const root = render({ store });

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      '1 result found',
    );
  });

  it('should render singular form when only one result is found with addonType ADDON_TYPE_EXTENSION', () => {
    const query = 'test';
    const { store } = dispatchSearchResults({
      addons: { [fakeAddon.slug]: fakeAddon },
      filters: {
        addonType: ADDON_TYPE_EXTENSION,
        query,
      },
    });

    const root = render({ store });

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `1 extension found for "${query}"`,
    );
  });

  it('should render plural form when multiple results are found with addonType ADDON_TYPE_EXTENSION', () => {
    const query = 'test';
    const { store } = dispatchSearchResults({
      filters: {
        addonType: ADDON_TYPE_EXTENSION,
        query,
      },
    });

    const root = render({ store });

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `2 extensions found for "${query}"`,
    );
  });

  it('should render results with categoryName and query for addonType ADDON_TYPE_EXTENSION when loading is false', () => {
    const query = 'test';
    const categoryName = 'Causes';
    const { store } = dispatchSearchResults({
      addons: { [fakeAddon.slug]: fakeAddon },
      filters: {
        addonType: ADDON_TYPE_EXTENSION,
        category: 'causes',
        query,
      },
    });

    _fetchCategories({ store });
    _loadCategories({ store });

    const root = render({ store });

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `1 extension found for "${query}" in ${categoryName}`,
    );
  });

  it('should render results with categoryName and no query if not present for addonType ADDON_TYPE_EXTENSION when loading is false', () => {
    const categoryName = 'Causes';
    const { store } = dispatchSearchResults({
      addons: { [fakeAddon.slug]: fakeAddon },
      filters: {
        addonType: ADDON_TYPE_EXTENSION,
        category: 'causes',
      },
    });

    _fetchCategories({ store });
    _loadCategories({ store });

    const root = render({ store });

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `1 extension found in ${categoryName}`,
    );
  });

  it('should render results without categoryName or query when not present for addonType ADDON_TYPE_EXTENSION', () => {
    const { store } = dispatchSearchResults({
      addons: { [fakeAddon.slug]: fakeAddon },
      filters: {
        addonType: ADDON_TYPE_EXTENSION,
      },
    });

    const root = render({ store });

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      '1 extension found',
    );
  });

  it('should render singular form when only one result is found with addonType ADDON_TYPE_LANG', () => {
    const query = 'test';
    const { store } = dispatchSearchResults({
      addons: { [fakeAddon.slug]: fakeAddon },
      filters: {
        addonType: ADDON_TYPE_LANG,
        query,
      },
    });

    const root = render({ store });

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `1 result found for "${query}"`,
    );
  });

  it('should render plural form when multiple results are found with addonType ADDON_TYPE_LANG', () => {
    const query = 'test';
    const { store } = dispatchSearchResults({
      filters: {
        addonType: ADDON_TYPE_LANG,
        query,
      },
    });

    const root = render({ store });

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `2 results found for "${query}"`,
    );
  });

  it('should render results without query when not present for addonType ADDON_TYPE_LANG', () => {
    const { store } = dispatchSearchResults({
      addons: { [fakeAddon.slug]: fakeAddon },
      filters: {
        addonType: ADDON_TYPE_LANG,
      },
    });

    const root = render({ store });

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      '1 result found',
    );
  });

  it('should render Searching text when query is present when loading is true', () => {
    const query = 'test';

    _searchStart({ store: _store, filters: { query } });

    const root = render({ store: _store });

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `Searching for "${query}"`,
    );
  });

  it('should render Loading text when no query is present when loading is true', () => {
    _searchStart({ store: _store, filters: {} });

    const root = render({ store: _store });

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `Loading add-ons`,
    );
  });

  it('should render singular form when only one result is found with addonType does not exist', () => {
    const query = 'test';
    const { store } = dispatchSearchResults({
      addons: { [fakeAddon.slug]: fakeAddon },
      filters: {
        addonType: 'random',
        query,
      },
    });

    const root = render({ store });

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `1 result found for "${query}"`,
    );
  });

  it('should render plural form when multiple results are found for an addonType that does not exist', () => {
    const query = 'test';
    const { store } = dispatchSearchResults({
      filters: {
        addonType: 'random',
        query,
      },
    });

    const root = render({ store });

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `2 results found for "${query}"`,
    );
  });

  it('should render results without query when not present for addonType that does not exist', () => {
    const { store } = dispatchSearchResults({
      filters: {
        addonType: 'random',
      },
    });

    const root = render({ store });

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      '2 results found',
    );
  });
});
