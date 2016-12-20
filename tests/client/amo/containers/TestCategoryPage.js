import { mapStateToProps } from 'amo/containers/CategoryPage';
import createStore from 'amo/store';
import { searchStart } from 'core/actions/search';


describe('CategoryPage.mapStateToProps()', () => {
  let filters;
  let ownProps;

  before(() => {
    filters = {
      addonType: 'theme',
      category: 'ad-block',
      clientApp: 'firefox',
    };
    ownProps = {
      location: { query: {} },
      params: {
        application: 'firefox',
        addonType: 'theme',
        slug: 'ad-block',
      },
    };
  });

  it('passes the search state if the filters and state matches', () => {
    const store = createStore();
    store.dispatch(searchStart({ filters, results: [] }));
    const props = mapStateToProps(store.getState(), ownProps);

    assert.deepEqual(props, {
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
    const store = createStore();
    store.dispatch(searchStart({ filters }));
    const mismatchedState = store.getState();
    mismatchedState.search.filters.clientApp = 'nothing';
    const props = mapStateToProps(mismatchedState, ownProps);

    assert.deepEqual(props, {
      hasSearchParams: true,
      pathname: '/themes/ad-block/',
      queryParams: { page: 1 },
    });
  });
});
