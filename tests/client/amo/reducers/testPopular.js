import popular from 'amo/reducers/popular';


describe('popular reducer', () => {
  describe('POPULAR_LOADED', () => {
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
      const { results } = popular(initialState, {
        type: 'POPULAR_LOADED',
        payload: {
          filters: { addonType: 'theme' },
          ...response,
        },
      });
      assert.deepEqual(results, [{ slug: 'foo' }, { slug: 'food' }]);
    });
  });

  describe('POPULAR_FAILED', () => {
    it('overrides the initialState with page and filters', () => {
      const filters = { addonType: 'theme' };
      const initialState = {
        filters,
        foo: 'bar',
        page: 100,
        results: [1, 2, 3],
      };
      const state = popular(initialState,
        { type: 'POPULAR_FAILED', payload: { page: 4, filters } });
      assert.deepEqual(state,
        { count: 0, filters: {}, loading: false, results: [] });
    });
  });
});
