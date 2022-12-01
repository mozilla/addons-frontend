import { createInternalAddons } from 'amo/reducers/collections';
import reducer, {
  abortFetchSuggestions,
  fetchSuggestions,
  getSuggestionsByCollection,
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
    const collection = 'some-collection';
    const state = reducer(
      undefined,
      fetchSuggestions({
        errorHandlerId: createStubErrorHandler().id,
        collection,
      }),
    );

    expect(state.loading).toEqual(true);
    expect(state.forCollection[collection]).toEqual(null);
  });

  it('loads suggestions', () => {
    const addons = [createFakeCollectionAddon(), createFakeCollectionAddon()];
    const response = createFakeCollectionAddonsListResponse({
      count: addons.length,
      addons,
    });
    const collection = 'some-collection';
    const stateWithLang = reducer(undefined, setLang('en-US'));
    const state = reducer(
      stateWithLang,
      loadSuggestions({
        addons: response.results,
        collection,
      }),
    );

    const loadedSuggestions = getSuggestionsByCollection({ collection, state });

    expect(loadedSuggestions).toEqual(
      createInternalAddons(response.results, state.lang),
    );
  });

  it('resets the loading flag when fetching is aborted', () => {
    const collection = 'some-collection';
    const state = reducer(
      undefined,
      fetchSuggestions({
        errorHandlerId: createStubErrorHandler().id,
        collection,
      }),
    );

    expect(state.loading).toEqual(true);

    const newState = reducer(state, abortFetchSuggestions({ collection }));
    expect(newState.loading).toEqual(false);
  });

  describe('getSuggestionsByCollection', () => {
    it('returns null if no suggestions exist for the guid', () => {
      const state = reducer(undefined, {});
      const collection = 'a-non-existent-collection';

      expect(getSuggestionsByCollection({ collection, state })).toEqual(null);
    });
  });
});
