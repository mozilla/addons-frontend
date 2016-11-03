import featured from 'amo/reducers/featured';

describe('featured reducer', () => {
  it('defaults to not loading', () => {
    const { loading } = featured(undefined, { type: 'unrelated' });
    assert.strictEqual(loading, false);
  });

  it('defaults to empty results', () => {
    const { results } = featured(undefined, { type: 'unrelated' });
    assert.deepEqual(results, []);
  });

  describe('FEATURED_LOADED', () => {
    let initialState;
    let response;

    beforeEach(() => {
      initialState = {
        addonType: 'theme',
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
      return featured(initialState, {
        type: 'FEATURED_LOADED',
        payload: {
          filters: { addonType: 'theme' },
          ...response,
        },
      });
    }

    it('sets the results', () => {
      const { results } = getNextState();
      assert.deepEqual(results, [{ slug: 'foo' }, { slug: 'food' }]);
    });
  });

  describe('FEATURED_FAILED', () => {
    it('overrides the initialState with page and filters', () => {
      const initialState = {
        addonType: 'theme',
        foo: 'bar',
        page: 100,
        results: [1, 2, 3],
      };
      const state = featured(initialState,
        { type: 'FEATURED_FAILED', payload: { page: 2, addonType: 'theme' } });
      assert.deepEqual(state,
        { count: 0, loading: false, results: [] });
    });
  });
});
