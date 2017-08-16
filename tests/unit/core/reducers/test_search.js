import { searchLoad, searchStart } from 'core/actions/search';
import search, { initialState } from 'core/reducers/search';


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
      const state = search(initialState, searchStart({
        errorHandlerId: 'foo',
        filters: { query: 'foo' },
      }));
      expect(state.filters).toEqual({ query: 'foo' });
      expect(state.loading).toBe(true);
      expect(state.results).toEqual([]);
    });
  });

  describe('SEARCH_LOADED', () => {
    let initialLoadedState;
    let response;

    beforeEach(() => {
      initialLoadedState = {
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
      return search(initialLoadedState, searchLoad({
        entities: response.entities,
        result: response.result,
      }));
    }

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
});
