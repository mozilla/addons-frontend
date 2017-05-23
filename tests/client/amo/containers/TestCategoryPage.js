import React from 'react';

import { CategoryPageBase, mapStateToProps } from 'amo/containers/CategoryPage';
import createStore from 'amo/store';
import { searchStart } from 'core/actions/search';
import { ADDON_TYPE_THEME } from 'core/constants';
import { shallowRender } from 'tests/client/helpers';


describe('CategoryPage.mapStateToProps()', () => {
  function render(props = {}) {
    return shallowRender(<CategoryPageBase {...props} />);
  }

  it('sets enableSearchSort to `false`', () => {
    const root = render();
    expect(root.props.enableSearchSort).toEqual(false);
  });
});

describe('CategoryPage.mapStateToProps()', () => {
  let filters;
  let ownProps;

  before(() => {
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
      count: 0,
      filters,
      hasSearchParams: true,
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
      hasSearchParams: true,
      pathname: '/themes/ad-block/',
      queryParams: { page: 1 },
    });
  });
});
