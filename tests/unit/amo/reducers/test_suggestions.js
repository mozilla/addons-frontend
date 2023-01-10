import { createInternalAddons } from 'amo/reducers/collections';
import reducer, {
  abortFetchSuggestions,
  fetchSuggestions,
  getSuggestionsByCategory,
  initialState,
  loadSuggestions,
} from 'amo/reducers/suggestions';
import { setLang } from 'amo/reducers/api';
import {
  createFakeCollectionAddon,
  createFakeCollectionAddonsListResponse,
  createStubErrorHandler,
} from 'tests/unit/helpers';

describe(__filename, () => {
  it('initializes properly', () => {
    const state = reducer(undefined, {});
    expect(state).toEqual(initialState);
  });

  it('ignores unrelated actions', () => {
    const state = reducer(initialState, { type: 'UNRELATED_ACTION' });
    expect(state).toEqual(initialState);
  });

  it('sets the loading flag when fetching suggestions', () => {
    const slug = 'some-slug';
    const state = reducer(
      undefined,
      fetchSuggestions({
        errorHandlerId: createStubErrorHandler().id,
        slug,
      }),
    );

    expect(state.loading).toEqual(true);
    expect(state.byCategory[slug]).toEqual(null);
  });

  it('loads suggestions', () => {
    const addons = [createFakeCollectionAddon(), createFakeCollectionAddon()];
    const response = createFakeCollectionAddonsListResponse({
      count: addons.length,
      addons,
    });
    const slug = 'some-slug';
    const stateWithLang = reducer(undefined, setLang('en-US'));
    const state = reducer(
      stateWithLang,
      loadSuggestions({
        addons: response.results,
        slug,
      }),
    );

    const loadedSuggestions = getSuggestionsByCategory({ slug, state });

    expect(loadedSuggestions).toEqual(
      createInternalAddons(response.results, state.lang),
    );
  });

  it('resets the loading flag when fetching is aborted', () => {
    const slug = 'some-slug';
    const state = reducer(
      undefined,
      fetchSuggestions({
        errorHandlerId: createStubErrorHandler().id,
        slug,
      }),
    );

    expect(state.loading).toEqual(true);

    const newState = reducer(state, abortFetchSuggestions({ slug }));
    expect(newState.loading).toEqual(false);
  });

  describe('getSuggestionsByCategory', () => {
    it('returns null if no suggestions exist for the guid', () => {
      const state = reducer(undefined, {});
      const slug = 'a-non-existent-slug';

      expect(getSuggestionsByCategory({ slug, state })).toEqual(null);
    });
  });
});
