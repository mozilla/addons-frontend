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
        collections: [createFakeCollectionAddons({
          addons: Array(10).fill(fakeAddon),
        })],
        featuredExtensions: createAddonsApiResult([fakeAddon]),
        featuredThemes: createAddonsApiResult([fakeTheme]),
      }));

      const homeState = store.getState().home;

      expect(homeState.resultsLoaded).toEqual(true);
      expect(homeState.collections)
        .toHaveLength(1);
      expect(homeState.collections[0])
        .toHaveLength(LANDING_PAGE_ADDON_COUNT);
      expect(homeState.collections[0]).toEqual(
        Array(LANDING_PAGE_ADDON_COUNT).fill(createInternalAddon(fakeAddon))
      );
      expect(homeState.featuredExtensions).toEqual([
        createInternalAddon(fakeAddon),
      ]);
      expect(homeState.featuredThemes).toEqual([
        createInternalAddon(fakeTheme),
      ]);
    });

    it('sets `resultsLoaded` to `false` when fetching home add-ons', () => {
      const loadedState = { ...initialState, resultsLoaded: true };

      const state = homeReducer(loadedState, fetchHomeAddons({
        errorHandlerId: 'some-error-handler-id',
        collectionsToFetch: [],
      }));

      expect(state.resultsLoaded).toEqual(false);
    });
  });

  describe('fetchHomeAddons()', () => {
    const defaultParams = {
      errorHandlerId: 'some-error-handler-id',
      collectionsToFetch: [],
    };

    it('throws an error when errorHandlerId is missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.errorHandlerId;

      expect(() => {
        fetchHomeAddons(partialParams);
      }).toThrow('errorHandlerId is required');
    });

    it('throws an error when collectionsToFetch is missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.collectionsToFetch;

      expect(() => {
        fetchHomeAddons(partialParams);
      }).toThrow('collectionsToFetch is required');
    });
  });

  describe('loadHomeAddons()', () => {
    const defaultParams = {
      collections: [],
      featuredExtensions: {},
      featuredThemes: {},
    };

    it('throws an error when the collections array is missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.collections;

      expect(() => {
        loadHomeAddons(partialParams);
      }).toThrow('collections is required');
    });

    it('throws an error when featured extensions are missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.featuredExtensions;

      expect(() => {
        loadHomeAddons(partialParams);
      }).toThrow('featuredExtensions are required');
    });

    it('throws an error when popular themes are missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.featuredThemes;

      expect(() => {
        loadHomeAddons(partialParams);
      }).toThrow('featuredThemes are required');
    });
  });
});
