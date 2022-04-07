import * as React from 'react';

import Search from 'amo/components/Search';
import CategoryPage, { CategoryPageBase } from 'amo/pages/CategoryPage';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_RECOMMENDED,
} from 'amo/constants';
import { fetchCategories, loadCategories } from 'amo/reducers/categories';
import { visibleAddonType } from 'amo/utils';
import {
  dispatchClientMetadata,
  fakeCategory,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  const defaultParams = {
    categorySlug: 'some-category',
    visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION),
  };

  function render({ params = defaultParams, ...props } = {}) {
    return shallowUntilTarget(
      <CategoryPage
        i18n={fakeI18n()}
        match={{ params }}
        store={store}
        {...props}
      />,
      CategoryPageBase,
    );
  }

  beforeEach(() => {
    store = dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX }).store;
  });

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

  it('renders a Search component', () => {
    const root = render();

    expect(root.find(Search)).toHaveLength(1);
  });

  it('adds category, addonType and sort to Search filters', () => {
    const category = 'some-category';
    const addonType = ADDON_TYPE_EXTENSION;

    const root = render({
      params: {
        categorySlug: category,
        visibleAddonType: visibleAddonType(addonType),
      },
    });

    expect(root.find(Search).prop('filters')).toEqual({
      addonType,
      category,
      sort: `${SEARCH_SORT_RECOMMENDED},${SEARCH_SORT_POPULAR}`,
    });
  });

  it('does not override an existing sort filter', () => {
    const category = 'some-category';
    const addonType = ADDON_TYPE_EXTENSION;

    dispatchClientMetadata({
      store,
      search: `?sort=${SEARCH_SORT_POPULAR}`,
    });

    const root = render({
      params: {
        categorySlug: category,
        visibleAddonType: visibleAddonType(addonType),
      },
    });

    expect(root.find(Search).prop('filters')).toEqual({
      addonType,
      category,
      sort: SEARCH_SORT_POPULAR,
    });
  });

  it('sets the paginationQueryParams from filters, excluding category and type', () => {
    const page = '2';
    const q = 'testQ';

    dispatchClientMetadata({
      store,
      search: `?page=${page}&q=${q}`,
    });

    const root = render({
      params: {
        categorySlug: 'some-category',
        visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION),
      },
    });

    expect(root.find(Search)).toHaveProp('paginationQueryParams', {
      page,
      q,
    });
  });

  it('sets the pathname using the category and add-on type', () => {
    const addonType = ADDON_TYPE_EXTENSION;
    const category = 'some-category';

    const root = render({
      params: {
        categorySlug: category,
        visibleAddonType: visibleAddonType(addonType),
      },
    });

    expect(root.find(Search)).toHaveProp(
      'pathname',
      `/${visibleAddonType(addonType)}/category/${category}/`,
    );
  });

  it('should fetch categories if there is no name for the current category', () => {
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = render();

    sinon.assert.calledWith(
      dispatchSpy,
      fetchCategories({
        errorHandlerId: root.instance().props.errorHandler.id,
      }),
    );
  });

  it('should not fetch categories if there is a name for the current category', () => {
    const slug = 'some-category';
    const type = ADDON_TYPE_EXTENSION;

    _loadCategories({ slug, type });
    const dispatchSpy = sinon.spy(store, 'dispatch');

    render({
      params: {
        categorySlug: slug,
        visibleAddonType: visibleAddonType(type),
      },
    });

    sinon.assert.notCalled(dispatchSpy);
  });

  it.each([
    [ADDON_TYPE_EXTENSION, 'Extensions'],
    [ADDON_TYPE_STATIC_THEME, 'Themes'],
  ])('sets the expected title for type: %s', (type, expectedTitle) => {
    const slug = 'some-category';
    const name = 'Category Name';

    _loadCategories({ name, slug, type });

    const root = render({
      params: {
        categorySlug: slug,
        visibleAddonType: type ? visibleAddonType(type) : type,
      },
    });

    expect(root.find(Search)).toHaveProp(
      'pageTitle',
      `${expectedTitle} in ${name}`,
    );
  });

  it.each([
    [ADDON_TYPE_EXTENSION, 'Extensions'],
    [ADDON_TYPE_STATIC_THEME, 'Themes'],
  ])(
    'sets the expected title for type: %s without a category name',
    (type, expectedTitle) => {
      const slug = 'some-category';

      const root = render({
        params: {
          categorySlug: slug,
          visibleAddonType: type ? visibleAddonType(type) : type,
        },
      });

      expect(root.find(Search)).toHaveProp('pageTitle', expectedTitle);
    },
  );
});
