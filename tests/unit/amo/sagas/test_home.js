import SagaTester from 'redux-saga-tester';

import * as collectionsApi from 'amo/api/collections';
import * as heroApi from 'amo/api/hero';
import {
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_PROMOTED_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
  MOBILE_HOME_PAGE_EXTENSION_COUNT,
} from 'amo/constants';
import homeReducer, {
  abortFetchHomeData,
  fetchHomeData,
  loadHomeData,
} from 'amo/reducers/home';
import homeSaga from 'amo/sagas/home';
import { createApiError } from 'amo/api';
import * as searchApi from 'amo/api/search';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  RECOMMENDED,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_RANDOM,
  SEARCH_SORT_TRENDING,
  SPONSORED,
} from 'amo/constants';
import apiReducer from 'amo/reducers/api';
import {
  createAddonsApiResult,
  createFakeCollectionAddonsListResponse,
  createHeroShelves,
  createStubErrorHandler,
  dispatchClientMetadata,
  fakeAddon,
  fakeTheme,
} from 'tests/unit/helpers';

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
          errorHandlerId: errorHandler.id,
          includeRecommendedThemes: true,
          includeTrendingExtensions: true,
          isDesktopSite: true,
          ...params,
        }),
      );
    }

    it('calls the APIs to fetch the data to display on home for the desktop site', async () => {
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
        .resolves(firstCollection);
      mockCollectionsApi
        .expects('getCollectionAddons')
        .withArgs({
          ...baseArgs,
          slug: secondCollectionSlug,
          userId: secondCollectionUserId,
        })
        .resolves(secondCollection);
      const collections = [firstCollection, secondCollection];

      const recommendedExtensions = createAddonsApiResult([fakeAddon]);
      mockSearchApi
        .expects('search')
        .withArgs({
          ...baseArgs,
          filters: {
            page_size: String(LANDING_PAGE_EXTENSION_COUNT),
            addonType: ADDON_TYPE_EXTENSION,
            promoted: RECOMMENDED,
            sort: SEARCH_SORT_RANDOM,
          },
        })
        .resolves(recommendedExtensions);

      const recommendedThemes = createAddonsApiResult([fakeTheme]);
      mockSearchApi
        .expects('search')
        .withArgs({
          ...baseArgs,
          filters: {
            page_size: String(LANDING_PAGE_THEME_COUNT),
            addonType: ADDON_TYPE_STATIC_THEME,
            promoted: RECOMMENDED,
            sort: SEARCH_SORT_RANDOM,
          },
        })
        .resolves(recommendedThemes);

      const popularExtensions = createAddonsApiResult([fakeAddon]);
      mockSearchApi
        .expects('search')
        .withArgs({
          ...baseArgs,
          filters: {
            page_size: String(LANDING_PAGE_EXTENSION_COUNT),
            addonType: ADDON_TYPE_EXTENSION,
            promoted: RECOMMENDED,
            sort: SEARCH_SORT_POPULAR,
          },
        })
        .resolves(popularExtensions);

      const popularThemes = createAddonsApiResult([fakeAddon]);
      mockSearchApi
        .expects('search')
        .withArgs({
          ...baseArgs,
          filters: {
            page_size: String(LANDING_PAGE_THEME_COUNT),
            addonType: ADDON_TYPE_STATIC_THEME,
            sort: SEARCH_SORT_POPULAR,
          },
        })
        .resolves(popularThemes);

      const trendingExtensions = createAddonsApiResult([fakeAddon]);
      mockSearchApi
        .expects('search')
        .withArgs({
          ...baseArgs,
          filters: {
            page_size: String(LANDING_PAGE_EXTENSION_COUNT),
            addonType: ADDON_TYPE_EXTENSION,
            promoted: RECOMMENDED,
            sort: SEARCH_SORT_TRENDING,
          },
        })
        .resolves(trendingExtensions);

      const promotedExtensions = createAddonsApiResult([fakeAddon]);
      mockSearchApi
        .expects('search')
        .withArgs({
          ...baseArgs,
          filters: {
            addonType: ADDON_TYPE_EXTENSION,
            page_size: String(LANDING_PAGE_PROMOTED_EXTENSION_COUNT),
            promoted: SPONSORED,
            sort: SEARCH_SORT_RANDOM,
          },
        })
        .resolves(promotedExtensions);

      const heroShelves = createHeroShelves();
      mockHeroApi
        .expects('getHeroShelves')
        .withArgs(baseArgs)
        .resolves(heroShelves);

      _fetchHomeData({
        collectionsToFetch: [
          { slug: firstCollectionSlug, userId: firstCollectionUserId },
          { slug: secondCollectionSlug, userId: secondCollectionUserId },
        ],
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
          promotedExtensions,
          trendingExtensions,
        },
      });

      const expectedAction = await sagaTester.waitFor(loadAction.type);
      mockCollectionsApi.verify();
      mockSearchApi.verify();

      expect(expectedAction).toEqual(loadAction);
    });

    it('calls the APIs to fetch the data to display on home for the mobile site', async () => {
      const state = sagaTester.getState();

      const baseArgs = { api: state.api };

      const recommendedExtensions = createAddonsApiResult([fakeAddon]);
      mockSearchApi
        .expects('search')
        .withArgs({
          ...baseArgs,
          filters: {
            page_size: String(MOBILE_HOME_PAGE_EXTENSION_COUNT),
            addonType: ADDON_TYPE_EXTENSION,
            promoted: RECOMMENDED,
            sort: SEARCH_SORT_RANDOM,
          },
        })
        .resolves(recommendedExtensions);

      const heroShelves = createHeroShelves();
      mockHeroApi
        .expects('getHeroShelves')
        .withArgs(baseArgs)
        .resolves(heroShelves);

      _fetchHomeData({ isDesktopSite: false });

      const loadAction = loadHomeData({
        collections: [],
        heroShelves,
        shelves: {
          recommendedExtensions,
        },
      });

      const expectedAction = await sagaTester.waitFor(loadAction.type);
      mockCollectionsApi.verify();
      mockSearchApi.verify();

      expect(expectedAction).toEqual(loadAction);
    });

    it('does not fetch trending extensions if includeTrendingExtensions is false', async () => {
      const collections = [];

      const recommendedExtensions = createAddonsApiResult([fakeAddon]);
      mockSearchApi.expects('search').resolves(recommendedExtensions);

      const recommendedThemes = createAddonsApiResult([fakeTheme]);
      mockSearchApi.expects('search').resolves(recommendedThemes);

      const popularExtensions = createAddonsApiResult([fakeAddon]);
      mockSearchApi.expects('search').resolves(popularExtensions);

      const popularThemes = createAddonsApiResult([fakeAddon]);
      mockSearchApi.expects('search').resolves(popularThemes);

      const promotedExtensions = createAddonsApiResult([fakeAddon]);
      mockSearchApi.expects('search').resolves(promotedExtensions);

      const heroShelves = createHeroShelves();
      mockHeroApi.expects('getHeroShelves').resolves(heroShelves);

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
          promotedExtensions,
          trendingExtensions: null,
        },
      });

      const expectedAction = await sagaTester.waitFor(loadAction.type);
      mockSearchApi.verify();
      expect(expectedAction).toEqual(loadAction);
    });

    it('does not fetch recommended themes if includeRecommendedThemes is false', async () => {
      const collections = [];

      const recommendedExtensions = createAddonsApiResult([fakeAddon]);
      mockSearchApi.expects('search').resolves(recommendedExtensions);

      const popularExtensions = createAddonsApiResult([fakeAddon]);
      mockSearchApi.expects('search').resolves(popularExtensions);

      const popularThemes = createAddonsApiResult([fakeAddon]);
      mockSearchApi.expects('search').resolves(popularThemes);

      const trendingExtensions = createAddonsApiResult([fakeAddon]);
      mockSearchApi.expects('search').resolves(trendingExtensions);

      const promotedExtensions = createAddonsApiResult([fakeAddon]);
      mockSearchApi.expects('search').resolves(promotedExtensions);

      const heroShelves = createHeroShelves();
      mockHeroApi.expects('getHeroShelves').resolves(heroShelves);

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
          promotedExtensions,
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

        mockCollectionsApi.expects('getCollectionAddons').rejects(error);

        const collections = [null];

        const recommendedExtensions = createAddonsApiResult([fakeAddon]);
        mockSearchApi.expects('search').resolves(recommendedExtensions);

        const popularExtensions = createAddonsApiResult([fakeAddon]);
        mockSearchApi.expects('search').resolves(popularExtensions);

        const popularThemes = createAddonsApiResult([fakeAddon]);
        mockSearchApi.expects('search').resolves(popularThemes);

        const trendingExtensions = createAddonsApiResult([fakeAddon]);
        mockSearchApi.expects('search').resolves(trendingExtensions);

        const promotedExtensions = createAddonsApiResult([fakeAddon]);
        mockSearchApi.expects('search').resolves(promotedExtensions);

        const heroShelves = createHeroShelves();
        mockHeroApi.expects('getHeroShelves').resolves(heroShelves);

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
            promotedExtensions,
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

      mockHeroApi.expects('getHeroShelves').resolves(createHeroShelves());

      mockCollectionsApi.expects('getCollectionAddons').rejects(error);

      _fetchHomeData();

      const errorAction = errorHandler.createErrorAction(error);
      const expectedAction = await sagaTester.waitFor(errorAction.type);
      expect(expectedAction).toEqual(errorAction);
    });

    it('aborts fetching for a failed collection fetch', async () => {
      const error = createApiError({ response: { status: 500 } });

      mockHeroApi.expects('getHeroShelves').resolves(createHeroShelves());

      mockCollectionsApi.expects('getCollectionAddons').rejects(error);

      _fetchHomeData();

      const abortAction = abortFetchHomeData();

      const expectedAction = await sagaTester.waitFor(abortAction.type);
      expect(expectedAction).toEqual(abortAction);
    });

    it('dispatches an error for a failed search fetch for the desktop site', async () => {
      const slug = 'collection-slug';
      const userId = 123;

      mockHeroApi.expects('getHeroShelves').resolves(createHeroShelves());

      const firstCollection = createFakeCollectionAddonsListResponse();
      mockCollectionsApi
        .expects('getCollectionAddons')
        .resolves(firstCollection);

      const error = new Error('some API error maybe');

      mockSearchApi.expects('search').exactly(6).rejects(error);

      _fetchHomeData({ collectionsToFetch: [{ slug, userId }] });

      const errorAction = errorHandler.createErrorAction(error);
      const expectedAction = await sagaTester.waitFor(errorAction.type);
      expect(expectedAction).toEqual(errorAction);
    });

    it('dispatches an error for a failed search fetch for the mobile site', async () => {
      mockHeroApi.expects('getHeroShelves').resolves(createHeroShelves());

      const error = new Error('some API error maybe');

      mockSearchApi.expects('search').exactly(1).rejects(error);

      _fetchHomeData({ isDesktopSite: false });

      const errorAction = errorHandler.createErrorAction(error);
      const expectedAction = await sagaTester.waitFor(errorAction.type);
      expect(expectedAction).toEqual(errorAction);
    });

    it('aborts fetching for a failed search fetch', async () => {
      mockHeroApi.expects('getHeroShelves').resolves(createHeroShelves());

      const firstCollection = createFakeCollectionAddonsListResponse();
      mockCollectionsApi
        .expects('getCollectionAddons')
        .resolves(firstCollection);

      const error = new Error('some API error maybe');

      mockSearchApi.expects('search').rejects(error);

      _fetchHomeData({
        collectionsToFetch: [{ slug: 'collection-slug', userId: 123 }],
      });

      const abortAction = abortFetchHomeData();

      const expectedAction = await sagaTester.waitFor(abortAction.type);
      expect(expectedAction).toEqual(abortAction);
    });

    it('dispatches an error for a failed hero fetch', async () => {
      const error = createApiError({ response: { status: 500 } });

      mockHeroApi.expects('getHeroShelves').rejects(error);

      _fetchHomeData();

      const errorAction = errorHandler.createErrorAction(error);
      const expectedAction = await sagaTester.waitFor(errorAction.type);
      expect(expectedAction).toEqual(errorAction);
    });

    it('aborts fetching for a failed hero fetch', async () => {
      const error = createApiError({ response: { status: 500 } });

      mockHeroApi.expects('getHeroShelves').rejects(error);

      _fetchHomeData();

      const abortAction = abortFetchHomeData();

      const expectedAction = await sagaTester.waitFor(abortAction.type);
      expect(expectedAction).toEqual(abortAction);
    });
  });
});
