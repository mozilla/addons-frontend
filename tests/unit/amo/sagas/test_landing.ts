import SagaTester from 'redux-saga-tester';

import * as searchApi from 'amo/api/search';
import { LANDING_PAGE_EXTENSION_COUNT, LANDING_PAGE_THEME_COUNT, ADDON_TYPE_EXTENSION, ADDON_TYPE_STATIC_THEME, RECOMMENDED, SEARCH_SORT_TRENDING, SEARCH_SORT_TOP_RATED, SEARCH_SORT_RANDOM } from 'amo/constants';
import landingReducer, { LOAD_LANDING, getLanding, loadLanding } from 'amo/reducers/landing';
import landingSaga from 'amo/sagas/landing';
import apiReducer from 'amo/reducers/api';
import { createAddonsApiResult, createStubErrorHandler, dispatchClientMetadata, fakeAddon } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('fetchLandingAddons', () => {
    let apiState;
    let errorHandler;
    let mockSearchApi;
    let sagaTester;
    beforeEach(() => {
      errorHandler = createStubErrorHandler();
      mockSearchApi = sinon.mock(searchApi);
      const {
        state,
      } = dispatchClientMetadata();
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

    it.each([{
      addonType: ADDON_TYPE_EXTENSION,
      pageSize: String(LANDING_PAGE_EXTENSION_COUNT),
    }, {
      addonType: ADDON_TYPE_STATIC_THEME,
      pageSize: String(LANDING_PAGE_THEME_COUNT),
    }])(`fetches landing page addons from the API for %o`, async (testConfig) => {
      const {
        addonType,
        pageSize,
      } = testConfig;
      const baseArgs = {
        api: apiState,
      };
      const baseFilters = {
        addonType,
        page_size: pageSize,
        promoted: addonType === ADDON_TYPE_EXTENSION ? RECOMMENDED : undefined,
      };
      const recommended = createAddonsApiResult([{ ...fakeAddon,
        slug: 'recommended-addon',
      }]);
      mockSearchApi.expects('search').withArgs({ ...baseArgs,
        filters: { ...baseFilters,
          promoted: RECOMMENDED,
          sort: SEARCH_SORT_RANDOM,
          page: '1',
        },
      }).returns(Promise.resolve(recommended));
      const highlyRated = createAddonsApiResult([{ ...fakeAddon,
        slug: 'highly-rated-addon',
      }]);
      mockSearchApi.expects('search').withArgs({ ...baseArgs,
        filters: { ...baseFilters,
          sort: SEARCH_SORT_TOP_RATED,
          page: '1',
        },
      }).returns(Promise.resolve(highlyRated));
      const trending = createAddonsApiResult([{ ...fakeAddon,
        slug: 'trending-addon',
      }]);
      mockSearchApi.expects('search').withArgs({ ...baseArgs,
        filters: { ...baseFilters,
          sort: SEARCH_SORT_TRENDING,
          page: '1',
        },
      }).returns(Promise.resolve(trending));

      _getLanding({
        addonType,
      });

      await sagaTester.waitFor(LOAD_LANDING);
      mockSearchApi.verify();
      const calledActions = sagaTester.getCalledActions();
      expect(calledActions[1]).toEqual(loadLanding({
        addonType,
        recommended,
        highlyRated,
        trending,
      }));
    });
    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');
      mockSearchApi.expects('search').exactly(3).returns(Promise.reject(error));

      _getLanding();

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);
      const calledActions = sagaTester.getCalledActions();
      expect(calledActions[1]).toEqual(errorAction);
    });
    it('fetches landing page addons with category from the API', async () => {
      const addonType = ADDON_TYPE_EXTENSION;
      const category = 'some-category';
      const baseArgs = {
        api: apiState,
      };
      const baseFilters = {
        addonType,
        category,
        page_size: String(LANDING_PAGE_EXTENSION_COUNT),
        promoted: RECOMMENDED,
      };
      const recommended = createAddonsApiResult([{ ...fakeAddon,
        slug: 'recommended-addon',
      }]);
      mockSearchApi.expects('search').withArgs({ ...baseArgs,
        filters: { ...baseFilters,
          sort: SEARCH_SORT_RANDOM,
          page: '1',
        },
      }).returns(Promise.resolve(recommended));
      const highlyRated = createAddonsApiResult([{ ...fakeAddon,
        slug: 'highly-rated-addon',
      }]);
      mockSearchApi.expects('search').withArgs({ ...baseArgs,
        filters: { ...baseFilters,
          sort: SEARCH_SORT_TOP_RATED,
          page: '1',
        },
      }).returns(Promise.resolve(highlyRated));
      const trending = createAddonsApiResult([{ ...fakeAddon,
        slug: 'trending-addon',
      }]);
      mockSearchApi.expects('search').withArgs({ ...baseArgs,
        filters: { ...baseFilters,
          sort: SEARCH_SORT_TRENDING,
          page: '1',
        },
      }).returns(Promise.resolve(trending));

      _getLanding({
        addonType,
        category,
      });

      await sagaTester.waitFor(LOAD_LANDING);
      mockSearchApi.verify();
      const calledActions = sagaTester.getCalledActions();
      expect(calledActions[1]).toEqual(loadLanding({
        addonType,
        recommended,
        highlyRated,
        trending,
      }));
    });
    it('does not add a falsy category to the filters', async () => {
      const addonType = ADDON_TYPE_EXTENSION;
      const baseArgs = {
        api: apiState,
      };
      const baseFilters = {
        addonType,
        page_size: String(LANDING_PAGE_EXTENSION_COUNT),
        promoted: RECOMMENDED,
      };
      const recommended = createAddonsApiResult([{ ...fakeAddon,
        slug: 'recommended-addon',
      }]);
      mockSearchApi.expects('search').withArgs({ ...baseArgs,
        filters: { ...baseFilters,
          sort: SEARCH_SORT_RANDOM,
          page: '1',
        },
      }).returns(Promise.resolve(recommended));
      const highlyRated = createAddonsApiResult([{ ...fakeAddon,
        slug: 'highly-rated-addon',
      }]);
      mockSearchApi.expects('search').withArgs({ ...baseArgs,
        filters: { ...baseFilters,
          sort: SEARCH_SORT_TOP_RATED,
          page: '1',
        },
      }).returns(Promise.resolve(highlyRated));
      const trending = createAddonsApiResult([{ ...fakeAddon,
        slug: 'trending-addon',
      }]);
      mockSearchApi.expects('search').withArgs({ ...baseArgs,
        filters: { ...baseFilters,
          sort: SEARCH_SORT_TRENDING,
          page: '1',
        },
      }).returns(Promise.resolve(trending));

      _getLanding({
        addonType,
        category: undefined,
      });

      await sagaTester.waitFor(LOAD_LANDING);
      mockSearchApi.verify();
      const calledActions = sagaTester.getCalledActions();
      expect(calledActions[1]).toEqual(loadLanding({
        addonType,
        recommended,
        highlyRated,
        trending,
      }));
    });
  });
});