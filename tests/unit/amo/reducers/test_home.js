import { LOCATION_CHANGE } from 'connected-react-router';

import {
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
} from 'amo/constants';
import { selectLocalizedUrlWithOutgoing } from 'amo/reducers/addons';
import homeReducer, {
  abortFetchHomeData,
  createInternalHeroCallToAction,
  createInternalHomeShelves,
  createInternalPrimaryHeroShelfExternalAddon,
  createInternalSecondaryHeroModule,
  fetchHomeData,
  initialState,
  loadHomeData,
} from 'amo/reducers/home';
import { setClientApp, setLang } from 'amo/reducers/api';
import { selectLocalizedContent } from 'amo/reducers/utils';
import {
  createAddonsApiResult,
  createFakeCollectionAddon,
  createFakeCollectionAddonsListResponse,
  createInternalAddonWithLang,
  createPrimaryHeroShelf,
  createSecondaryHeroShelf,
  dispatchClientMetadata,
  fakeAddon,
  fakePrimaryHeroShelfExternalAddon,
  getFakeConfig,
  createHomeShelves,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const lang = 'en-US';

  describe('reducer', () => {
    const _loadHomeData = ({
      store,
      collections = [],
      homeShelves = createHomeShelves({ primaryProps: { addon: fakeAddon } }),
      shelves = {},
    }) => {
      // We need a state with setLang called for any tests that load add-ons or collections.
      store.dispatch(setLang(lang));
      store.dispatch(
        loadHomeData({
          collections,
          homeShelves,
          shelves,
        }),
      );
    };

    const _createHomeShelves = (primaryProps = { addon: fakeAddon }) => {
      return createHomeShelves({ primaryProps });
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
          createInternalAddonWithLang(fakeAddon),
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
        createInternalAddonWithLang(addon1),
      ]);
      expect(homeState.shelves[shelfName2]).toEqual([
        createInternalAddonWithLang(addon2),
      ]);
    });

    it('loads hero shelves', () => {
      const { store } = dispatchClientMetadata();

      const homeShelves = _createHomeShelves();
      _loadHomeData({
        store,
        homeShelves,
      });

      const homeState = store.getState().home;

      expect(homeState.homeShelves).toEqual(
        createInternalHomeShelves(homeShelves, lang),
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
        createInternalAddonWithLang(addon1),
      ]);
      expect(homeState.shelves[shelfName2]).toEqual(null);
    });

    it('loads the correct amount of theme add-ons in a collection to display on homepage', () => {
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
          createInternalAddonWithLang({
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

    it('sets `isLoading` to `false` after loading data', () => {
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
      const initialStateWithLang = homeReducer(initialState, setLang(lang));
      expect(state).toEqual(initialStateWithLang);
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

    it('resets the state to the initial state, but keeps lang, after two location changes on the client', () => {
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

      expect(state).toEqual({ ...initialState, lang });
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

  describe('createInternalHomeShelves', () => {
    it('creates an internal representation of hero shelves', () => {
      const addon = fakeAddon;
      const homeShelves = createHomeShelves({
        primaryProps: { addon, external: undefined },
      });

      expect(createInternalHomeShelves(homeShelves, lang)).toEqual({
        results: null,
        primary: {
          addon: createInternalAddonWithLang(addon),
          description: homeShelves.primary.description[lang],
          external: undefined,
          featuredImage: homeShelves.primary.featured_image,
          gradient: {
            end: homeShelves.primary.gradient.end,
            start: homeShelves.primary.gradient.start,
          },
        },
        secondary: {
          cta: createInternalHeroCallToAction(homeShelves.secondary.cta, lang),
          description: homeShelves.secondary.description[lang],
          headline: homeShelves.secondary.headline[lang],
          modules: homeShelves.secondary.modules.map((module) =>
            createInternalSecondaryHeroModule(module, lang),
          ),
        },
      });
    });

    it('works when an addon is not defined', () => {
      const external = fakePrimaryHeroShelfExternalAddon;
      const homeShelves = createHomeShelves({
        primaryProps: {
          addon: undefined,
          external,
        },
      });

      expect(
        createInternalHomeShelves(homeShelves, lang).primary,
      ).toMatchObject({
        addon: undefined,
        external: createInternalPrimaryHeroShelfExternalAddon(external, lang),
      });
    });

    it('works when external is not defined', () => {
      const addon = fakeAddon;
      const homeShelves = createHomeShelves({
        primaryProps: {
          addon,
          external: undefined,
        },
      });

      expect(
        createInternalHomeShelves(homeShelves, lang).primary,
      ).toMatchObject({
        addon: createInternalAddonWithLang(addon),
        external: undefined,
      });
    });

    it('works when primary description is null', () => {
      const addon = fakeAddon;
      const homeShelves = createHomeShelves({
        primaryProps: {
          addon,
          description: null,
        },
      });

      expect(
        createInternalHomeShelves(homeShelves, lang).primary,
      ).toMatchObject({
        addon: createInternalAddonWithLang(addon),
        description: null,
      });
    });

    it('works when secondary cta is null', () => {
      const homeShelves = createHomeShelves({
        primaryProps: { addon: fakeAddon },
        secondaryProps: { cta: null },
      });

      expect(
        createInternalHomeShelves(homeShelves, lang).secondary,
      ).toMatchObject({
        cta: null,
        description: homeShelves.secondary.description[lang],
      });
    });

    it(`works when a secondary module's cta is null`, () => {
      const primaryShelf = createPrimaryHeroShelf({ addon: fakeAddon });
      const secondaryShelf = createSecondaryHeroShelf();
      // Replace the default cta in module 1 with null.
      secondaryShelf.modules[0].cta = null;
      const homeShelves = {
        primary: primaryShelf,
        secondary: secondaryShelf,
      };

      expect(
        createInternalHomeShelves(homeShelves, lang).secondary,
      ).toMatchObject({
        modules: [
          createInternalSecondaryHeroModule(secondaryShelf.modules[0], lang),
          createInternalSecondaryHeroModule(secondaryShelf.modules[1], lang),
          createInternalSecondaryHeroModule(secondaryShelf.modules[2], lang),
        ],
      });
    });

    it('works when primary is null', () => {
      const homeShelves = {
        primary: null,
        secondary: createSecondaryHeroShelf(),
      };

      expect(createInternalHomeShelves(homeShelves, lang).primary).toEqual(
        null,
      );
    });

    it('works when secondary is null', () => {
      const homeShelves = {
        primary: createPrimaryHeroShelf(),
        secondary: null,
      };

      expect(createInternalHomeShelves(homeShelves, lang).secondary).toEqual(
        null,
      );
    });

    it('works when both primary and secondary are null', () => {
      const homeShelves = { primary: null, secondary: null };

      expect(createInternalHomeShelves(homeShelves, lang).primary).toEqual(
        null,
      );
      expect(createInternalHomeShelves(homeShelves, lang).secondary).toEqual(
        null,
      );
    });

    it('throws an exception if neither an addon nor an external entry is provided', () => {
      const homeShelves = createHomeShelves();
      // createhomeShelves won't allow an invalid shelf to be created, so we
      // must do this.
      homeShelves.primary.addon = undefined;
      homeShelves.primary.external = undefined;

      expect(() => createInternalHomeShelves(homeShelves, lang)).toThrow(
        /Either primary.addon or primary.external is required/,
      );
    });
  });

  describe('createInternalHeroCallToAction', () => {
    it('creates an internal representation of the call to action property', () => {
      const secondaryShelf = createSecondaryHeroShelf();

      expect(createInternalHeroCallToAction(secondaryShelf.cta, lang)).toEqual({
        url: secondaryShelf.cta.url,
        outgoing: secondaryShelf.cta.outgoing,
        text: secondaryShelf.cta.text[lang],
      });
    });
  });

  describe('createInternalSecondaryHeroModule', () => {
    it('creates an internal representation of a module of the secondary hero', () => {
      const secondaryShelf = createSecondaryHeroShelf();
      const module = secondaryShelf.modules[0];

      expect(createInternalSecondaryHeroModule(module, lang)).toEqual({
        icon: module.icon,
        description: module.description[lang],
        cta: createInternalHeroCallToAction(module.cta, lang),
      });
    });

    it('works when the cta is null', () => {
      const secondaryShelf = createSecondaryHeroShelf();
      const module = secondaryShelf.modules[0];
      module.cta = null;

      expect(createInternalSecondaryHeroModule(module, lang)).toEqual({
        icon: module.icon,
        description: module.description[lang],
        cta: null,
      });
    });
  });

  describe('createInternalPrimaryHeroShelfExternalAddon', () => {
    it('creates an internal representation of an external add-on', () => {
      const external = fakePrimaryHeroShelfExternalAddon;

      expect(
        createInternalPrimaryHeroShelfExternalAddon(external, lang),
      ).toEqual({
        guid: external.guid,
        homepage: selectLocalizedUrlWithOutgoing(external.homepage, lang),
        id: external.id,
        name: selectLocalizedContent(external.name, lang),
        type: external.type,
      });
    });
  });
});
