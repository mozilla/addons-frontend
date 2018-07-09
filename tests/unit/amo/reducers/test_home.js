import { LANDING_PAGE_ADDON_COUNT } from 'amo/constants';
import homeReducer, {
  fetchHomeAddons,
  initialState,
  loadHomeAddons,
} from 'amo/reducers/home';
import { createInternalAddon } from 'core/reducers/addons';
import {
  createAddonsApiResult,
  createFakeCollectionAddon,
  createFakeCollectionAddonsListResponse,
  dispatchClientMetadata,
  fakeAddon,
  fakeTheme,
} from 'tests/unit/amo/helpers';

describe(__filename, () => {
  describe('reducer', () => {
    it('initializes properly', () => {
      const state = homeReducer(undefined, {});
      expect(state).toEqual(initialState);
    });

    it('ignores unrelated actions', () => {
      const state = homeReducer(initialState, { type: 'UNRELATED_ACTION' });
      expect(state).toEqual(initialState);
    });

    it('loads the add-ons to display on homepage', () => {
      const { store } = dispatchClientMetadata();

      store.dispatch(
        loadHomeAddons({
          collections: [
            createFakeCollectionAddonsListResponse({
              addons: Array(10).fill(createFakeCollectionAddon()),
            }),
          ],
          featuredExtensions: createAddonsApiResult([fakeAddon]),
          featuredThemes: createAddonsApiResult([fakeTheme]),
        }),
      );

      const homeState = store.getState().home;

      expect(homeState.resultsLoaded).toEqual(true);
      expect(homeState.collections).toHaveLength(1);
      expect(homeState.collections[0]).toHaveLength(LANDING_PAGE_ADDON_COUNT);
      expect(homeState.collections[0]).toEqual(
        Array(LANDING_PAGE_ADDON_COUNT).fill(createInternalAddon(fakeAddon)),
      );
      expect(homeState.featuredExtensions).toEqual([
        createInternalAddon(fakeAddon),
      ]);
      expect(homeState.featuredThemes).toEqual([
        createInternalAddon(fakeTheme),
      ]);
    });

    it('loads a null for a missing collection', () => {
      const { store } = dispatchClientMetadata();

      store.dispatch(
        loadHomeAddons({
          collections: [null],
          featuredExtensions: createAddonsApiResult([fakeAddon]),
          featuredThemes: createAddonsApiResult([fakeTheme]),
        }),
      );

      const homeState = store.getState().home;

      expect(homeState.collections).toHaveLength(1);
      expect(homeState.collections[0]).toEqual(null);
    });

    it('loads an empty array if featured themes is null', () => {
      const { store } = dispatchClientMetadata();

      store.dispatch(
        loadHomeAddons({
          collections: [],
          featuredExtensions: createAddonsApiResult([fakeAddon]),
          featuredThemes: null,
        }),
      );

      const homeState = store.getState().home;
      expect(homeState.featuredThemes).toEqual([]);
    });

    it('sets `resultsLoaded` to `false` when fetching home add-ons', () => {
      const loadedState = { ...initialState, resultsLoaded: true };

      const state = homeReducer(
        loadedState,
        fetchHomeAddons({
          collectionsToFetch: [],
          errorHandlerId: 'some-error-handler-id',
          includeFeaturedThemes: true,
        }),
      );

      expect(state.resultsLoaded).toEqual(false);
    });
  });
});
