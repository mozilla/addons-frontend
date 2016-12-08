import highlyRated from 'amo/reducers/highlyRated';


describe('highlyRated reducer', () => {
  describe('HIGHLY_RATED_LOADED', () => {
    let initialState;
    let response;

    beforeEach(() => {
      initialState = {
        filters: { addonType: 'theme' },
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

    it('sets the results', () => {
      const { results } = highlyRated(initialState, {
        type: 'HIGHLY_RATED_LOADED',
        payload: {
          filters: { addonType: 'theme' },
          ...response,
        },
      });
      assert.deepEqual(results, [{ slug: 'foo' }, { slug: 'food' }]);
    });
  });

  describe('HIGHLY_RATED_FAILED', () => {
    it('overrides the initialState with page and filters', () => {
      const page = 5;
      const filters = { addonType: 'theme' };
      const initialState = {
        filters,
        foo: 'bar',
        page: 100,
        results: [1, 2, 3],
      };
      const state = highlyRated(initialState,
        { type: 'HIGHLY_RATED_FAILED', payload: { page, filters } });
      assert.deepEqual(state,
        { count: 0, filters: {}, loading: false, results: [] });
    });
  });
});
