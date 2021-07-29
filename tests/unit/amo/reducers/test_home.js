import { LOCATION_CHANGE } from 'connected-react-router';

import { ADDON_TYPE_STATIC_THEME, CLIENT_APP_FIREFOX } from 'amo/constants';
import {
  createInternalAddon,
  selectLocalizedUrlWithOutgoing,
} from 'amo/reducers/addons';
import homeReducer, {
  abortFetchHomeData,
  createInternalLinkWithText,
  createInternalHomeShelves,
  createInternalPrimaryHeroShelfExternalAddon,
  createInternalSecondaryHeroModule,
  createInternalShelf,
  fetchHomeData,
  initialState,
  loadHomeData,
} from 'amo/reducers/home';
import { setClientApp, setLang } from 'amo/reducers/api';
import { selectLocalizedContent } from 'amo/reducers/utils';
import {
  createAddonsApiResult,
  createHomeShelves,
  createInternalAddonWithLang,
  createLocalizedString,
  createPrimaryHeroShelf,
  createSecondaryHeroShelf,
  dispatchClientMetadata,
  fakeAddon,
  fakeExternalShelf,
  fakePrimaryHeroShelfExternalAddon,
  getFakeConfig,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const lang = 'en-US';

  describe('reducer', () => {
    const _loadHomeData = ({
      store,
      homeShelves = createHomeShelves({
        resultsProps: [fakeExternalShelf],
        primaryProps: { addon: fakeAddon },
      }),
      shelves = {},
    }) => {
      // We need a state with setLang called for any tests that load add-ons or collections.
      store.dispatch(setLang(lang));
      store.dispatch(
        loadHomeData({
          homeShelves,
          shelves,
        }),
      );
    };

    const _createHomeShelves = (
      resultsProps = [fakeExternalShelf],
      primaryProps = { addon: fakeAddon },
    ) => {
      return createHomeShelves({ resultsProps, primaryProps });
    };

    it('initializes properly', () => {
      const state = homeReducer(undefined, {});
      expect(state).toEqual(initialState);
    });

    it('ignores unrelated actions', () => {
      const state = homeReducer(initialState, { type: 'UNRELATED_ACTION' });
      expect(state).toEqual(initialState);
    });

    it('loads just homeShelves', () => {
      const { store } = dispatchClientMetadata();

      const homeShelves = _createHomeShelves();
      _loadHomeData({
        store,
        homeShelves,
        shelves: {},
      });

      const homeState = store.getState().home;

      expect(homeState.homeShelves).toEqual(
        createInternalHomeShelves(homeShelves, lang),
      );
      expect(homeState.shelves).toEqual({});
    });

    it('loads just shelves', () => {
      const { store } = dispatchClientMetadata();
      const shelfName1 = 'someShelfName1';
      const shelfName2 = 'someShelfName2';
      const addon1 = { ...fakeAddon, slug: 'addon1' };
      const addon2 = { ...fakeAddon, slug: 'addon2' };

      _loadHomeData({
        store,
        homeShelves: null,
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
      expect(homeState.homeShelves).toEqual(null);
    });

    it('loads both homeShelves and shelves', () => {
      const { store } = dispatchClientMetadata();
      const addon = fakeAddon;
      const shelfName = 'someShelf';
      const homeShelves = _createHomeShelves();

      _loadHomeData({
        store,
        homeShelves,
        shelves: {
          [shelfName]: createAddonsApiResult([addon]),
        },
      });

      const homeState = store.getState().home;

      expect(homeState.homeShelves).toEqual(
        createInternalHomeShelves(homeShelves, lang),
      );
      expect(homeState.shelves[shelfName]).toEqual([
        createInternalAddonWithLang(addon),
      ]);
    });

    it('sets `resultsLoaded` to `false` and `isLoading` to `true` when fetching home add-ons', () => {
      const loadedState = { ...initialState, resultsLoaded: true };

      const state = homeReducer(
        loadedState,
        fetchHomeData({
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
        homeShelves: {
          results: [fakeExternalShelf],
          primary: null,
          secondary: null,
        },
      });

      const prevState = store.getState().home;
      expect(prevState.homeShelves.results).toHaveLength(1);

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
        homeShelves: {
          results: [fakeExternalShelf],
          primary: null,
          secondary: null,
        },
      });

      let state = store.getState().home;
      expect(state.homeShelves.results).toHaveLength(1);

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
        homeShelves: {
          results: [fakeExternalShelf],
          primary: null,
          secondary: null,
        },
      });

      const firstState = store.getState().home;
      expect(firstState.homeShelves.results).toHaveLength(1);

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
    it('creates an internal representation of home shelves', () => {
      const addon = fakeAddon;
      const shelf = fakeExternalShelf;
      const homeShelves = createHomeShelves({
        resultsProps: [shelf],
        primaryProps: { addon, external: undefined },
      });

      expect(createInternalHomeShelves(homeShelves, lang)).toEqual({
        results: homeShelves.results.map((result) =>
          createInternalShelf(result, lang),
        ),
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
          cta: createInternalLinkWithText(homeShelves.secondary.cta, lang),
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
        results: [],
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
        results: [],
        primary: null,
        secondary: createSecondaryHeroShelf(),
      };

      expect(createInternalHomeShelves(homeShelves, lang).primary).toEqual(
        null,
      );
    });

    it('works when secondary is null', () => {
      const homeShelves = {
        results: [],
        primary: createPrimaryHeroShelf(),
        secondary: null,
      };

      expect(createInternalHomeShelves(homeShelves, lang).secondary).toEqual(
        null,
      );
    });

    it('works when both primary and secondary are null', () => {
      const homeShelves = { results: [], primary: null, secondary: null };

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

  describe('createInternalShelf', () => {
    it('creates an internal representation of a shelf', () => {
      const addon = fakeAddon;
      const footerText = 'Footer text';
      const footerURL = 'http://testserver/extensions/';
      const title = 'Some title';
      const shelf = {
        ...fakeExternalShelf,
        addons: [addon],
        endpoint: 'search',
        addon_type: ADDON_TYPE_STATIC_THEME,
        footer: {
          url: createLocalizedString(footerURL),
          text: createLocalizedString(footerText),
          outgoing: '',
        },
        title: createLocalizedString(title),
        url: 'https://addons-dev.allizom.org/api/v5/addons/search/?sort=rating&type=statictheme',
      };

      expect(createInternalShelf(shelf, lang)).toEqual({
        addons: [createInternalAddon(addon, lang)],
        addonType: shelf.addon_type,
        endpoint: shelf.endpoint,
        footer: createInternalLinkWithText(shelf.footer, lang),
        title,
        url: shelf.url,
      });
    });
  });

  describe('createInternalLinkWithText', () => {
    it('creates an internal representation of the call to action property', () => {
      const secondaryShelf = createSecondaryHeroShelf();

      expect(createInternalLinkWithText(secondaryShelf.cta, lang)).toEqual({
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
        cta: createInternalLinkWithText(module.cta, lang),
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
