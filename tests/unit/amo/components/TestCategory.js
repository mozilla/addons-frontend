import { shallow, mount } from 'enzyme';
import React from 'react';
import { Provider } from 'react-redux';

import { CategoryBase, mapStateToProps } from 'amo/components/Category';
import NotFound from 'amo/components/ErrorPage/NotFound';
import { SearchBase } from 'amo/components/Search';
import createStore from 'amo/store';
import { searchStart } from 'core/actions/search';
import { ADDON_TYPE_THEME, CATEGORIES_FETCH } from 'core/constants';
import I18nProvider from 'core/i18n/Provider';
import { getFakeI18nInst } from 'tests/unit/helpers';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';

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

  function render(props = {}) {
    return shallow(
      <CategoryBase
        category={category}
        dispatch={fakeDispatch}
        i18n={getFakeI18nInst()}
        {...props}
      />
    );
  }

  function mountRender(props = { loading: false }) {
    const { store } = dispatchClientMetadata();
    return mount(
      <Provider store={store}>
        <I18nProvider i18n={getFakeI18nInst()}>
          <CategoryBase
            category={null}
            dispatch={fakeDispatch}
            i18n={getFakeI18nInst()}
            {...props}
          />
        </I18nProvider>
      </Provider>
    );
  }

  it('outputs a category page', () => {
    const root = render();

    expect(root).toHaveClassName('Category');
  });

  it('dispatches CATEGORIES_FETCH if category is falsy', () => {
    render({ category: null });

    sinon.assert.calledWithMatch(fakeDispatch, { type: CATEGORIES_FETCH });
  });

  it('should return 404 if category is falsy and loading is false', () => {
    const root = mountRender();

    expect(root.find(NotFound)).toHaveLength(1);
  });

  it('should not return 404 if category is falsy and loading is true', () => {
    const root = mountRender({ loading: true });

    expect(root.find(NotFound)).toHaveLength(0);
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
  let filters;
  let ownProps;

  beforeAll(() => {
    filters = {
      addonType: ADDON_TYPE_THEME,
      category: 'ad-block',
      clientApp: 'firefox',
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

  it('passes the search state if the filters and state matches', () => {
    const { store } = createStore();
    store.dispatch(searchStart({ filters, results: [] }));
    const props = mapStateToProps(store.getState(), ownProps);

    expect(props).toEqual({
      addonType: ADDON_TYPE_THEME,
      category: null,
      count: 0,
      filters,
      loading: true,
      page: undefined,
      pathname: '/themes/ad-block/',
      queryParams: { page: 1 },
      results: [],
    });
  });

  it('does not pass search state if the filters and state do not match', () => {
    const { store } = createStore();
    store.dispatch(searchStart({ filters }));
    const mismatchedState = store.getState();
    mismatchedState.search.filters.clientApp = 'nothing';
    const props = mapStateToProps(mismatchedState, ownProps);

    expect(props).toEqual({
      addonType: ADDON_TYPE_THEME,
      category: null,
      pathname: '/themes/ad-block/',
      queryParams: { page: 1 },
    });
  });
});
