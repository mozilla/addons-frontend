import {
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
} from 'amo/constants';
import homeReducer, {
  createInternalHeroShelves,
  fetchHomeData,
  initialState,
  loadHomeData,
} from 'amo/reducers/home';
import { createInternalAddon } from 'core/reducers/addons';
import { ADDON_TYPE_THEME, CLIENT_APP_FIREFOX } from 'core/constants';
import { setClientApp } from 'core/actions';
import {
  createAddonsApiResult,
  createFakeCollectionAddon,
  createFakeCollectionAddonsListResponse,
  dispatchClientMetadata,
  fakeAddon,
  createHeroShelves,
} from 'tests/unit/helpers';

describe(__filename, () => {
  describe('reducer', () => {
    const _loadHomeData = ({
      store,
      collections = [],
      heroShelves = createHeroShelves(),
      shelves = {},
    }) => {
      store.dispatch(
        loadHomeData({
          collections,
          heroShelves,
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

      _loadHomeData({
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

      _loadHomeData({
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

    it('loads hero shelves', () => {
      const { store } = dispatchClientMetadata();

      const heroShelves = createHeroShelves();
      _loadHomeData({
        store,
        heroShelves,
      });

      const homeState = store.getState().home;

      expect(homeState.heroShelves).toEqual(
        createInternalHeroShelves(heroShelves),
      );
    });

    it('sets null when a shelf has no response', () => {
      const { store } = dispatchClientMetadata();
      const shelfName1 = 'someShelfName1';
      const shelfName2 = 'someShelfName2';
      const addon1 = { ...fakeAddon, slug: 'addon1' };

      _loadHomeData({
        store,
        shelves: {
          [shelfName1]: createAddonsApiResult([addon1]),
          [shelfName2]: null,
        },
      });

      const homeState = store.getState().home;

      expect(homeState.shelves[shelfName1]).toEqual([
        createInternalAddon(addon1),
      ]);
      expect(homeState.shelves[shelfName2]).toEqual(null);
    });

    it('loads the the correct amount of theme add-ons in a collection to display on homepage', () => {
      const { store } = dispatchClientMetadata();

      _loadHomeData({
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

      _loadHomeData({
        store,
        collections: [null],
      });

      const homeState = store.getState().home;

      expect(homeState.collections).toHaveLength(1);
      expect(homeState.collections[0]).toEqual(null);
    });

    it('returns null for an empty collection', () => {
      const { store } = dispatchClientMetadata();

      _loadHomeData({
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
        fetchHomeData({
          collectionsToFetch: [],
          errorHandlerId: 'some-error-handler-id',
          includeFeaturedThemes: true,
        }),
      );

      expect(state.resultsLoaded).toEqual(false);
    });

    it('resets the state when clientApp changes', () => {
      const { store } = dispatchClientMetadata();

      _loadHomeData({
        store,
        collections: [
          createFakeCollectionAddonsListResponse({
            addons: Array(10).fill(createFakeCollectionAddon()),
          }),
        ],
      });

      const prevState = store.getState().home;
      expect(prevState.collections).toHaveLength(1);

      const state = homeReducer(prevState, setClientApp(CLIENT_APP_FIREFOX));
      expect(state).toEqual(initialState);
    });
  });
});
