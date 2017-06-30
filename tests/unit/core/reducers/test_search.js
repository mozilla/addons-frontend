import search from 'core/reducers/search';

describe('search reducer', () => {
  it('defaults to an set of filters', () => {
    const { filters } = search(undefined, { type: 'unrelated' });
    expect(filters).toEqual({});
  });

  it('defaults to not loading', () => {
    const { loading } = search(undefined, { type: 'unrelated' });
    expect(loading).toBe(false);
  });

  it('defaults to empty results', () => {
    const { results } = search(undefined, { type: 'unrelated' });
    expect(results).toEqual([]);
  });

  describe('SEARCH_STARTED', () => {
    it('sets the filters and loading', () => {
      const state = search(
        {
          filters: { query: 'bar' },
          loading: false,
          results: [{ slug: 'bar' }],
        },
        { type: 'SEARCH_STARTED', payload: { filters: { query: 'foo' } } });
      expect(state.filters).toEqual({ query: 'foo' });
      expect(state.loading).toBe(true);
      expect(state.results).toEqual([{ slug: 'bar' }]);
    });
  });

  describe('SEARCH_LOADED', () => {
    let initialState;
    let response;

    beforeEach(() => {
      initialState = {
        filters: { query: 'foo' },
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
      return search(initialState, {
        type: 'SEARCH_LOADED',
        payload: {
          filters: { query: 'foo' },
          ...response,
        },
      });
    }

    it('sets the filters', () => {
      const { filters } = getNextState();
      expect(filters).toEqual({ query: 'foo' });
    });

    it('sets loading', () => {
      const { loading } = getNextState();
      expect(loading).toBe(false);
    });

    it('sets the results', () => {
      const { results } = getNextState();
      expect(results).toEqual([{ slug: 'foo' }, { slug: 'food' }]);
    });

    it('sets the results in order', () => {
      response.result.results = ['food', 'foo'];
      const { results } = getNextState();
      expect(results).toEqual([{ slug: 'food' }, { slug: 'foo' }]);
    });
  });

  describe('SEARCH_FAILED', () => {
    it('overrides the initialState with page and filters', () => {
      const page = 5;
      const filters = { query: 'add-ons' };
      const initialState = {
        foo: 'bar',
        filters: { query: 'nothing' },
        page: 100,
        results: [1, 2, 3],
      };
      const state = search(initialState, { type: 'SEARCH_FAILED', payload: { page, filters } });
      expect(state).toEqual({ count: 0, loading: false, page, filters, results: [] });
    });
  });
});
