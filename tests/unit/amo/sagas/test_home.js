import SagaTester from 'redux-saga-tester';

import * as collectionsApi from 'amo/api/collections';
import * as heroApi from 'amo/api/hero';
import {
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
} from 'amo/constants';
import homeReducer, { fetchHomeData, loadHomeData } from 'amo/reducers/home';
import homeSaga from 'amo/sagas/home';
import { createApiError } from 'core/api';
import * as searchApi from 'core/api/search';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_RANDOM,
  SEARCH_SORT_TRENDING,
} from 'core/constants';
import apiReducer from 'core/reducers/api';
import {
  createAddonsApiResult,
  createFakeCollectionAddonsListResponse,
  createHeroShelves,
  createStubErrorHandler,
  dispatchClientMetadata,
  fakeAddon,
  fakeTheme,
} from 'tests/unit/helpers';
import { getAddonTypeFilter } from 'core/utils';

describe(__filename, () => {
  let errorHandler;
  let mockCollectionsApi;
  let mockHeroApi;
  let mockSearchApi;
  let sagaTester;

  beforeEach(() => {
    errorHandler = createStubErrorHandler();
    mockCollectionsApi = sinon.mock(collectionsApi);
    mockHeroApi = sinon.mock(heroApi);
    mockSearchApi = sinon.mock(searchApi);
    sagaTester = new SagaTester({
      initialState: dispatchClientMetadata().state,
      reducers: {
        api: apiReducer,
        home: homeReducer,
      },
    });
    sagaTester.start(homeSaga);
  });

  describe('fetchHomeData', () => {
    function _fetchHomeData(params) {
      sagaTester.dispatch(
        fetchHomeData({
          collectionsToFetch: [{ slug: 'some-slug', user: 'some-user' }],
          enableFeatureRecommendedBadges: true,
          errorHandlerId: errorHandler.id,
          includeRecommendedThemes: true,
          includeTrendingExtensions: true,
          ...params,
        }),
      );
    }

    it.each([true, false])(
      'calls the API to fetch the data to display on home, enableFeatureRecommendedBadges: %s',
      async (enableFeatureRecommendedBadges) => {
        const state = sagaTester.getState();

        const firstCollectionSlug = 'collection-slug';
        const firstCollectionUserId = 123;
        const secondCollectionSlug = 'collection-slug-2';
        const secondCollectionUserId = 456;

        const baseArgs = { api: state.api };

        const firstCollection = createFakeCollectionAddonsListResponse();
        const secondCollection = createFakeCollectionAddonsListResponse();
        mockCollectionsApi
          .expects('getCollectionAddons')
          .withArgs({
            ...baseArgs,
            slug: firstCollectionSlug,
            userId: firstCollectionUserId,
          })
          .returns(Promise.resolve(firstCollection));
        mockCollectionsApi
          .expects('getCollectionAddons')
          .withArgs({
            ...baseArgs,
            slug: secondCollectionSlug,
            userId: secondCollectionUserId,
          })
          .returns(Promise.resolve(secondCollection));
        const collections = [firstCollection, secondCollection];

        const recommendedExtensions = createAddonsApiResult([fakeAddon]);
        mockSearchApi
          .expects('search')
          .withArgs({
            ...baseArgs,
            filters: {
              page_size: String(LANDING_PAGE_EXTENSION_COUNT),
              addonType: ADDON_TYPE_EXTENSION,
              featured: enableFeatureRecommendedBadges ? undefined : true,
              recommended: enableFeatureRecommendedBadges ? true : undefined,
              sort: SEARCH_SORT_RANDOM,
            },
          })
          .returns(Promise.resolve(recommendedExtensions));

        const recommendedThemes = createAddonsApiResult([fakeTheme]);
        mockSearchApi
          .expects('search')
          .withArgs({
            ...baseArgs,
            filters: {
              page_size: String(LANDING_PAGE_THEME_COUNT),
              addonType: getAddonTypeFilter(ADDON_TYPE_THEME),
              featured: enableFeatureRecommendedBadges ? undefined : true,
              recommended: enableFeatureRecommendedBadges ? true : undefined,
              sort: SEARCH_SORT_RANDOM,
            },
          })
          .returns(Promise.resolve(recommendedThemes));

        const popularExtensions = createAddonsApiResult([fakeAddon]);
        mockSearchApi
          .expects('search')
          .withArgs({
            ...baseArgs,
            filters: {
              page_size: String(LANDING_PAGE_EXTENSION_COUNT),
              addonType: ADDON_TYPE_EXTENSION,
              recommended: enableFeatureRecommendedBadges ? true : undefined,
              sort: SEARCH_SORT_POPULAR,
            },
          })
          .returns(Promise.resolve(recommendedExtensions));

        const popularThemes = createAddonsApiResult([fakeAddon]);
        mockSearchApi
          .expects('search')
          .withArgs({
            ...baseArgs,
            filters: {
              page_size: String(LANDING_PAGE_THEME_COUNT),
              addonType: getAddonTypeFilter(ADDON_TYPE_THEME),
              sort: SEARCH_SORT_POPULAR,
            },
          })
          .returns(Promise.resolve(recommendedExtensions));

        const trendingExtensions = createAddonsApiResult([fakeAddon]);
        mockSearchApi
          .expects('search')
          .withArgs({
            ...baseArgs,
            filters: {
              page_size: String(LANDING_PAGE_EXTENSION_COUNT),
              addonType: ADDON_TYPE_EXTENSION,
              recommended: enableFeatureRecommendedBadges ? true : undefined,
              sort: SEARCH_SORT_TRENDING,
            },
          })
          .returns(Promise.resolve(recommendedExtensions));

        const heroShelves = createHeroShelves();
        mockHeroApi
          .expects('getHeroShelves')
          .withArgs(baseArgs)
          .returns(Promise.resolve(heroShelves));

        _fetchHomeData({
          collectionsToFetch: [
            { slug: firstCollectionSlug, userId: firstCollectionUserId },
            { slug: secondCollectionSlug, userId: secondCollectionUserId },
          ],
          enableFeatureRecommendedBadges,
          includeRecommendedThemes: true,
        });

        const loadAction = loadHomeData({
          collections,
          heroShelves,
          shelves: {
            recommendedExtensions,
            recommendedThemes,
            popularExtensions,
            popularThemes,
            trendingExtensions,
          },
        });

        const expectedAction = await sagaTester.waitFor(loadAction.type);
        mockCollectionsApi.verify();
        mockSearchApi.verify();

        expect(expectedAction).toEqual(loadAction);
      },
    );

    it('does not fetch trending extensions if includeTrendingExtensions is false', async () => {
      const collections = [];

      const recommendedExtensions = createAddonsApiResult([fakeAddon]);
      mockSearchApi
        .expects('search')
        .returns(Promise.resolve(recommendedExtensions));

      const recommendedThemes = createAddonsApiResult([fakeTheme]);
      mockSearchApi
        .expects('search')
        .returns(Promise.resolve(recommendedThemes));

      const popularExtensions = createAddonsApiResult([fakeAddon]);
      mockSearchApi
        .expects('search')
        .returns(Promise.resolve(popularExtensions));

      const popularThemes = createAddonsApiResult([fakeAddon]);
      mockSearchApi.expects('search').returns(Promise.resolve(popularThemes));

      const heroShelves = createHeroShelves();
      mockHeroApi
        .expects('getHeroShelves')
        .returns(Promise.resolve(heroShelves));

      _fetchHomeData({
        collectionsToFetch: [],
        includeTrendingExtensions: false,
      });

      const loadAction = loadHomeData({
        collections,
        heroShelves,
        shelves: {
          recommendedExtensions,
          recommendedThemes,
          popularExtensions,
          popularThemes,
          trendingExtensions: null,
        },
      });

      const expectedAction = await sagaTester.waitFor(loadAction.type);
      mockSearchApi.verify();
      expect(expectedAction).toEqual(loadAction);
    });

    it('does not fetch featured themes if includeRecommendedThemes is false', async () => {
      const collections = [];

      const recommendedExtensions = createAddonsApiResult([fakeAddon]);
      mockSearchApi
        .expects('search')
        .returns(Promise.resolve(recommendedExtensions));

      const popularExtensions = createAddonsApiResult([fakeAddon]);
      mockSearchApi
        .expects('search')
        .returns(Promise.resolve(popularExtensions));

      const popularThemes = createAddonsApiResult([fakeAddon]);
      mockSearchApi.expects('search').returns(Promise.resolve(popularThemes));

      const trendingExtensions = createAddonsApiResult([fakeAddon]);
      mockSearchApi
        .expects('search')
        .returns(Promise.resolve(trendingExtensions));

      const heroShelves = createHeroShelves();
      mockHeroApi
        .expects('getHeroShelves')
        .returns(Promise.resolve(heroShelves));

      _fetchHomeData({
        collectionsToFetch: [],
        includeRecommendedThemes: false,
      });

      const loadAction = loadHomeData({
        collections,
        heroShelves,
        shelves: {
          recommendedExtensions,
          recommendedThemes: null,
          popularExtensions,
          popularThemes,
          trendingExtensions,
        },
      });

      const expectedAction = await sagaTester.waitFor(loadAction.type);
      mockSearchApi.verify();
      expect(expectedAction).toEqual(loadAction);
    });

    it.each([401, 403, 404])(
      'loads a null for a collection that returns a %i',
      async (status) => {
        const error = createApiError({ response: { status } });

        const firstCollectionSlug = 'collection-slug';
        const firstCollectionUserId = 'user-id-or-name';

        mockCollectionsApi
          .expects('getCollectionAddons')
          .returns(Promise.reject(error));

        const collections = [null];

        const recommendedExtensions = createAddonsApiResult([fakeAddon]);
        mockSearchApi
          .expects('search')
          .returns(Promise.resolve(recommendedExtensions));

        const popularExtensions = createAddonsApiResult([fakeAddon]);
        mockSearchApi
          .expects('search')
          .returns(Promise.resolve(popularExtensions));

        const popularThemes = createAddonsApiResult([fakeAddon]);
        mockSearchApi.expects('search').returns(Promise.resolve(popularThemes));

        const trendingExtensions = createAddonsApiResult([fakeAddon]);
        mockSearchApi
          .expects('search')
          .returns(Promise.resolve(trendingExtensions));

        const heroShelves = createHeroShelves();
        mockHeroApi
          .expects('getHeroShelves')
          .returns(Promise.resolve(heroShelves));

        _fetchHomeData({
          collectionsToFetch: [
            { slug: firstCollectionSlug, userId: firstCollectionUserId },
          ],
          includeRecommendedThemes: false,
        });

        const loadAction = loadHomeData({
          collections,
          heroShelves,
          shelves: {
            recommendedExtensions,
            recommendedThemes: null,
            popularExtensions,
            popularThemes,
            trendingExtensions,
          },
        });

        const expectedAction = await sagaTester.waitFor(loadAction.type);
        expect(expectedAction).toEqual(loadAction);
      },
    );

    it('clears the error handler', async () => {
      _fetchHomeData();

      const errorAction = errorHandler.createClearingAction();

      const expectedAction = await sagaTester.waitFor(errorAction.type);
      expect(expectedAction).toEqual(errorAction);
    });

    it('dispatches an error for a failed collection fetch', async () => {
      const error = createApiError({ response: { status: 500 } });

      mockHeroApi
        .expects('getHeroShelves')
        .returns(Promise.resolve(createHeroShelves()));

      mockCollectionsApi
        .expects('getCollectionAddons')
        .returns(Promise.reject(error));

      _fetchHomeData();

      const errorAction = errorHandler.createErrorAction(error);
      const expectedAction = await sagaTester.waitFor(errorAction.type);
      expect(expectedAction).toEqual(errorAction);
    });

    it('dispatches an error for a failed search fetch', async () => {
      const state = sagaTester.getState();

      const slug = 'collection-slug';
      const userId = 123;

      mockHeroApi
        .expects('getHeroShelves')
        .returns(Promise.resolve(createHeroShelves()));

      const firstCollection = createFakeCollectionAddonsListResponse();
      mockCollectionsApi
        .expects('getCollectionAddons')
        .withArgs({
          api: state.api,
          slug,
          userId,
        })
        .returns(Promise.resolve(firstCollection));

      const error = new Error('some API error maybe');

      mockSearchApi
        .expects('search')
        .exactly(5)
        .returns(Promise.reject(error));

      _fetchHomeData({ collectionsToFetch: [{ slug, userId }] });

      const errorAction = errorHandler.createErrorAction(error);
      const expectedAction = await sagaTester.waitFor(errorAction.type);
      expect(expectedAction).toEqual(errorAction);
    });

    it('dispatches an error for a failed hero fetch', async () => {
      const error = createApiError({ response: { status: 500 } });

      mockHeroApi.expects('getHeroShelves').returns(Promise.reject(error));

      _fetchHomeData();

      const errorAction = errorHandler.createErrorAction(error);
      const expectedAction = await sagaTester.waitFor(errorAction.type);
      expect(expectedAction).toEqual(errorAction);
    });
  });
});
