import { hideLoading, showLoading } from 'react-redux-loading-bar';
import SagaTester from 'redux-saga-tester';

import * as api from 'core/api';
import { getLanding, loadLanding } from 'amo/actions/landing';
import { LANDING_PAGE_ADDON_COUNT } from 'amo/constants';
import landingReducer from 'amo/reducers/landing';
import landingSaga from 'amo/sagas/landing';
import {
  ADDON_TYPE_EXTENSION,
  LANDING_LOADED,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_TOP_RATED,
} from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import apiReducer from 'core/reducers/api';
import {
  createAddonsApiResult, dispatchSignInActions, fakeAddon,
} from 'tests/unit/amo/helpers';

describe('amo/sagas/landing', () => {
  describe('fetchLandingAddons', () => {
    let apiState;
    let errorHandler;
    let mockApi;
    let sagaTester;

    beforeEach(() => {
      errorHandler = new ErrorHandler({
        id: 'some-error-handler',
        dispatch: sinon.stub(),
      });
      mockApi = sinon.mock(api);

      const { state } = dispatchSignInActions();
      apiState = state.api;
      sagaTester = new SagaTester({
        initialState: state,
        reducers: { landing: landingReducer, api: apiReducer },
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
      mockApi
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
      mockApi
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
      expect(calledActions[1]).toEqual(showLoading());
      expect(calledActions[2]).toEqual(loadLanding({
        addonType, featured, highlyRated, popular,
      }));
      expect(calledActions[3]).toEqual(hideLoading());
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');
      mockApi.expects('featured').returns(Promise.reject(error));

      _getLanding();

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);

      const calledActions = sagaTester.getCalledActions();
      expect(calledActions[2]).toEqual(errorAction);
      expect(calledActions[3]).toEqual(hideLoading());
    });
  });
});
