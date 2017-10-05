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
        featuredCollection: createFakeCollectionAddons({
          addons: Array(10).fill(fakeAddon),
        }),
        popularExtensions: createAddonsApiResult([fakeAddon]),
      }));

      const homeState = store.getState().home;

      expect(homeState.resultsLoaded).toEqual(true);
      expect(homeState.popularExtensions).toEqual([
        createInternalAddon(fakeAddon),
      ]);
      expect(homeState.featuredCollection)
        .toHaveLength(LANDING_PAGE_ADDON_COUNT);
      expect(homeState.featuredCollection).toEqual(
        Array(LANDING_PAGE_ADDON_COUNT).fill(createInternalAddon(fakeAddon))
      );
    });

    it('sets `resultsLoaded` to `false` when fetching home add-ons', () => {
      const loadedState = { ...initialState, resultsLoaded: true };

      const state = homeReducer(loadedState, fetchHomeAddons({
        errorHandlerId: 'some-error-handler-id',
        featuredCollectionSlug: 'some-collection-slug',
        featuredCollectionUser: 'mozilla',
      }));

      expect(state.resultsLoaded).toEqual(false);
    });
  });

  describe('fetchHomeAddons()', () => {
    const defaultParams = {
      errorHandlerId: 'some-error-handler-id',
      featuredCollectionSlug: 'some-collection-slug',
      featuredCollectionUser: 'mozilla',
    };

    it('throws an error when errorHandlerId is missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.errorHandlerId;

      expect(() => {
        fetchHomeAddons(partialParams);
      }).toThrow('errorHandlerId is required');
    });

    it('throws an error when featuredCollectionSlug is missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.featuredCollectionSlug;

      expect(() => {
        fetchHomeAddons(partialParams);
      }).toThrow('featuredCollectionSlug is required');
    });

    it('throws an error when featuredCollectionUser is missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.featuredCollectionUser;

      expect(() => {
        fetchHomeAddons(partialParams);
      }).toThrow('featuredCollectionUser is required');
    });
  });

  describe('loadHomeAddons()', () => {
    const defaultParams = {
      popularExtensions: {},
      featuredCollection: {},
    };

    it('throws an error when popular extensions are missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.popularExtensions;

      expect(() => {
        loadHomeAddons(partialParams);
      }).toThrow('popularExtensions is required');
    });

    it('throws an error when featured collection add-ons are missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.featuredCollection;

      expect(() => {
        loadHomeAddons(partialParams);
      }).toThrow('featuredCollection is required');
    });
  });
});
