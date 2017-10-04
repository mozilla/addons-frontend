import SagaTester from 'redux-saga-tester';

import * as reviewsApi from 'amo/api/reviews';
import {
  fetchReviews,
  hideReplyToReviewForm,
  setAddonReviews,
  sendReplyToReview,
  setReview,
  setReviewReply,
} from 'amo/actions/reviews';
import { SET_ADDON_REVIEWS } from 'amo/constants';
import reviewsReducer from 'amo/reducers/reviews';
import reviewsSaga from 'amo/sagas/reviews';
import apiReducer from 'core/reducers/api';
import {
  dispatchSignInActions, fakeAddon, fakeReview,
} from 'tests/unit/amo/helpers';
import { apiResponsePage, createStubErrorHandler } from 'tests/unit/helpers';

describe(__filename, () => {
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

  describe('fetchReviews', () => {
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

  describe('handleReplyToReview', () => {
    const _sendReplyToReview = (params = {}) => {
      sagaTester.dispatch(sendReplyToReview({
        errorHandlerId: errorHandler.id,
        originalReviewId: fakeReview.id,
        body: 'A reply to the review',
        ...params,
      }));
    };

    const _setFakeReview = (params = {}) => {
      const review = { ...fakeReview, id: 2, ...params };
      sagaTester.dispatch(setReview(review));
      return review;
    };

    const createReplyToReviewResponse = (
      { reply = {}, review = { ...fakeReview, id: 1 } } = {}
    ) => {
      return {
        ...review,
        reply: {
          ...review,
          body: 'Some developer reply to the review',
          ...reply,
        },
      };
    };

    it('sends a reply to the review with the API', async () => {
      const review = _setFakeReview();

      const originalReviewId = review.id;
      const body = 'This is a reply to the review';
      const title = 'Title of the Reply';

      mockApi
        .expects('replyToReview')
        .once()
        .withArgs({
          apiState,
          body,
          errorHandler: undefined,
          originalReviewId,
          title,
        })
        .returns(Promise.resolve(createReplyToReviewResponse()));

      _sendReplyToReview({ originalReviewId, body, title });
      const lastExpectedAction = hideReplyToReviewForm({
        reviewId: originalReviewId,
      });

      await sagaTester.waitFor(lastExpectedAction.type);
      mockApi.verify();

      const calledActions = sagaTester.getCalledActions();
      expect(calledActions[4]).toEqual(lastExpectedAction);
    });

    it('loads a review from the reply response', async () => {
      const review = _setFakeReview();

      const originalReviewId = review.id;
      const body = 'This is a reply to the review';
      const title = 'Title of the Reply';

      const reviewFromResponse = createReplyToReviewResponse({
        reply: { body, title },
      });

      mockApi
        .expects('replyToReview')
        .returns(Promise.resolve(reviewFromResponse));

      _sendReplyToReview({ originalReviewId, body, title });

      const expectedSetReviewAction = setReviewReply({
        originalReviewId,
        reply: reviewFromResponse,
      });

      await sagaTester.waitFor(expectedSetReviewAction.type);
      mockApi.verify();

      const calledActions = sagaTester.getCalledActions();
      expect(calledActions[3]).toEqual(expectedSetReviewAction);
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');
      mockApi.expects('replyToReview').returns(Promise.reject(error));

      _sendReplyToReview();

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);

      const calledActions = sagaTester.getCalledActions();
      expect(calledActions[2]).toEqual(errorAction);
    });

    it('clears the error handler', async () => {
      _sendReplyToReview();

      const expectedAction = errorHandler.createClearingAction();

      await sagaTester.waitFor(expectedAction.type);
      expect(sagaTester.getCalledActions()[1])
        .toEqual(errorHandler.createClearingAction());
    });
  });
});
