import SagaTester from 'redux-saga-tester';

import * as api from 'core/api';
import * as searchApi from 'core/api/search';
import {
  getLanding,
  loadLanding,
} from 'amo/actions/landing';
import { LANDING_PAGE_ADDON_COUNT } from 'amo/constants';
import landingReducer from 'amo/reducers/landing';
import landingSaga from 'amo/sagas/landing';
import {
  ADDON_TYPE_EXTENSION,
  LANDING_LOADED,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_TOP_RATED,
} from 'core/constants';
import apiReducer from 'core/reducers/api';
import {
  createAddonsApiResult,
  dispatchClientMetadata,
  fakeAddon,
} from 'tests/unit/amo/helpers';
import { createStubErrorHandler } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('fetchLandingAddons', () => {
    let apiState;
    let errorHandler;
    let mockApi;
    let mockSearchApi;
    let sagaTester;

    beforeEach(() => {
      errorHandler = createStubErrorHandler();
      mockApi = sinon.mock(api);
      mockSearchApi = sinon.mock(searchApi);

      const { state } = dispatchClientMetadata();
      apiState = state.api;
      sagaTester = new SagaTester({
        initialState: state,
        reducers: {
          api: apiReducer,
          landing: landingReducer,
        },
      });

      sagaTester.start(landingSaga);
    });

    function _getLanding(overrides = {}) {
      sagaTester.dispatch(getLanding({
        addonType: ADDON_TYPE_EXTENSION,
        errorHandlerId: errorHandler.id,
        ...overrides,
      }));
    }

    it('fetches landing page addons from the API', async () => {
      const addonType = ADDON_TYPE_EXTENSION;
      const baseArgs = { api: apiState };
      const baseFilters = {
        addonType, page_size: LANDING_PAGE_ADDON_COUNT,
      };

      const featured = createAddonsApiResult([{
        ...fakeAddon, slug: 'featured-addon',
      }]);
      mockApi
        .expects('featured')
        .withArgs({ ...baseArgs, filters: { ...baseFilters } })
        .returns(Promise.resolve(featured));

      const highlyRated = createAddonsApiResult([{
        ...fakeAddon, slug: 'highly-rated-addon',
      }]);
      mockSearchApi
        .expects('search')
        .withArgs({
          ...baseArgs,
          filters: {
            ...baseFilters, sort: SEARCH_SORT_TOP_RATED,
          },
          page: 1,
        })
        .returns(Promise.resolve(highlyRated));

      const popular = createAddonsApiResult([{
        ...fakeAddon, slug: 'popular-addon',
      }]);
      mockSearchApi
        .expects('search')
        .withArgs({
          ...baseArgs,
          filters: {
            ...baseFilters, sort: SEARCH_SORT_POPULAR,
          },
          page: 1,
        })
        .returns(Promise.resolve(popular));

      _getLanding({ addonType });

      await sagaTester.waitFor(LANDING_LOADED);
      mockApi.verify();

      const calledActions = sagaTester.getCalledActions();
      expect(calledActions[1]).toEqual(loadLanding({
        addonType, featured, highlyRated, popular,
      }));
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');
      mockApi.expects('featured').returns(Promise.reject(error));

      _getLanding();

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);

      const calledActions = sagaTester.getCalledActions();
      expect(calledActions[1]).toEqual(errorAction);
    });

    it('fetches landing page addons with category from the API', async () => {
      const addonType = ADDON_TYPE_EXTENSION;
      const category = 'some-category';
      const baseArgs = { api: apiState };
      const baseFilters = {
        addonType,
        category,
        page_size: LANDING_PAGE_ADDON_COUNT,
      };

      const featured = createAddonsApiResult([
        { ...fakeAddon, slug: 'featured-addon' },
      ]);
      mockApi
        .expects('featured')
        .withArgs({
          ...baseArgs,
          filters: baseFilters,
        })
        .returns(Promise.resolve(featured));

      const highlyRated = createAddonsApiResult([
        { ...fakeAddon, slug: 'highly-rated-addon' },
      ]);
      mockSearchApi
        .expects('search')
        .withArgs({
          ...baseArgs,
          filters: {
            ...baseFilters,
            sort: SEARCH_SORT_TOP_RATED,
          },
          page: 1,
        })
        .returns(Promise.resolve(highlyRated));

      const popular = createAddonsApiResult([
        { ...fakeAddon, slug: 'popular-addon' },
      ]);
      mockSearchApi
        .expects('search')
        .withArgs({
          ...baseArgs,
          filters: {
            ...baseFilters,
            sort: SEARCH_SORT_POPULAR,
          },
          page: 1,
        })
        .returns(Promise.resolve(popular));

      _getLanding({ addonType, category });

      await sagaTester.waitFor(LANDING_LOADED);
      mockApi.verify();

      const calledActions = sagaTester.getCalledActions();
      expect(calledActions[1]).toEqual(loadLanding({
        addonType, featured, highlyRated, popular,
      }));
    });

    it('does not add a falsy category to the filters', async () => {
      const addonType = ADDON_TYPE_EXTENSION;
      const baseArgs = { api: apiState };
      const baseFilters = {
        addonType,
        page_size: LANDING_PAGE_ADDON_COUNT,
      };

      const featured = createAddonsApiResult([
        { ...fakeAddon, slug: 'featured-addon' },
      ]);
      mockApi
        .expects('featured')
        .withArgs({
          ...baseArgs,
          filters: baseFilters,
        })
        .returns(Promise.resolve(featured));

      const highlyRated = createAddonsApiResult([
        { ...fakeAddon, slug: 'highly-rated-addon' },
      ]);
      mockSearchApi
        .expects('search')
        .withArgs({
          ...baseArgs,
          filters: {
            ...baseFilters,
            sort: SEARCH_SORT_TOP_RATED,
          },
          page: 1,
        })
        .returns(Promise.resolve(highlyRated));

      const popular = createAddonsApiResult([
        { ...fakeAddon, slug: 'popular-addon' },
      ]);
      mockSearchApi
        .expects('search')
        .withArgs({
          ...baseArgs,
          filters: {
            ...baseFilters,
            sort: SEARCH_SORT_POPULAR,
          },
          page: 1,
        })
        .returns(Promise.resolve(popular));

      _getLanding({ addonType, category: undefined });

      await sagaTester.waitFor(LANDING_LOADED);
      mockApi.verify();

      const calledActions = sagaTester.getCalledActions();
      expect(calledActions[1]).toEqual(loadLanding({
        addonType, featured, highlyRated, popular,
      }));
    });
  });
});
