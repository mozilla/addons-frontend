import { LOCATION_CHANGE } from 'connected-react-router';

import {
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
} from 'amo/constants';
import homeReducer, {
  abortFetchHomeData,
  createInternalHeroShelves,
  fetchHomeData,
  initialState,
  loadHomeData,
  loadMobileHomeData,
} from 'amo/reducers/home';
import { createInternalAddon } from 'core/reducers/addons';
import { ADDON_TYPE_STATIC_THEME, CLIENT_APP_FIREFOX } from 'core/constants';
import { setClientApp } from 'core/reducers/api';
import {
  createAddonsApiResult,
  createFakeCollectionAddon,
  createFakeCollectionAddonsListResponse,
  createPrimaryHeroShelf,
  createSecondaryHeroShelf,
  dispatchClientMetadata,
  fakeAddon,
  fakePrimaryHeroShelfExternal,
  getFakeConfig,
  createHeroShelves,
} from 'tests/unit/helpers';

describe(__filename, () => {
  describe('reducer', () => {
    const _loadHomeData = ({
      store,
      collections = [],
      heroShelves = createHeroShelves({ primaryProps: { addon: fakeAddon } }),
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

    const _createHeroShelves = (primaryProps = { addon: fakeAddon }) => {
      return createHeroShelves({ primaryProps });
    };

    it('initializes properly', () => {
      const state = homeReducer(undefined, {});
      expect(state).toEqual(initialState);
    });

    it('ignores unrelated actions', () => {
      const state = homeReducer(initialState, { type: 'UNRELATED_ACTION' });
      expect(state).toEqual(initialState);
    });

    describe('loadHomeData', () => {
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

        const heroShelves = _createHeroShelves();
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
                    type: ADDON_TYPE_STATIC_THEME,
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
              type: ADDON_TYPE_STATIC_THEME,
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

      it('sets `isLoading` to `false` and `resultsLoaded` to `true` after loading data', () => {
        const { store } = dispatchClientMetadata();

        store.dispatch(
          fetchHomeData({
            collectionsToFetch: [],
            errorHandlerId: 'some-error-handler-id',
          }),
        );

        _loadHomeData({ store });

        const homeState = store.getState().home;

        expect(homeState.isLoading).toEqual(false);
        expect(homeState.resultsLoaded).toEqual(true);
      });
    });

    describe('loadMobileHomeData', () => {
      const _loadMobileHomeData = ({
        store,
        heroShelves = createHeroShelves({ primaryProps: { addon: fakeAddon } }),
        shelves = {},
      }) => {
        store.dispatch(
          loadMobileHomeData({
            heroShelves,
            shelves,
          }),
        );
      };

      it('loads shelves', () => {
        const { store } = dispatchClientMetadata();
        const shelfName1 = 'someShelfName1';
        const shelfName2 = 'someShelfName2';
        const addon1 = { ...fakeAddon, slug: 'addon1' };
        const addon2 = { ...fakeAddon, slug: 'addon2' };

        _loadMobileHomeData({
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

        const heroShelves = _createHeroShelves();
        _loadMobileHomeData({
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

        _loadMobileHomeData({
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

      it('sets `collections` to an empty array', () => {
        const { store } = dispatchClientMetadata();

        _loadMobileHomeData({ store });

        const homeState = store.getState().home;

        expect(homeState.collections).toEqual([]);
      });

      it('sets `isLoading` to `false` and `resultsLoaded` to `true` after loading data', () => {
        const { store } = dispatchClientMetadata();

        store.dispatch(
          fetchHomeData({
            collectionsToFetch: [],
            errorHandlerId: 'some-error-handler-id',
          }),
        );

        _loadMobileHomeData({ store });

        const homeState = store.getState().home;

        expect(homeState.isLoading).toEqual(false);
        expect(homeState.resultsLoaded).toEqual(true);
      });
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

    it('sets `resultsLoaded` to `false` and `isLoading` to `true` when fetching home add-ons', () => {
      const loadedState = { ...initialState, resultsLoaded: true };

      const state = homeReducer(
        loadedState,
        fetchHomeData({
          collectionsToFetch: [],
          errorHandlerId: 'some-error-handler-id',
        }),
      );

      expect(state.resultsLoaded).toEqual(false);
      expect(state.isLoading).toEqual(true);
    });

    it('aborts fetching of data', () => {
      let state = homeReducer(
        undefined,
        fetchHomeData({
          collectionsToFetch: [],
          errorHandlerId: 'some-error-handler-id',
        }),
      );

      state = homeReducer(state, abortFetchHomeData());

      expect(state.isLoading).toEqual(false);
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

    it('sets `resetStateOnNextChange` to `true` after a location change on the client', () => {
      const _config = getFakeConfig({ server: false });

      const state = homeReducer(undefined, { type: LOCATION_CHANGE }, _config);

      expect(state.resetStateOnNextChange).toEqual(true);
    });

    it('does not set `resetStateOnNextChange` to `true` after a location change on the server', () => {
      const _config = getFakeConfig({ server: true });

      const state = homeReducer(undefined, { type: LOCATION_CHANGE }, _config);

      expect(state.resetStateOnNextChange).toEqual(false);
    });

    it('resets the state to the initial state after two location changes on the client', () => {
      const _config = getFakeConfig({ server: false });
      const { store } = dispatchClientMetadata();

      _loadHomeData({
        store,
        collections: [
          createFakeCollectionAddonsListResponse({
            addons: Array(10).fill(createFakeCollectionAddon()),
          }),
        ],
      });

      let state = store.getState().home;
      expect(state.collections).toHaveLength(1);

      // Perform two client-side location changes.
      state = homeReducer(state, { type: LOCATION_CHANGE }, _config);
      state = homeReducer(state, { type: LOCATION_CHANGE }, _config);

      expect(state).toEqual(initialState);
    });

    it('does not reset the state to the initial state after only one location change on the client', () => {
      const _config = getFakeConfig({ server: false });
      const { store } = dispatchClientMetadata();

      _loadHomeData({
        store,
        collections: [
          createFakeCollectionAddonsListResponse({
            addons: Array(10).fill(createFakeCollectionAddon()),
          }),
        ],
      });

      const firstState = store.getState().home;
      expect(firstState.collections).toHaveLength(1);

      const newState = homeReducer(
        firstState,
        { type: LOCATION_CHANGE },
        _config,
      );

      expect(newState).toEqual({
        ...firstState,
        resetStateOnNextChange: true,
      });
    });
  });

  describe('createInternalHeroShelves', () => {
    it('creates an internal representation of hero shelves', () => {
      const addon = fakeAddon;
      const heroShelves = createHeroShelves({
        primaryProps: { addon, external: undefined },
      });

      expect(createInternalHeroShelves(heroShelves)).toEqual({
        primary: {
          addon: createInternalAddon(addon),
          description: heroShelves.primary.description,
          external: undefined,
          featuredImage: heroShelves.primary.featured_image,
          gradient: {
            end: heroShelves.primary.gradient.end,
            start: heroShelves.primary.gradient.start,
          },
        },
        secondary: {
          cta: heroShelves.secondary.cta,
          description: heroShelves.secondary.description,
          headline: heroShelves.secondary.headline,
          modules: heroShelves.secondary.modules,
        },
      });
    });

    it('works when an addon is not defined', () => {
      const external = fakePrimaryHeroShelfExternal;
      const heroShelves = createHeroShelves({
        primaryProps: {
          addon: undefined,
          external,
        },
      });

      expect(createInternalHeroShelves(heroShelves).primary).toMatchObject({
        addon: undefined,
        external,
      });
    });

    it('works when external is not defined', () => {
      const addon = fakeAddon;
      const heroShelves = createHeroShelves({
        primaryProps: {
          addon,
          external: undefined,
        },
      });

      expect(createInternalHeroShelves(heroShelves).primary).toMatchObject({
        addon: createInternalAddon(addon),
        external: undefined,
      });
    });

    it('works when primary description is null', () => {
      const addon = fakeAddon;
      const heroShelves = createHeroShelves({
        primaryProps: {
          addon,
          description: null,
        },
      });

      expect(createInternalHeroShelves(heroShelves).primary).toMatchObject({
        addon: createInternalAddon(addon),
        description: null,
      });
    });

    it('works when secondary cta is null', () => {
      const heroShelves = createHeroShelves({
        primaryProps: { addon: fakeAddon },
        secondaryProps: { cta: null },
      });

      expect(createInternalHeroShelves(heroShelves).secondary).toMatchObject({
        cta: null,
        description: heroShelves.secondary.description,
      });
    });

    it(`works when a secondary module's cta is null`, () => {
      const primaryShelf = createPrimaryHeroShelf({ addon: fakeAddon });
      const secondaryShelf = createSecondaryHeroShelf();
      // Replace the default cta in module 1 with null.
      secondaryShelf.modules[0].cta = null;
      const heroShelves = { primary: primaryShelf, secondary: secondaryShelf };

      expect(createInternalHeroShelves(heroShelves).secondary).toMatchObject({
        modules: heroShelves.secondary.modules,
      });
    });

    it('works when primary is null', () => {
      const heroShelves = {
        primary: null,
        secondary: createSecondaryHeroShelf(),
      };

      expect(createInternalHeroShelves(heroShelves).primary).toEqual(null);
    });

    it('works when secondary is null', () => {
      const heroShelves = {
        primary: createPrimaryHeroShelf(),
        secondary: null,
      };

      expect(createInternalHeroShelves(heroShelves).secondary).toEqual(null);
    });

    it('works when both primary and secondary are null', () => {
      const heroShelves = { primary: null, secondary: null };

      expect(createInternalHeroShelves(heroShelves).primary).toEqual(null);
      expect(createInternalHeroShelves(heroShelves).secondary).toEqual(null);
    });

    it('throws an exception if neither an addon nor an external entry is provided', () => {
      const heroShelves = createHeroShelves();
      // createHeroShelves won't allow an invalid shelf to be created, so we
      // must do this.
      heroShelves.primary.addon = undefined;
      heroShelves.primary.external = undefined;

      expect(() => createInternalHeroShelves(heroShelves)).toThrow(
        /Either primary.addon or primary.external is required/,
      );
    });
  });
});
