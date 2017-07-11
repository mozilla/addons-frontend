import { shallow } from 'enzyme';
import React from 'react';

import { CategoryBase, mapStateToProps } from 'amo/components/Category';
import { SearchBase } from 'amo/components/Search';
import createStore from 'amo/store';
import { categoriesFetch } from 'core/actions/categories';
import { searchStart } from 'core/actions/search';
import { ADDON_TYPE_THEME } from 'core/constants';
import { getFakeI18nInst } from 'tests/unit/helpers';


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

  it('outputs a category page', () => {
    const root = render();

    expect(root).toHaveClassName('Category');
  });

  it('dispatches categoriesFetch if category is falsy', () => {
    render({ category: null });

    sinon.assert.calledWith(fakeDispatch, categoriesFetch());
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
