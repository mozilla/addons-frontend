import { searchLoad, searchStart } from 'core/actions/search';
import { createInternalAddon } from 'core/reducers/addons';
import search, {
  abortSearch,
  initialState,
  resetSearch,
} from 'core/reducers/search';
import { fakeAddon } from 'tests/unit/amo/helpers';


describe(__filename, () => {
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

  describe('SEARCH_ABORTED', () => {
    it('resets the results and loading flag', () => {
      const state = search(initialState, searchStart({
        errorHandlerId: 'foo',
        filters: { query: 'foo' },
      }));
      expect(state.filters).toEqual({ query: 'foo' });
      expect(state.loading).toBe(true);
      expect(state.results).toEqual([]);

      const newState = search(state, abortSearch());
      expect(newState.filters).toEqual({ query: 'foo' });
      expect(newState.loading).toBe(false);
      expect(newState.results).toEqual([]);
      expect(newState.count).toEqual(0);
    });
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
      expect(state.count).toEqual(0);
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
            bar: { ...fakeAddon, slug: 'bar' },
            foo: { ...fakeAddon, slug: 'foo' },
            food: { ...fakeAddon, slug: 'food' },
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
      expect(results).toEqual([
        createInternalAddon({ ...fakeAddon, slug: 'foo' }),
        createInternalAddon({ ...fakeAddon, slug: 'food' }),
      ]);
    });

    it('sets the results in order', () => {
      response.result.results = ['food', 'foo'];
      const { results } = getNextState();
      expect(results).toEqual([
        createInternalAddon({ ...fakeAddon, slug: 'food' }),
        createInternalAddon({ ...fakeAddon, slug: 'foo' }),
      ]);
    });
  });

  describe('SEARCH_RESET', () => {
    it('resets the state to its initial state', () => {
      const state = search(initialState, searchStart({
        errorHandlerId: 'foo',
        filters: { query: 'foo' },
      }));
      expect(state).not.toEqual(initialState);

      const newState = search(state, resetSearch());
      expect(newState).toEqual(initialState);
    });
  });
});
