import * as React from 'react';

import SearchContextCard, {
  SearchContextCardBase,
} from 'amo/components/SearchContextCard';
import { fetchCategories, loadCategories } from 'amo/reducers/categories';
import { searchStart } from 'amo/reducers/search';
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
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
} from 'amo/constants';

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
    _store = dispatchClientMetadata({
      clientApp: CLIENT_APP_FIREFOX,
    }).store;
  });

  const _searchStart = ({ store = _store, filters = {} } = {}) => {
    store.dispatch(searchStart({ errorHandlerId: 'Search', filters }));
  };

  const _fetchCategories = ({
    store = _store,
    errorHandlerId = 'SearchContextCard-Categories',
  } = {}) => {
    store.dispatch(fetchCategories({ errorHandlerId }));
  };

  const _loadCategories = ({
    store = _store,
    results = [
      {
        ...fakeCategory,
        type: ADDON_TYPE_STATIC_THEME,
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

    expect(root.find('.SearchContextCard-header').text()).toEqual(
      '2 results found',
    );
  });

  it('should use singular form when only one result is found', () => {
    dispatchSearchResults({
      store: _store,
      addons: [fakeAddon],
    });
    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      '1 result found for "test"',
    );
  });

  it('should use singular form without query when only one result', () => {
    dispatchSearchResults({
      store: _store,
      addons: [fakeAddon],
      filters: {},
    });
    const root = render();

    expect(root.find('.SearchContextCard-header').text()).toEqual(
      '1 result found',
    );
  });

  it('should render empty results', () => {
    dispatchSearchResults({ store: _store, addons: [], filters: {} });
    const root = render();

    expect(root.find('.SearchContextCard-header').text()).toEqual(
      '0 results found',
    );
  });

  it('should render singular form when only one result is found with addonType ADDON_TYPE_STATIC_THEME', () => {
    const query = 'test';
    dispatchSearchResults({
      store: _store,
      addons: [fakeAddon],
      filters: {
        addonType: ADDON_TYPE_STATIC_THEME,
        query,
      },
    });

    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `1 theme found for "${query}"`,
    );
  });

  it('should render plural form when multiple results are found with addonType ADDON_TYPE_STATIC_THEME', () => {
    const query = 'test';
    dispatchSearchResults({
      store: _store,
      filters: {
        addonType: ADDON_TYPE_STATIC_THEME,
        query,
      },
    });

    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `2 themes found for "${query}"`,
    );
  });

  it('should fetch categories if there is a category filter', () => {
    _searchStart({ filters: { category: 'causes' } });

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
    _searchStart({ filters: {} });

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

  it('should render results with categoryName and query for addonType ADDON_TYPE_STATIC_THEME when search is loaded', () => {
    const categoryName = 'Causes';

    _fetchCategories();
    _loadCategories();

    dispatchSearchResults({
      filters: {
        addonType: ADDON_TYPE_STATIC_THEME,
        category: 'causes',
        query: 'test',
      },
      store: _store,
    });

    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `2 themes found for "test" in ${categoryName}`,
    );
  });

  it('should render results with categoryName and no query for addonType ADDON_TYPE_STATIC_THEME when search is loaded', () => {
    const categoryName = 'Causes';

    _fetchCategories();
    _loadCategories();

    dispatchSearchResults({
      filters: {
        addonType: ADDON_TYPE_STATIC_THEME,
        category: 'causes',
      },
      store: _store,
    });

    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `2 themes found in ${categoryName}`,
    );
  });

  it('should render results without categoryName or query when neither are present for addonType ADDON_TYPE_STATIC_THEME', () => {
    dispatchSearchResults({
      filters: {
        addonType: ADDON_TYPE_STATIC_THEME,
      },
      store: _store,
    });

    const root = render();

    expect(root.find('.SearchContextCard-header').text()).toEqual(
      '2 themes found',
    );
  });

  it('should render singular form when only one result is found with addonType ADDON_TYPE_EXTENSION', () => {
    const query = 'test';
    dispatchSearchResults({
      addons: [fakeAddon],
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
    const categoryName = 'Bookmarks';

    _fetchCategories();
    _loadCategories({
      results: [
        {
          ...fakeCategory,
          type: ADDON_TYPE_EXTENSION,
          name: categoryName,
          slug: 'bookmarks',
        },
      ],
    });

    dispatchSearchResults({
      filters: {
        addonType: ADDON_TYPE_EXTENSION,
        category: 'bookmarks',
        query,
      },
      store: _store,
    });

    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `2 extensions found for "${query}" in ${categoryName}`,
    );
  });

  it('should render results with categoryName and no query for addonType ADDON_TYPE_EXTENSION when there is no query and when search is loaded', () => {
    const categoryName = 'Bookmarks';

    _fetchCategories();
    _loadCategories({
      results: [
        {
          ...fakeCategory,
          type: ADDON_TYPE_EXTENSION,
          name: categoryName,
          slug: 'bookmarks',
        },
      ],
    });

    dispatchSearchResults({
      filters: {
        addonType: ADDON_TYPE_EXTENSION,
        category: 'bookmarks',
      },
      store: _store,
    });

    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `2 extensions found in ${categoryName}`,
    );
  });

  it('should render results with categoryName for addonType ADDON_TYPE_EXTENSION for android', () => {
    const { store } = dispatchClientMetadata({
      clientApp: CLIENT_APP_ANDROID,
    });

    const categoryName = 'Experimental';

    _fetchCategories({ store });
    _loadCategories({
      store,
      results: [
        {
          ...fakeCategory,
          application: CLIENT_APP_ANDROID,
          type: ADDON_TYPE_EXTENSION,
          name: categoryName,
          slug: 'experimental',
        },
      ],
    });

    dispatchSearchResults({
      filters: {
        addonType: ADDON_TYPE_EXTENSION,
        category: 'experimental',
      },
      store,
    });

    const root = render({ store });

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

    expect(root.find('.SearchContextCard-header').text()).toEqual(
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

  it('should render "Searching" and the tag when no query is present but tag is and search loading is true', () => {
    const tag = 'foo';
    _searchStart({ filters: { tag } });

    const root = render();

    expect(root.find('.SearchContextCard-header')).toIncludeText(
      `Searching for add-ons with tag ${tag}`,
    );
  });

  it('should render singular form when only one result is found for an addonType that is not an extension nor theme', () => {
    const query = 'test';
    dispatchSearchResults({
      addons: [fakeAddon],
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

    expect(root.find('.SearchContextCard-header').text()).toEqual(
      '2 results found',
    );
  });

  it('should render results with the tag for tag query', () => {
    const tag = 'foo';
    dispatchSearchResults({
      filters: {
        tag,
      },
      store: _store,
    });

    const root = render();

    expect(root.find('.SearchContextCard-header').text()).toEqual(
      `2 results found with tag ${tag}`,
    );
  });

  it('does not render a categoryName when the category is invalid', () => {
    dispatchSearchResults({
      // The API does not return addon results if the category is invalid.
      addons: [],
      filters: {
        category: 'bad-category',
      },
      store: _store,
    });

    const root = render();

    expect(root.find('.SearchContextCard-header').text()).toEqual(
      '0 results found',
    );
  });
});
