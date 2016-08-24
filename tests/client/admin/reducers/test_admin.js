import admin from 'admin/reducers/admin';

describe('ADMIN reducer', () => {
  it('defaults to a null query', () => {
    const { query } = admin(undefined, { type: 'unrelated' });
    assert.strictEqual(query, null);
  });

  it('defaults to not loading', () => {
    const { loading } = admin(undefined, { type: 'unrelated' });
    assert.strictEqual(loading, false);
  });

  it('defaults to empty results', () => {
    const { results } = admin(undefined, { type: 'unrelated' });
    assert.deepEqual(results, []);
  });

  describe('SET_QUERY', () => {
    it('sets the query', () => {
      const state = admin(undefined, { type: 'SET_QUERY', payload: { query: 'foo' } });
      assert.equal(state.query, 'foo');
      const newState = admin(state, { type: 'SET_QUERY', payload: { query: 'bar' } });
      assert.equal(newState.query, 'bar');
    });
  });

  describe('ADMIN_SEARCH_STARTED', () => {
    it('sets the query and loading', () => {
      const state = admin(
        { query: 'bar', loading: false, results: [{ slug: 'bar' }] },
        { type: 'SEARCH_STARTED', payload: { query: 'foo' } });
      assert.equal(state.query, 'foo');
      assert.strictEqual(state.loading, true);
      assert.deepEqual(state.results, []);
    });
  });

  describe('ADMIN_SEARCH_LOADED', () => {
    let initialState;
    let response;

    beforeEach(() => {
      initialState = {
        query: 'foo',
        loading: false,
        results: [],
      };
      response = {
        result: { results: ['foo', 'food'] },
        entities: {
          addons: {
            bar: { slug: 'bar' },
            foo: { slug: 'foo' },
            food: { slug: 'food' },
          },
        },
      };
    });

    function getNextState() {
      return admin(initialState, {
        type: 'SEARCH_LOADED',
        payload: {
          query: 'foo',
          ...response,
        },
      });
    }

    it('sets the query', () => {
      const { query } = getNextState();
      assert.equal(query, 'foo');
    });

    it('sets loading', () => {
      const { loading } = getNextState();
      assert.strictEqual(loading, false);
    });

    it('sets the results', () => {
      const { results } = getNextState();
      assert.deepEqual(results, [{ slug: 'foo' }, { slug: 'food' }]);
    });

    it('sets the results in order', () => {
      response.result.results = ['food', 'foo'];
      const { results } = getNextState();
      assert.deepEqual(results, [{ slug: 'food' }, { slug: 'foo' }]);
    });
  });

  describe('ADMIN_SEARCH_FAILED', () => {
    it('resets the initialState with page and query', () => {
      const page = 5;
      const query = 'add-ons';
      const initialState = {
        foo: 'bar', query: 'hi', page: 100, results: [1, 2, 3] };
      const state = admin(initialState, {
        type: 'SEARCH_FAILED', payload: { page, query } });
      assert.deepEqual(state, {
        count: 0, loading: false, page, query, results: [] });
    });
  });
});
