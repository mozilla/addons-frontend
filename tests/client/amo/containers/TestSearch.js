import * as searchActions from 'core/actions/search';
import {
  isLoaded,
  loadSearchResultsIfNeeded,
  mapStateToProps,
  parsePage,
} from 'core/containers/SearchPage';
import * as api from 'core/api';

describe('Search.mapStateToProps()', () => {
  const state = {
    api: { lang: 'fr-CA' },
    addons: { ab: { slug: 'ab', name: 'ad-block' },
             cd: { slug: 'cd', name: 'cd-block' } },
    search: { query: 'ad-block', loading: false, results: [{ slug: 'ab', name: 'ad-block' }] },
  };

  it('passes the search state if the URL and state query matches', () => {
    const props = mapStateToProps(state, { location: { query: { q: 'ad-block' } }, params: { application: 'firefox' } });
    assert.deepEqual(props, { hasSearchParams: true, ...state.search });
  });

  it('does not pass search state if the URL and state query do not match', () => {
    const props = mapStateToProps(state, { location: { query: { q: 'more-ads' } } });
    assert.deepEqual(props, { hasSearchParams: true });
  });
});

describe('Search.isLoaded()', () => {
  const state = {
    page: 2,
    query: 'ad-block',
    hasSearchParams: true,
    loading: false,
    results: [{ slug: 'ab', name: 'ad-block' }],
  };

  it('is loaded when not loading and page and query page', () => {
    assert(isLoaded({ state, page: 2, query: 'ad-block' }));
  });

  it('is not loaded when loading', () => {
    assert(!isLoaded({
      state: { ...state, loading: true },
      page: 2,
      query: 'ad-block',
    }));
  });

  it('is not loaded when the query does not match', () => {
    assert(!isLoaded({ state, page: 2, query: 'youtube' }));
  });

  it('is not loaded when the page does not match', () => {
    assert(!isLoaded({ state, page: 3, query: 'ad-block' }));
  });
});

describe('CurrentSearchPage.parsePage()', () => {
  it('returns a number', () => {
    assert.strictEqual(parsePage(10), 10);
  });

  it('parses a number from a string', () => {
    assert.strictEqual(parsePage('8'), 8);
  });

  it('treats negatives as 1', () => {
    assert.strictEqual(parsePage('-10'), 1);
  });

  it('treats words as 1', () => {
    assert.strictEqual(parsePage('hmmm'), 1);
  });

  it('treats "0" as 1', () => {
    assert.strictEqual(parsePage('0'), 1);
  });

  it('treats 0 as 1', () => {
    assert.strictEqual(parsePage(0), 1);
  });

  it('treats empty strings as 1', () => {
    assert.strictEqual(parsePage(''), 1);
  });
});

describe('CurrentSearchPage.loadSearchResultsIfNeeded()', () => {
  it('returns right away when loaded', () => {
    const page = 10;
    const query = 'no ads';
    const state = { hasSearchParams: true, loading: false, page, query };
    const store = { dispatch: sinon.spy(), getState: () => ({ search: state }) };
    const location = { query: { page, q: query } };
    assert.strictEqual(loadSearchResultsIfNeeded({ store, location }), true);
  });

  it('loads the search results when needed', () => {
    const page = 10;
    const query = 'no ads';
    const state = {
      api: { token: 'a.jwt.token' },
      search: {
        hasSearchParams: true,
        loading: false,
        page,
        query: 'old query',
      },
    };
    const dispatch = sinon.spy();
    const store = { dispatch, getState: () => state };
    const location = { query: { page, q: query } };
    const mockApi = sinon.mock(api);
    const entities = sinon.stub();
    const result = sinon.stub();
    mockApi
      .expects('search')
      .once()
      .withArgs({
        addonType: undefined,
        api: state.api,
        auth: false,
        category: undefined,
        page,
        query,
      })
      .returns(Promise.resolve({ entities, result }));
    return loadSearchResultsIfNeeded({ store, location }).then(() => {
      mockApi.verify();
      assert(
        dispatch.firstCall.calledWith(
          searchActions.searchStart({ query, page })),
          'searchStart not called');
      assert(
        dispatch.secondCall.calledWith(
          searchActions.searchLoad({
            addonType: undefined,
            app: undefined,
            category: undefined,
            entities,
            query,
            result,
          })),
          'searchLoad not called');
    });
  });

  it('triggers searchFail when it fails', () => {
    const page = 11;
    const query = 'no ads';
    const state = {
      api: {},
      search: {
        hasSearchParams: true,
        loading: false,
        page,
        query: 'old query',
      },
    };
    const dispatch = sinon.spy();
    const store = { dispatch, getState: () => state };
    const location = { query: { page, q: query } };
    const mockApi = sinon.mock(api);
    mockApi
      .expects('search')
      .once()
      .withArgs({
        addonType: undefined,
        api: state.api,
        auth: false,
        category: undefined,
        page,
        query,
      })
      .returns(Promise.reject());
    return loadSearchResultsIfNeeded({ store, location }).then(() => {
      mockApi.verify();
      assert(
        dispatch.firstCall.calledWith(
          searchActions.searchStart({ query, page })),
          'searchStart not called');
      assert(
        dispatch.secondCall.calledWith(
          searchActions.searchFail({
            addonType: undefined,
            app: undefined,
            category: undefined,
            page,
            query,
          })),
          'searchFail not called');
    });
  });
});
