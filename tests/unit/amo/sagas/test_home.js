import SagaTester from 'redux-saga-tester';

import * as collectionsApi from 'amo/api/collections';
import {
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
} from 'amo/constants';
import homeReducer, {
  fetchHomeAddons,
  loadHomeAddons,
} from 'amo/reducers/home';
import homeSaga from 'amo/sagas/home';
import { createApiError } from 'core/api';
import * as searchApi from 'core/api/search';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  SEARCH_SORT_RANDOM,
  SEARCH_SORT_POPULAR,
} from 'core/constants';
import apiReducer from 'core/reducers/api';
import { createStubErrorHandler } from 'tests/unit/helpers';
import {
  createAddonsApiResult,
  createFakeCollectionAddonsListResponse,
  dispatchClientMetadata,
  fakeAddon,
  fakeTheme,
} from 'tests/unit/amo/helpers';
import { getAddonTypeFilter } from 'core/utils';

describe(__filename, () => {
  let errorHandler;
  let mockCollectionsApi;
  let mockSearchApi;
  let sagaTester;

  beforeEach(() => {
    errorHandler = createStubErrorHandler();
    mockCollectionsApi = sinon.mock(collectionsApi);
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

  describe('fetchHomeAddons', () => {
    function _fetchHomeAddons(params) {
      sagaTester.dispatch(
        fetchHomeAddons({
          collectionsToFetch: [{ slug: 'some-slug', user: 'some-user' }],
          errorHandlerId: errorHandler.id,
          includeFeaturedThemes: true,
          ...params,
        }),
      );
    }

    it('calls the API to fetch the add-ons to display on home', async () => {
      const state = sagaTester.getState();

      const firstCollectionSlug = 'collection-slug';
      const firstCollectionUser = 'user-id-or-name';
      const secondCollectionSlug = 'collection-slug-2';
      const secondCollectionUser = 'user-id-or-name-2';

      const baseArgs = { api: state.api };

      const firstCollection = createFakeCollectionAddonsListResponse();
      const secondCollection = createFakeCollectionAddonsListResponse();
      mockCollectionsApi
        .expects('getCollectionAddons')
        .withArgs({
          ...baseArgs,
          slug: firstCollectionSlug,
          username: firstCollectionUser,
        })
        .returns(Promise.resolve(firstCollection));
      mockCollectionsApi
        .expects('getCollectionAddons')
        .withArgs({
          ...baseArgs,
          slug: secondCollectionSlug,
          username: secondCollectionUser,
        })
        .returns(Promise.resolve(secondCollection));
      const collections = [firstCollection, secondCollection];

      const featuredExtensions = createAddonsApiResult([fakeAddon]);
      mockSearchApi
        .expects('search')
        .withArgs({
          ...baseArgs,
          filters: {
            page_size: LANDING_PAGE_EXTENSION_COUNT,
            addonType: ADDON_TYPE_EXTENSION,
            featured: true,
            sort: SEARCH_SORT_RANDOM,
          },
        })
        .returns(Promise.resolve(featuredExtensions));

      const featuredThemes = createAddonsApiResult([fakeTheme]);
      mockSearchApi
        .expects('search')
        .withArgs({
          ...baseArgs,
          filters: {
            page_size: LANDING_PAGE_THEME_COUNT,
            addonType: getAddonTypeFilter(ADDON_TYPE_THEME),
            featured: true,
            sort: SEARCH_SORT_RANDOM,
          },
        })
        .returns(Promise.resolve(featuredThemes));

      const popularExtensions = createAddonsApiResult([fakeAddon]);
      mockSearchApi
        .expects('search')
        .withArgs({
          ...baseArgs,
          filters: {
            page_size: LANDING_PAGE_EXTENSION_COUNT,
            addonType: ADDON_TYPE_EXTENSION,
            sort: SEARCH_SORT_POPULAR,
          },
        })
        .returns(Promise.resolve(featuredExtensions));

      _fetchHomeAddons({
        collectionsToFetch: [
          { slug: firstCollectionSlug, username: firstCollectionUser },
          { slug: secondCollectionSlug, username: secondCollectionUser },
        ],
        includeFeaturedThemes: true,
      });

      const loadAction = loadHomeAddons({
        collections,
        featuredExtensions,
        featuredThemes,
        popularExtensions,
      });

      const expectedAction = await sagaTester.waitFor(loadAction.type);
      mockCollectionsApi.verify();
      mockSearchApi.verify();

      expect(expectedAction).toEqual(loadAction);
    });

    it('does not fetch featured themes if includeFeaturedThemes is false', async () => {
      const collections = [];

      const featuredExtensions = createAddonsApiResult([fakeAddon]);
      mockSearchApi
        .expects('search')
        .returns(Promise.resolve(featuredExtensions));

      const popularExtensions = createAddonsApiResult([fakeAddon]);
      mockSearchApi
        .expects('search')
        .returns(Promise.resolve(popularExtensions));

      _fetchHomeAddons({
        collectionsToFetch: [],
        includeFeaturedThemes: false,
      });

      const loadAction = loadHomeAddons({
        collections,
        featuredExtensions,
        featuredThemes: null,
        popularExtensions,
      });

      const expectedAction = await sagaTester.waitFor(loadAction.type);
      mockSearchApi.verify();
      expect(expectedAction).toEqual(loadAction);
    });

    it.each([401, 404])(
      'loads a null for a collection that returns a %i',
      async (status) => {
        const error = createApiError({ response: { status } });

        const firstCollectionSlug = 'collection-slug';
        const firstCollectionUser = 'user-id-or-name';

        mockCollectionsApi
          .expects('getCollectionAddons')
          .returns(Promise.reject(error));

        const collections = [null];

        const featuredExtensions = createAddonsApiResult([fakeAddon]);
        mockSearchApi
          .expects('search')
          .returns(Promise.resolve(featuredExtensions));

        const popularExtensions = createAddonsApiResult([fakeAddon]);
        mockSearchApi
          .expects('search')
          .returns(Promise.resolve(popularExtensions));

        _fetchHomeAddons({
          collectionsToFetch: [
            { slug: firstCollectionSlug, username: firstCollectionUser },
          ],
          includeFeaturedThemes: false,
        });

        const loadAction = loadHomeAddons({
          collections,
          featuredExtensions,
          featuredThemes: null,
          popularExtensions,
        });

        const expectedAction = await sagaTester.waitFor(loadAction.type);
        expect(expectedAction).toEqual(loadAction);
      },
    );

    it('clears the error handler', async () => {
      _fetchHomeAddons();

      const errorAction = errorHandler.createClearingAction();

      const expectedAction = await sagaTester.waitFor(errorAction.type);
      expect(expectedAction).toEqual(errorAction);
    });

    it('dispatches an error for a failed collection fetch', async () => {
      const error = createApiError({ response: { status: 500 } });

      mockCollectionsApi
        .expects('getCollectionAddons')
        .returns(Promise.reject(error));

      _fetchHomeAddons();

      const errorAction = errorHandler.createErrorAction(error);
      const expectedAction = await sagaTester.waitFor(errorAction.type);
      expect(expectedAction).toEqual(errorAction);
    });

    it('dispatches an error for a failed search fetch', async () => {
      const state = sagaTester.getState();

      const slug = 'collection-slug';
      const username = 'user-id-or-name';

      const baseArgs = { api: state.api };

      const firstCollection = createFakeCollectionAddonsListResponse();
      mockCollectionsApi
        .expects('getCollectionAddons')
        .withArgs({
          ...baseArgs,
          slug,
          username,
        })
        .returns(Promise.resolve(firstCollection));

      const error = new Error('some API error maybe');

      mockSearchApi
        .expects('search')
        .exactly(3)
        .returns(Promise.reject(error));

      _fetchHomeAddons({ collectionsToFetch: [{ slug, username }] });

      const errorAction = errorHandler.createErrorAction(error);
      const expectedAction = await sagaTester.waitFor(errorAction.type);
      expect(expectedAction).toEqual(errorAction);
    });
  });
});
