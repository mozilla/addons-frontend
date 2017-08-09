import { hideLoading, showLoading } from 'react-redux-loading-bar';
import SagaTester from 'redux-saga-tester';

import * as api from 'core/api';
import { getFeatured, loadFeatured } from 'amo/actions/featured';
import { FEATURED_ADDONS_TO_LOAD } from 'amo/constants';
import featuredReducer from 'amo/reducers/featured';
import featuredSaga from 'amo/sagas/featured';
import { ErrorHandler } from 'core/errorHandler';
import apiReducer from 'core/reducers/api';
import { ADDON_TYPE_EXTENSION, FEATURED_LOADED } from 'core/constants';
import {
  createAddonsApiResult, dispatchSignInActions, fakeAddon,
} from 'tests/unit/amo/helpers';

describe('amo/sagas/featured', () => {
  describe('fetchFeaturedAddons', () => {
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
      mockApi
        .expects('featured')
        .once()
        .withArgs({
          api: apiState,
          filters: { addonType, page_size: FEATURED_ADDONS_TO_LOAD },
        })
        .returns(Promise.resolve({ entities, result }));

      _getFeatured({ addonType });

      await sagaTester.waitFor(FEATURED_LOADED);
      mockApi.verify();

      const calledActions = sagaTester.getCalledActions();
      expect(calledActions[1]).toEqual(showLoading());
      expect(calledActions[2]).toEqual(loadFeatured({
        addonType, entities, result,
      }));
      expect(calledActions[3]).toEqual(hideLoading());
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');
      mockApi.expects('featured').returns(Promise.reject(error));

      _getFeatured();

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);
      const calledActions = sagaTester.getCalledActions();
      expect(calledActions[2]).toEqual(errorAction);
      expect(calledActions[3]).toEqual(hideLoading());
    });
  });
});
