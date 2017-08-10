import { shallow, mount } from 'enzyme';
import React from 'react';
import { Provider } from 'react-redux';

import { CategoryBase, mapStateToProps } from 'amo/components/Category';
import NotFound from 'amo/components/ErrorPage/NotFound';
import { SearchBase } from 'amo/components/Search';
import createStore from 'amo/store';
import { categoriesFetch } from 'core/actions/categories';
import { searchStart } from 'core/actions/search';
import { ADDON_TYPE_THEME, CLIENT_APP_FIREFOX } from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import I18nProvider from 'core/i18n/Provider';
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

    expect(root.find(SearchBase)).toHaveProp('enableSearchSort', false);
  });

  it('forces hasSearchParams for the Search component', () => {
    // This prevents search results not appearing because the search
    // component doesn't recognise a valid search param.
    const root = render();

    expect(root.find(SearchBase)).toHaveProp('hasSearchParams', true);
  });
});

describe('Category.mapStateToProps()', () => {
  let store;
  let filters;
  let ownProps;

  beforeAll(() => {
    filters = {
      addonType: ADDON_TYPE_THEME,
      category: 'ad-block',
      clientApp: CLIENT_APP_FIREFOX,
    };
    ownProps = {
      location: { query: {} },
      params: {
        application: 'firefox',
        visibleAddonType: 'themes',
        slug: 'ad-block',
      },
    };
  });

  beforeEach(() => {
    store = createStore().store;
  });

  function _searchStart(props = {}) {
    store.dispatch(searchStart({
      errorHandlerId: 'Search',
      page: 1,
      results: [],
      ...props,
    }));
  }

  it('passes the search state if the filters and state matches', () => {
    _searchStart({ filters });
    const props = mapStateToProps(store.getState(), ownProps);

    expect(props).toEqual({
      addonType: ADDON_TYPE_THEME,
      category: null,
      count: 0,
      filters,
      loading: true,
      page: 1,
      pathname: '/themes/ad-block/',
      queryParams: { page: 1 },
      results: [],
    });
  });

  it('does not pass search state if the filters and state do not match', () => {
    _searchStart({ filters });
    const mismatchedState = store.getState();
    mismatchedState.search.filters.clientApp = 'nothing';
    const props = mapStateToProps(mismatchedState, ownProps);

    expect(props).toMatchObject({
      addonType: ADDON_TYPE_THEME,
      category: null,
      loading: true,
      pathname: '/themes/ad-block/',
      queryParams: { page: 1 },
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
