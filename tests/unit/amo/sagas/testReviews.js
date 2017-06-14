import { hideLoading, showLoading } from 'react-redux-loading-bar';
import SagaTester from 'redux-saga-tester';

import * as amoApi from 'amo/api';
import { fetchReviews, setAddonReviews } from 'amo/actions/reviews';
import { SET_ADDON_REVIEWS } from 'amo/constants';
import reviewsReducer from 'amo/reducers/reviews';
import reviewsSaga from 'amo/sagas/reviews';
import { ErrorHandler } from 'core/errorHandler';
import apiReducer from 'core/reducers/api';
import {
  dispatchSignInActions, fakeAddon, fakeReview,
} from 'tests/unit/amo/helpers';
import { apiResponsePage } from 'tests/unit/helpers';

describe('amo/sagas/reviews', () => {
  describe('fetchReviews', () => {
    let apiState;
    let errorHandler;
    let mockAmoApi;
    let sagaTester;

    beforeEach(() => {
      errorHandler = new ErrorHandler({
        id: 'some-addon-handler',
        dispatch: sinon.stub(),
      });
      mockAmoApi = sinon.mock(amoApi);

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
      mockAmoApi
        .expects('getReviews')
        .once()
        .withArgs({
          addon: fakeAddon.slug,
          page: 1,
          api: apiState,
          filter: 'without_empty_body',
        })
        .returns(apiResponsePage({ results: reviews }));

      _fetchReviews();

      await sagaTester.waitFor(SET_ADDON_REVIEWS);
      mockAmoApi.verify();

      expect(sagaTester.getCalledActions()[1]).toEqual(showLoading());
      expect(sagaTester.getCalledActions()[2]).toEqual(setAddonReviews({
        addonSlug: fakeAddon.slug, reviews, reviewCount: 1,
      }));
      expect(sagaTester.getCalledActions()[3]).toEqual(hideLoading());
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');
      mockAmoApi.expects('getReviews').returns(Promise.reject(error));

      _fetchReviews();

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);
      expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
      expect(sagaTester.getCalledActions()[3]).toEqual(hideLoading());
    });
  });
});
