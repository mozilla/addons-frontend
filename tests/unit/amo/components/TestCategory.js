import { shallow, mount } from 'enzyme';
import React from 'react';
import { Provider } from 'react-redux';

import { CategoryBase, mapStateToProps } from 'amo/components/Category';
import NotFound from 'amo/components/ErrorPage/NotFound';
import Search from 'amo/components/Search';
import { categoriesFetch, categoriesLoad } from 'core/actions/categories';
import { searchStart } from 'core/actions/search';
import { ADDON_TYPE_THEME, CLIENT_APP_FIREFOX } from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import I18nProvider from 'core/i18n/Provider';
import { visibleAddonType } from 'core/utils';
import { getFakeI18nInst } from 'tests/unit/helpers';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import ErrorList from 'ui/components/ErrorList';


function _categoriesFetch(overrides = {}) {
  return categoriesFetch({
    errorHandlerId: 'some-handler-id',
    ...overrides,
  });
}

describe('Category', () => {
  let category;
  let fakeDispatch;

  beforeEach(() => {
    fakeDispatch = sinon.stub();
    category = {
      id: 5,
      description: 'I am a cool category for doing things',
      name: 'Testing category',
      slug: 'test',
      type: ADDON_TYPE_THEME,
    };
  });

  function renderProps(customProps = {}) {
    const errorHandler = new ErrorHandler({
      id: 'some-handler-id',
      dispatch: fakeDispatch,
    });
    return {
      category,
      dispatch: fakeDispatch,
      errorHandler,
      i18n: getFakeI18nInst(),
      ...customProps,
    };
  }

  function render(props = {}) {
    return shallow(<CategoryBase {...renderProps(props)} />);
  }

  function mountRender(props = { loading: false }) {
    const { store } = dispatchClientMetadata();
    return mount(
      <Provider store={store}>
        <I18nProvider i18n={getFakeI18nInst()}>
          <CategoryBase
            {...renderProps({ category: null, ...props })}
          />
        </I18nProvider>
      </Provider>
    );
  }

  it('outputs a category page', () => {
    const root = render();

    expect(root).toHaveClassName('Category');
  });

  it('fetches categories when needed', () => {
    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: fakeDispatch,
    });
    render({ category: null, errorHandler });

    sinon.assert.calledWithMatch(fakeDispatch, _categoriesFetch({
      errorHandlerId: 'some-id',
    }));
  });

  it('should return 404 if no category was found and loading is false', () => {
    const root = mountRender({
      category: null,
      loading: false,
    });

    expect(root.find(NotFound)).toHaveLength(1);
  });

  it('should not return 404 if category is falsy and loading is true', () => {
    const root = mountRender({ loading: true });

    expect(root.find(NotFound)).toHaveLength(0);
  });

  it('should render an error', () => {
    const errorHandler = new ErrorHandler({
      capturedError: new Error('example of an error'),
      id: 'some-id',
      dispatch: fakeDispatch,
    });
    const root = render({ errorHandler });

    expect(root.find(ErrorList)).toHaveLength(1);
  });

  it('should render an error without a category too', () => {
    const errorHandler = new ErrorHandler({
      capturedError: new Error('example of an error'),
      id: 'some-id',
      dispatch: fakeDispatch,
    });
    const root = render({ errorHandler, category: null, loading: false });

    expect(root.find(ErrorList)).toHaveLength(1);
  });

  it('disables the sort component in Search', () => {
    const root = render();

    expect(root.find(Search)).toHaveProp('enableSearchSort', false);
  });
});

describe('Category.mapStateToProps()', () => {
  const fakeCategory = {
    id: 5,
    application: CLIENT_APP_FIREFOX,
    description: 'I am a cool category for doing things',
    name: 'Testing category',
    slug: 'test',
    type: ADDON_TYPE_THEME,
  };
  let filters;
  let ownProps;
  let store;

  beforeAll(() => {
    filters = {
      addonType: ADDON_TYPE_THEME,
      category: 'ad-block',
    };
    ownProps = {
      location: { query: {} },
      params: {
        application: CLIENT_APP_FIREFOX,
        visibleAddonType: visibleAddonType(ADDON_TYPE_THEME),
        slug: 'ad-block',
      },
    };
  });

  beforeEach(() => {
    store = dispatchClientMetadata().store;
    store.dispatch(categoriesLoad({ result: [fakeCategory] }));
  });

  function _searchStart(props = {}) {
    store.dispatch(searchStart({
      errorHandlerId: 'Search',
      ...props,
    }));
  }

  it('passes category filters', () => {
    _searchStart({ filters });
    const props = mapStateToProps(store.getState(), ownProps);

    expect(props).toEqual({
      addonType: ADDON_TYPE_THEME,
      category: null,
      filters: { ...filters, page: 1 },
      loading: true,
      pathname: '/themes/ad-block/',
      paginationQueryParams: { page: 1 },
    });
  });

  it('gets category from filters/state/etc.', () => {
    const filtersWithSlug = {
      ...filters,
      category: 'test',
    };
    const ownPropsWithSlug = {
      location: { query: {} },
      params: {
        application: CLIENT_APP_FIREFOX,
        visibleAddonType: visibleAddonType(ADDON_TYPE_THEME),
        slug: 'test',
      },
    };
    _searchStart({ filters: filtersWithSlug });
    const props = mapStateToProps(store.getState(), ownPropsWithSlug);

    expect(props).toEqual({
      addonType: ADDON_TYPE_THEME,
      category: fakeCategory,
      filters: { ...filtersWithSlug, page: 1 },
      loading: true,
      pathname: '/themes/test/',
      paginationQueryParams: { page: 1 },
    });
  });

  it('sets loading to true if categories and search are loading', () => {
    store.dispatch(_categoriesFetch());
    _searchStart({ filters });
    const props = mapStateToProps(store.getState(), ownProps);

    expect(props).toMatchObject({ loading: true });
  });

  it('sets loading to true if only categories are loading', () => {
    store.dispatch(_categoriesFetch());
    const props = mapStateToProps(store.getState(), ownProps);

    expect(props).toMatchObject({ loading: true });
  });

  it('sets loading to true if only search is loading', () => {
    _searchStart({ filters });
    const props = mapStateToProps(store.getState(), ownProps);

    expect(props).toMatchObject({ loading: true });
  });

  it('sets loading to false if nothing is loading', () => {
    const props = mapStateToProps(store.getState(), ownProps);

    expect(props).toMatchObject({ loading: false });
  });
});
