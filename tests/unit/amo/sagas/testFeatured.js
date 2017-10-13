import SagaTester from 'redux-saga-tester';

import { getFeatured, loadFeatured } from 'amo/actions/featured';
import { FEATURED_ADDONS_TO_LOAD } from 'amo/constants';
import featuredReducer from 'amo/reducers/featured';
import featuredSaga from 'amo/sagas/featured';
import * as searchApi from 'core/api/search';
import apiReducer from 'core/reducers/api';
import {
  ADDON_TYPE_EXTENSION,
  FEATURED_LOADED,
  SEARCH_SORT_RANDOM,
} from 'core/constants';
import {
  createAddonsApiResult, dispatchSignInActions, fakeAddon,
} from 'tests/unit/amo/helpers';
import { createStubErrorHandler } from 'tests/unit/helpers';

describe('amo/sagas/featured', () => {
  describe('fetchFeaturedAddons', () => {
    let apiState;
    let errorHandler;
    let mockSearchApi;
    let sagaTester;

    beforeEach(() => {
      errorHandler = createStubErrorHandler();
      mockSearchApi = sinon.mock(searchApi);

      const { state } = dispatchSignInActions();
      apiState = state.api;
      sagaTester = new SagaTester({
        initialState: state,
        reducers: { featured: featuredReducer, api: apiReducer },
      });

      sagaTester.start(featuredSaga);
    });

    function _getFeatured({ addonType = ADDON_TYPE_EXTENSION } = {}) {
      sagaTester.dispatch(getFeatured({
        addonType, errorHandlerId: errorHandler.id,
      }));
    }

    it('fetches featured addons from the API', async () => {
      const addonType = ADDON_TYPE_EXTENSION;
      const { entities, result } = createAddonsApiResult([fakeAddon]);
      mockSearchApi
        .expects('search')
        .once()
        .withArgs({
          api: apiState,
          filters: {
            addonType,
            featured: true,
            page_size: FEATURED_ADDONS_TO_LOAD,
            sort: SEARCH_SORT_RANDOM,
          },
          page: 1,
        })
        .returns(Promise.resolve({ entities, result }));

      _getFeatured({ addonType });

      await sagaTester.waitFor(FEATURED_LOADED);
      mockSearchApi.verify();

      const calledActions = sagaTester.getCalledActions();
      expect(calledActions[1]).toEqual(loadFeatured({
        addonType, entities, result,
      }));
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');
      mockSearchApi.expects('search').returns(Promise.reject(error));

      _getFeatured();

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);
      const calledActions = sagaTester.getCalledActions();
      expect(calledActions[1]).toEqual(errorAction);
    });
  });
});
