import { setLang } from 'amo/reducers/api';
import search, {
  abortSearch,
  initialState,
  searchLoad,
  searchStart,
} from 'amo/reducers/search';
import { createInternalAddonWithLang, fakeAddon } from 'tests/unit/helpers';

describe(__filename, () => {
  it('defaults to no filters', () => {
    const { filters } = search(undefined, { type: 'unrelated' });
    expect(filters).toEqual(null);
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
      const state = search(
        initialState,
        searchStart({
          errorHandlerId: 'foo',
          filters: { query: 'foo' },
        }),
      );
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
      const state = search(
        initialState,
        searchStart({
          errorHandlerId: 'foo',
          filters: { query: 'foo' },
        }),
      );
      expect(state.filters).toEqual({ query: 'foo' });
      expect(state.loading).toBe(true);
      expect(state.results).toEqual([]);
      expect(state.count).toEqual(0);
    });
  });

  describe('SEARCH_LOADED', () => {
    const stateWithLang = search(undefined, setLang('en-US'));
    const response = {
      count: 3,
      results: [
        { ...fakeAddon, slug: 'bar' },
        { ...fakeAddon, slug: 'foo' },
        { ...fakeAddon, slug: 'food' },
      ],
      pageSize: 25,
    };

    it('sets loading', () => {
      // Start with loading: true.
      let state = search(
        stateWithLang,
        searchStart({
          errorHandlerId: 'foo',
          filters: { query: 'foo' },
        }),
      );
      state = search(state, searchLoad(response));
      expect(state.loading).toBe(false);
    });

    it('sets the results', () => {
      const state = search(stateWithLang, searchLoad(response));

      expect(state.results).toEqual(
        response.results.map((addon) => createInternalAddonWithLang(addon)),
      );
    });
  });
});
