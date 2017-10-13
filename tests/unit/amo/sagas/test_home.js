import SagaTester from 'redux-saga-tester';

import * as collectionsApi from 'amo/api/collections';
import { LANDING_PAGE_ADDON_COUNT } from 'amo/constants';
import homeReducer, {
  fetchHomeAddons,
  loadHomeAddons,
} from 'amo/reducers/home';
import homeSaga from 'amo/sagas/home';
import * as searchApi from 'core/api/search';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_TRENDING,
  SEARCH_SORT_RANDOM,
} from 'core/constants';
import apiReducer from 'core/reducers/api';
import { createStubErrorHandler } from 'tests/unit/helpers';
import {
  createAddonsApiResult,
  createFakeCollectionAddons,
  dispatchClientMetadata,
  fakeAddon,
  fakeTheme,
} from 'tests/unit/amo/helpers';


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
      sagaTester.dispatch(fetchHomeAddons({
        errorHandlerId: errorHandler.id,
        featuredCollectionSlug: 'some-slug',
        featuredCollectionUser: 'some-user',
        ...params,
      }));
    }

    it('calls the API to fetch the add-ons to display on home', async () => {
      const state = sagaTester.getState();

      const slug = 'collection-slug';
      const user = 'user-id-or-name';

      const baseArgs = { api: state.api };
      const baseFilters = {
        page_size: LANDING_PAGE_ADDON_COUNT,
      };

      const popularExtensions = createAddonsApiResult([{
        ...fakeAddon, slug: 'popular-addon',
      }]);
      mockSearchApi
        .expects('search')
        .withArgs({
          ...baseArgs,
          filters: {
            ...baseFilters,
            addonType: ADDON_TYPE_EXTENSION,
            sort: SEARCH_SORT_POPULAR,
          },
          page: 1,
        })
        .returns(Promise.resolve(popularExtensions));

      const featuredCollection = createFakeCollectionAddons();
      mockCollectionsApi
        .expects('getCollectionAddons')
        .withArgs({
          ...baseArgs,
          page: 1,
          slug,
          user,
        })
        .returns(Promise.resolve(featuredCollection));

      const featuredThemes = createAddonsApiResult([fakeTheme]);
      mockSearchApi
        .expects('search')
        .withArgs({
          ...baseArgs,
          filters: {
            ...baseFilters,
            addonType: ADDON_TYPE_THEME,
            featured: true,
            sort: SEARCH_SORT_RANDOM,
          },
          page: 1,
        })
        .returns(Promise.resolve(featuredThemes));

      const upAndComingExtensions = createAddonsApiResult([{
        ...fakeAddon, slug: 'trending-addon',
      }]);
      mockSearchApi
        .expects('search')
        .withArgs({
          ...baseArgs,
          filters: {
            ...baseFilters,
            addonType: ADDON_TYPE_EXTENSION,
            sort: SEARCH_SORT_TRENDING,
          },
          page: 1,
        })
        .returns(Promise.resolve(upAndComingExtensions));

      _fetchHomeAddons({
        featuredCollectionSlug: slug,
        featuredCollectionUser: user,
      });

      const expectedLoadAction = loadHomeAddons({
        featuredCollection,
        featuredThemes,
        popularExtensions,
        upAndComingExtensions,
      });

      await sagaTester.waitFor(expectedLoadAction.type);
      mockCollectionsApi.verify();
      mockSearchApi.verify();

      const calledActions = sagaTester.getCalledActions();
      const loadAction = calledActions[2];
      expect(loadAction).toEqual(expectedLoadAction);
    });

    it('clears the error handler', async () => {
      _fetchHomeAddons();

      const expectedAction = errorHandler.createClearingAction();

      await sagaTester.waitFor(expectedAction.type);
      expect(sagaTester.getCalledActions()[1])
        .toEqual(errorHandler.createClearingAction());
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');

      mockCollectionsApi
        .expects('getCollectionAddons')
        .returns(Promise.reject(error));

      _fetchHomeAddons();

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);
      expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
    });
  });
});
