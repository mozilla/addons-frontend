import { LANDING_PAGE_ADDON_COUNT } from 'amo/constants';
import homeReducer, {
  fetchHomeAddons,
  initialState,
  loadHomeAddons,
} from 'amo/reducers/home';
import { createInternalAddon } from 'core/reducers/addons';
import {
  createAddonsApiResult,
  createFakeCollectionAddons,
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

      store.dispatch(loadHomeAddons({
        firstCollection: createFakeCollectionAddons({
          addons: Array(10).fill(fakeAddon),
        }),
        featuredExtensions: createAddonsApiResult([fakeAddon]),
        featuredThemes: createAddonsApiResult([fakeTheme]),
        popularExtensions: createAddonsApiResult([fakeAddon]),
        topRatedExtensions: createAddonsApiResult([fakeTheme]),
      }));

      const homeState = store.getState().home;

      expect(homeState.resultsLoaded).toEqual(true);
      expect(homeState.firstCollection)
        .toHaveLength(LANDING_PAGE_ADDON_COUNT);
      expect(homeState.firstCollection).toEqual(
        Array(LANDING_PAGE_ADDON_COUNT).fill(createInternalAddon(fakeAddon))
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
      expect(homeState.topRatedExtensions).toEqual([
        createInternalAddon(fakeTheme),
      ]);
    });

    it('sets `resultsLoaded` to `false` when fetching home add-ons', () => {
      const loadedState = { ...initialState, resultsLoaded: true };

      const state = homeReducer(loadedState, fetchHomeAddons({
        errorHandlerId: 'some-error-handler-id',
        firstCollectionSlug: 'some-collection-slug',
        firstCollectionUser: 'mozilla',
      }));

      expect(state.resultsLoaded).toEqual(false);
    });
  });

  describe('fetchHomeAddons()', () => {
    const defaultParams = {
      errorHandlerId: 'some-error-handler-id',
      firstCollectionSlug: 'some-collection-slug',
      firstCollectionUser: 'mozilla',
    };

    it('throws an error when errorHandlerId is missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.errorHandlerId;

      expect(() => {
        fetchHomeAddons(partialParams);
      }).toThrow('errorHandlerId is required');
    });

    it('throws an error when firstCollectionSlug is missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.firstCollectionSlug;

      expect(() => {
        fetchHomeAddons(partialParams);
      }).toThrow('firstCollectionSlug is required');
    });

    it('throws an error when firstCollectionUser is missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.firstCollectionUser;

      expect(() => {
        fetchHomeAddons(partialParams);
      }).toThrow('firstCollectionUser is required');
    });
  });

  describe('loadHomeAddons()', () => {
    const defaultParams = {
      firstCollection: {},
      featuredExtensions: {},
      featuredThemes: {},
      popularExtensions: {},
      topRatedExtensions: {},
      upAndComingExtensions: {},
    };

    it('throws an error when the first collection add-ons are missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.firstCollection;

      expect(() => {
        loadHomeAddons(partialParams);
      }).toThrow('firstCollection is required');
    });

    it('throws an error when featured extensions are missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.featuredExtensions;

      expect(() => {
        loadHomeAddons(partialParams);
      }).toThrow('featuredExtensions are required');
    });

    it('throws an error when featured themes are missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.featuredThemes;

      expect(() => {
        loadHomeAddons(partialParams);
      }).toThrow('featuredThemes are required');
    });

    it('throws an error when popular extensions are missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.popularExtensions;

      expect(() => {
        loadHomeAddons(partialParams);
      }).toThrow('popularExtensions are required');
    });

    it('throws an error when top-rated themes are missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.topRatedExtensions;

      expect(() => {
        loadHomeAddons(partialParams);
      }).toThrow('topRatedExtensions are required');
    });
  });
});
