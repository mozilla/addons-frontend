import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_RECOMMENDED,
  SEARCH_SORT_TRENDING,
} from 'amo/constants';
import {
  FETCH_CATEGORIES,
  fetchCategories,
  loadCategories,
} from 'amo/reducers/categories';
import { searchStart } from 'amo/reducers/search';
import { convertFiltersToQueryParams } from 'amo/searchUtils';
import { visibleAddonType } from 'amo/utils';
import {
  dispatchClientMetadata,
  dispatchSearchResults,
  fakeAddon,
  fakeCategory,
  getElement,
  getSearchErrorHandlerId,
  renderPage as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let history;
  let store;
  const lang = 'en-US';
  const clientApp = CLIENT_APP_FIREFOX;
  const defaultAddonType = ADDON_TYPE_EXTENSION;
  const defaultAddonTypeForURL = visibleAddonType(defaultAddonType);
  const defaultCategory = 'bookmarks';
  const defaultLocation = `/${lang}/${clientApp}/${defaultAddonTypeForURL}/category/${defaultCategory}/`;

  beforeEach(() => {
    store = dispatchClientMetadata({ clientApp, lang }).store;
  });

  function render({
    addonType = defaultAddonTypeForURL,
    category = defaultCategory,
    location,
  } = {}) {
    const initialEntry =
      location || `/${lang}/${clientApp}/${addonType}/category/${category}/`;
    const renderOptions = {
      initialEntries: [initialEntry],
      store,
    };

    const renderResult = defaultRender(renderOptions);
    history = renderResult.history;
    return renderResult;
  }

  const _loadCategories = ({
    name = 'Causes',
    slug = 'causes',
    type = ADDON_TYPE_STATIC_THEME,
  } = {}) => {
    store.dispatch(
      loadCategories({
        results: [
          {
            ...fakeCategory,
            name,
            slug,
            type,
          },
        ],
      }),
    );
  };

  it('causes Search to dispatch a search using category, addonType and sort filters', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).toHaveBeenCalledWith(
      searchStart({
        errorHandlerId: getSearchErrorHandlerId(),
        filters: {
          addonType: ADDON_TYPE_EXTENSION,
          category: defaultCategory,
          sort: `${SEARCH_SORT_RECOMMENDED},${SEARCH_SORT_POPULAR}`,
        },
      }),
    );
  });

  it('does not override an existing sort filter', async () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    render({ location: `${defaultLocation}?sort=${SEARCH_SORT_POPULAR}` });

    await waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith(
        searchStart({
          errorHandlerId: getSearchErrorHandlerId(),
          filters: {
            addonType: ADDON_TYPE_EXTENSION,
            category: defaultCategory,
            sort: SEARCH_SORT_POPULAR,
          },
        }),
      ),
    );
  });

  it('configures pagination using filters and the category/type', async () => {
    const addonType = ADDON_TYPE_STATIC_THEME;
    const category = 'privacy';
    const page = '2';
    const pageSize = 2;
    const sort = SEARCH_SORT_POPULAR;
    const addons = Array(pageSize).fill(fakeAddon);

    render({
      location: `/${lang}/${clientApp}/${visibleAddonType(
        addonType,
      )}/category/${category}/?page=${page}&sort=${sort}`,
    });

    await dispatchSearchResults({
      addons,
      count: 5,
      filters: { addonType, category, page, sort },
      pageSize,
      store,
    });

    expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute(
      'href',
      `/${lang}/${clientApp}/${visibleAddonType(
        addonType,
      )}/category/${category}/?page=1&sort=${SEARCH_SORT_POPULAR}`,
    );
  });

  it('should fetch categories if there is no name for the current category', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).toHaveBeenCalledWith(
      fetchCategories({
        errorHandlerId: `src/amo/pages/CategoryPage/index.js-${defaultCategory}`,
      }),
    );
  });

  it('should not fetch categories if there is a name for the current category', () => {
    _loadCategories({ slug: defaultCategory, type: defaultAddonType });
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_CATEGORIES }),
    );
  });

  it.each([
    [ADDON_TYPE_EXTENSION, 'Extensions'],
    [ADDON_TYPE_STATIC_THEME, 'Themes'],
  ])('sets the expected title for type: %s', async (type, expectedTitle) => {
    const name = 'Category Name';

    _loadCategories({ name, slug: defaultCategory, type });

    render({ addonType: visibleAddonType(type) });

    await waitFor(() =>
      expect(getElement('title')).toHaveTextContent(
        `${expectedTitle} in ${name} – Add-ons for Firefox (en-US)`,
      ),
    );
  });

  it.each([
    [ADDON_TYPE_EXTENSION, 'Extensions'],
    [ADDON_TYPE_STATIC_THEME, 'Themes'],
  ])(
    'sets the expected title for type: %s without a category name',
    async (type, expectedTitle) => {
      render({ addonType: visibleAddonType(type) });

      await waitFor(() =>
        expect(getElement('title')).toHaveTextContent(
          `${expectedTitle} – Add-ons for Firefox (en-US)`,
        ),
      );
    },
  );

  describe('Tests for Search', () => {
    it('forces recommended add-ons to the top when a category is specified and a new sort filter is selected', () => {
      const sort = SEARCH_SORT_POPULAR;

      render({ location: `${defaultLocation}?sort=${sort}` });
      const pushSpy = jest.spyOn(history, 'push');

      userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Sort by' }),
        'Trending',
      );

      expect(pushSpy).toHaveBeenCalledWith({
        pathname: defaultLocation,
        query: convertFiltersToQueryParams({
          sort: `${SEARCH_SORT_RECOMMENDED},${SEARCH_SORT_TRENDING}`,
        }),
      });
    });

    it('removes category and addonType from the URL if category is in filters', () => {
      const sort = SEARCH_SORT_POPULAR;

      render({
        location: `${defaultLocation}?sort=${sort}&category=${defaultCategory}&type=${defaultAddonType}`,
      });
      const pushSpy = jest.spyOn(history, 'push');

      userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Sort by' }),
        'Trending',
      );

      expect(pushSpy).toHaveBeenCalledWith({
        pathname: defaultLocation,
        query: convertFiltersToQueryParams({
          sort: `${SEARCH_SORT_RECOMMENDED},${SEARCH_SORT_TRENDING}`,
        }),
      });
    });
  });

  describe('Tests for SearchFilters', () => {
    it('does not display the addonType filter when a category is defined', () => {
      // See: https://github.com/mozilla/addons-frontend/issues/3747
      render();

      expect(
        screen.getByRole('combobox', { name: 'Sort by' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('combobox', { name: 'Add-on Type' }),
      ).not.toBeInTheDocument();
    });
  });
});
