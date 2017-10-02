import SagaTester from 'redux-saga-tester';

import * as reviewsApi from 'amo/api/reviews';
import { fetchReviews, setAddonReviews } from 'amo/actions/reviews';
import { SET_ADDON_REVIEWS } from 'amo/constants';
import reviewsReducer from 'amo/reducers/reviews';
import reviewsSaga from 'amo/sagas/reviews';
import apiReducer from 'core/reducers/api';
import {
  dispatchSignInActions, fakeAddon, fakeReview,
} from 'tests/unit/amo/helpers';
import { apiResponsePage, createStubErrorHandler } from 'tests/unit/helpers';

describe('amo/sagas/reviews', () => {
  describe('fetchReviews', () => {
    let apiState;
    let errorHandler;
    let mockApi;
    let sagaTester;

    beforeEach(() => {
      errorHandler = createStubErrorHandler();
      mockApi = sinon.mock(reviewsApi);

      const { state } = dispatchSignInActions();
      apiState = state.api;
      sagaTester = new SagaTester({
        initialState: state,
        reducers: { reviews: reviewsReducer, api: apiReducer },
      });

      sagaTester.start(reviewsSaga);
    });

    function _fetchReviews(params = {}) {
      sagaTester.dispatch(fetchReviews({
        errorHandlerId: errorHandler.id,
        addonSlug: fakeAddon.slug,
        ...params,
      }));
    }

    it('fetches reviews from the API', async () => {
      const reviews = [fakeReview];
      mockApi
        .expects('getReviews')
        .once()
        .withArgs({
          addon: fakeAddon.slug,
          page: 1,
          api: apiState,
          filter: 'without_empty_body',
        })
        .returns(Promise.resolve(apiResponsePage({ results: reviews })));

      _fetchReviews();

      await sagaTester.waitFor(SET_ADDON_REVIEWS);
      mockApi.verify();

      const calledActions = sagaTester.getCalledActions();
      expect(calledActions[1]).toEqual(setAddonReviews({
        addonSlug: fakeAddon.slug, reviews, reviewCount: 1,
      }));
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');
      mockApi.expects('getReviews').returns(Promise.reject(error));

      _fetchReviews();

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);
      const calledActions = sagaTester.getCalledActions();
      expect(calledActions[1]).toEqual(errorAction);
    });
  });
});
