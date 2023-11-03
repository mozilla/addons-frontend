import SagaTester from 'redux-saga-tester';

import {
  ADDON_TYPE_EXTENSION,
  MOBILE_HOME_PAGE_RECOMMENDED_EXTENSIONS_COUNT,
  MOBILE_HOME_PAGE_TRENDING_EXTENSIONS_COUNT,
  RECOMMENDED,
  SEARCH_SORT_RANDOM,
  SEARCH_SORT_TRENDING,
} from 'amo/constants';
import homeReducer, {
  abortFetchHomeData,
  fetchHomeData,
  loadHomeData,
} from 'amo/reducers/home';
import homeSaga from 'amo/sagas/home';
import { createApiError } from 'amo/api';
import * as searchApi from 'amo/api/search';
import * as shelvesApi from 'amo/api/homeShelves';
import apiReducer from 'amo/reducers/api';
import {
  createAddonsApiResult,
  createHomeShelves,
  createStubErrorHandler,
  dispatchClientMetadata,
  fakeAddon,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let baseApiArgs;
  let errorHandler;
  let mockSearchApi;
  let mockShelvesApi;
  let sagaTester;

  beforeEach(() => {
    errorHandler = createStubErrorHandler();
    mockSearchApi = sinon.mock(searchApi);
    mockShelvesApi = sinon.mock(shelvesApi);
    sagaTester = new SagaTester({
      initialState: dispatchClientMetadata().state,
      reducers: {
        api: apiReducer,
        home: homeReducer,
      },
    });
    sagaTester.start(homeSaga);

    const state = sagaTester.getState();
    baseApiArgs = { api: state.api };
  });

  describe('fetchHomeData', () => {
    function _fetchHomeData(params) {
      sagaTester.dispatch(
        fetchHomeData({
          errorHandlerId: errorHandler.id,
          isDesktopSite: true,
          ...params,
        }),
      );
    }

    it('clears the error handler', async () => {
      _fetchHomeData();

      const errorAction = errorHandler.createClearingAction();

      const expectedAction = await sagaTester.waitFor(errorAction.type);
      expect(expectedAction).toEqual(errorAction);
    });

    it('calls the API to fetch the data to display on home for the desktop site', async () => {
      mockSearchApi.expects('search').exactly(0);

      const homeShelves = createHomeShelves();
      mockShelvesApi
        .expects('getHomeShelves')
        .withArgs(baseApiArgs)
        .resolves(homeShelves);

      _fetchHomeData({ isDesktopSite: true });

      const loadAction = loadHomeData({
        homeShelves,
        shelves: {},
      });

      const expectedAction = await sagaTester.waitFor(loadAction.type);
      mockSearchApi.verify();
      mockShelvesApi.verify();

      expect(expectedAction).toEqual(loadAction);
    });

    it('calls the APIs to fetch the data to display on home for the mobile site', async () => {
      const recommendedExtensions = createAddonsApiResult([fakeAddon]);
      mockSearchApi
        .expects('search')
        .withArgs({
          ...baseApiArgs,
          filters: {
            page_size: String(MOBILE_HOME_PAGE_RECOMMENDED_EXTENSIONS_COUNT),
            addonType: ADDON_TYPE_EXTENSION,
            promoted: RECOMMENDED,
            sort: SEARCH_SORT_RANDOM,
          },
        })
        .resolves(recommendedExtensions);

      const trendingExtensions = createAddonsApiResult([fakeAddon]);
      mockSearchApi
        .expects('search')
        .withArgs({
          ...baseApiArgs,
          filters: {
            page_size: String(MOBILE_HOME_PAGE_TRENDING_EXTENSIONS_COUNT),
            addonType: ADDON_TYPE_EXTENSION,
            sort: SEARCH_SORT_TRENDING,
          },
        })
        .resolves(trendingExtensions);

      mockShelvesApi.expects('getHomeShelves').exactly(0);

      _fetchHomeData({ isDesktopSite: false });

      const loadAction = loadHomeData({
        homeShelves: null,
        shelves: {
          recommendedExtensions,
          trendingExtensions,
        },
      });

      const expectedAction = await sagaTester.waitFor(loadAction.type);
      mockShelvesApi.verify();
      mockSearchApi.verify();

      expect(expectedAction).toEqual(loadAction);
    });

    it('dispatches an error for a failed homeShelves fetch', async () => {
      const error = createApiError({ response: { status: 500 } });
      mockShelvesApi.expects('getHomeShelves').rejects(error);

      _fetchHomeData();

      const errorAction = errorHandler.createErrorAction(error);
      const expectedAction = await sagaTester.waitFor(errorAction.type);
      expect(expectedAction).toEqual(errorAction);
    });

    it('dispatches an error for a failed search fetch for the mobile site', async () => {
      mockShelvesApi.expects('getHomeShelves').resolves(createHomeShelves());

      const error = createApiError({ response: { status: 500 } });
      mockSearchApi.expects('search').rejects(error);

      _fetchHomeData({ isDesktopSite: false });

      const errorAction = errorHandler.createErrorAction(error);
      const expectedAction = await sagaTester.waitFor(errorAction.type);
      expect(expectedAction).toEqual(errorAction);
    });

    it('aborts fetching for a failed homeShelves fetch', async () => {
      const error = createApiError({ response: { status: 500 } });
      mockShelvesApi.expects('getHomeShelves').rejects(error);

      _fetchHomeData();

      const abortAction = abortFetchHomeData();

      const expectedAction = await sagaTester.waitFor(abortAction.type);
      expect(expectedAction).toEqual(abortAction);
    });

    it('aborts fetching for a failed search fetch', async () => {
      mockShelvesApi.expects('getHomeShelves').resolves(createHomeShelves());

      const error = createApiError({ response: { status: 500 } });
      mockSearchApi.expects('search').rejects(error);

      _fetchHomeData({ isDesktopSite: false });

      const abortAction = abortFetchHomeData();

      const expectedAction = await sagaTester.waitFor(abortAction.type);
      expect(expectedAction).toEqual(abortAction);
    });
  });
});
