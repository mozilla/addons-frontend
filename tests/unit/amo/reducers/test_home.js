import {
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
} from 'amo/constants';
import homeReducer, {
  fetchHomeAddons,
  initialState,
  loadHomeAddons,
} from 'amo/reducers/home';
import { createInternalAddon } from 'core/reducers/addons';
import { ADDON_TYPE_THEME } from 'core/constants';
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
    const _loadHomeAddons = ({
      store,
      collections = [],
      featuredExtensions = createAddonsApiResult([fakeAddon]),
      featuredThemes = createAddonsApiResult([fakeTheme]),
      popularExtensions = createAddonsApiResult([fakeAddon]),
    }) => {
      store.dispatch(
        loadHomeAddons({
          collections,
          featuredExtensions,
          featuredThemes,
          popularExtensions,
        }),
      );
    };

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

      _loadHomeAddons({
        store,
        collections: [
          createFakeCollectionAddonsListResponse({
            addons: Array(10).fill(createFakeCollectionAddon()),
          }),
        ],
        featuredExtensions: createAddonsApiResult([fakeAddon]),
        featuredThemes: createAddonsApiResult([fakeTheme]),
        popularExtensions: createAddonsApiResult([fakeAddon]),
      });

      const homeState = store.getState().home;

      expect(homeState.resultsLoaded).toEqual(true);
      expect(homeState.collections).toHaveLength(1);
      expect(homeState.collections[0]).toHaveLength(
        LANDING_PAGE_EXTENSION_COUNT,
      );
      expect(homeState.collections[0]).toEqual(
        Array(LANDING_PAGE_EXTENSION_COUNT).fill(
          createInternalAddon(fakeAddon),
        ),
      );
      expect(homeState.featuredExtensions).toEqual([
        createInternalAddon(fakeAddon),
      ]);
      expect(homeState.featuredThemes).toEqual([
        createInternalAddon(fakeTheme),
      ]);
      expect(homeState.popularExtensions).toEqual([
        createInternalAddon(fakeAddon),
      ]);
    });

    it('loads the the correct amount of theme add-ons in a collection to display on homepage', () => {
      const { store } = dispatchClientMetadata();

      _loadHomeAddons({
        store,
        collections: [
          createFakeCollectionAddonsListResponse({
            addons: Array(10).fill({
              ...createFakeCollectionAddon({
                addon: {
                  ...fakeAddon,
                  type: ADDON_TYPE_THEME,
                },
              }),
            }),
          }),
        ],
      });

      const homeState = store.getState().home;

      expect(homeState.resultsLoaded).toEqual(true);
      expect(homeState.collections).toHaveLength(1);

      expect(homeState.collections[0]).toEqual(
        Array(LANDING_PAGE_THEME_COUNT).fill(
          createInternalAddon({
            ...fakeAddon,
            type: ADDON_TYPE_THEME,
          }),
        ),
      );
    });

    it('loads a null for a missing collection', () => {
      const { store } = dispatchClientMetadata();

      _loadHomeAddons({
        store,
        collections: [null],
      });

      const homeState = store.getState().home;

      expect(homeState.collections).toHaveLength(1);
      expect(homeState.collections[0]).toEqual(null);
    });

    it('returns null for an empty collection', () => {
      const { store } = dispatchClientMetadata();

      _loadHomeAddons({
        store,
        collections: [
          createFakeCollectionAddonsListResponse({
            addons: [],
          }),
        ],
      });

      const homeState = store.getState().home;
      expect(homeState.collections).toEqual([null]);
    });

    it('loads an empty array if featured themes is null', () => {
      const { store } = dispatchClientMetadata();

      _loadHomeAddons({
        store,
        collections: [],
        featuredThemes: null,
      });

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
