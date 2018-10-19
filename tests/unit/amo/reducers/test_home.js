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
} from 'tests/unit/helpers';

describe(__filename, () => {
  describe('reducer', () => {
    const _loadHomeAddons = ({ store, collections = [], shelves = {} }) => {
      store.dispatch(
        loadHomeAddons({
          collections,
          shelves,
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

    it('loads collections', () => {
      const { store } = dispatchClientMetadata();

      _loadHomeAddons({
        store,
        collections: [
          createFakeCollectionAddonsListResponse({
            addons: Array(10).fill(createFakeCollectionAddon()),
          }),
        ],
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
    });

    it('loads shelves', () => {
      const { store } = dispatchClientMetadata();
      const shelfName1 = 'someShelfName1';
      const shelfName2 = 'someShelfName2';
      const addon1 = { ...fakeAddon, slug: 'addon1' };
      const addon2 = { ...fakeAddon, slug: 'addon2' };

      _loadHomeAddons({
        store,
        shelves: {
          [shelfName1]: createAddonsApiResult([addon1]),
          [shelfName2]: createAddonsApiResult([addon2]),
        },
      });

      const homeState = store.getState().home;

      expect(homeState.shelves[shelfName1]).toEqual([
        createInternalAddon(addon1),
      ]);
      expect(homeState.shelves[shelfName2]).toEqual([
        createInternalAddon(addon2),
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
