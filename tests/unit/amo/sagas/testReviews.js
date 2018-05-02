import SagaTester from 'redux-saga-tester';

import * as reviewsApi from 'amo/api/reviews';
import {
  fetchReviews,
  flagReview,
  hideReplyToReviewForm,
  setAddonReviews,
  sendReplyToReview,
  setReview,
  setReviewReply,
  setReviewWasFlagged,
} from 'amo/actions/reviews';
import {
  REVIEW_FLAG_REASON_OTHER,
  REVIEW_FLAG_REASON_SPAM,
  SET_ADDON_REVIEWS,
} from 'amo/constants';
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
        ...params,
      }));
    }

    it('fetches reviews from the API for an add-on', async () => {
      const reviews = [fakeReview];
      mockApi
        .expects('getReviews')
        .once()
        .withArgs({
          addon: fakeAddon.slug,
          page: 1,
          api: apiState,
          filter: 'without_empty_body',
          user: undefined,
        })
        .returns(Promise.resolve(apiResponsePage({ results: reviews })));

      _fetchReviews({ addonSlug: fakeAddon.slug });

      const calledAction = await sagaTester.waitFor(SET_ADDON_REVIEWS);
      mockApi.verify();

      expect(calledAction).toEqual(setAddonReviews({
        addonSlug: fakeAddon.slug, reviews, reviewCount: 1, user: undefined,
      }));
    });

    it('fetches reviews from the API for a user', async () => {
      const reviews = [fakeReview];
      mockApi
        .expects('getReviews')
        .once()
        .withArgs({
          addon: undefined,
          page: 1,
          api: apiState,
          filter: 'without_empty_body',
          user: 500,
        })
        .returns(Promise.resolve(apiResponsePage({ results: reviews })));

      _fetchReviews({ userId: 500 });

      const calledAction = await sagaTester.waitFor(SET_ADDON_REVIEWS);
      mockApi.verify();

      expect(calledAction).toEqual(setAddonReviews({
        addonSlug: undefined, reviews, reviewCount: 1, userId: 500,
      }));
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');
      mockApi.expects('getReviews').returns(Promise.reject(error));

      _fetchReviews({ addonSlug: fakeAddon.slug });

      const errorAction = errorHandler.createErrorAction(error);
      const calledErrorAction = await sagaTester.waitFor(errorAction.type);
      expect(calledErrorAction).toEqual(errorAction);
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
          id: 3421,
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
          originalReviewId,
          title,
        })
        .returns(Promise.resolve(createReplyToReviewResponse({
          review,
        })));

      _sendReplyToReview({ originalReviewId, body, title });
      const lastExpectedAction = hideReplyToReviewForm({
        reviewId: originalReviewId,
      });

      await sagaTester.waitFor(lastExpectedAction.type);
      mockApi.verify();

      const calledActions = sagaTester.getCalledActions();
      expect(calledActions.slice(-1).pop()).toEqual(lastExpectedAction);
    });

    it('loads a review from the reply response', async () => {
      const review = _setFakeReview();

      const originalReviewId = review.id;
      const body = 'This is a reply to the review';
      const title = 'Title of the Reply';

      const reviewFromResponse = createReplyToReviewResponse({
        review, reply: { body, title },
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
      expect(calledActions.slice(-1).pop()).toEqual(errorAction);
      mockApi.verify();
    });

    it('clears the error handler', async () => {
      const review = _setFakeReview();

      mockApi
        .expects('replyToReview')
        .returns(Promise.resolve(createReplyToReviewResponse()));

      _sendReplyToReview({ originalReviewId: review.id });

      const expectedAction = errorHandler.createClearingAction();

      await sagaTester.waitFor(expectedAction.type);
      expect(sagaTester.getCalledActions()[2])
        .toEqual(errorHandler.createClearingAction());
      mockApi.verify();
    });
  });

  describe('handleFlagReview', () => {
    const _flagReview = (params = {}) => {
      sagaTester.dispatch(flagReview({
        errorHandlerId: errorHandler.id,
        reason: REVIEW_FLAG_REASON_SPAM,
        reviewId: fakeReview.id,
        ...params,
      }));
    };

    it('clears the error handler', async () => {
      _flagReview();

      const expectedAction = errorHandler.createClearingAction();

      await sagaTester.waitFor(expectedAction.type);
      expect(sagaTester.getCalledActions()[1]).toEqual(expectedAction);
    });

    it('posts a review flag to the API', async () => {
      const reviewId = fakeReview.id;
      const note = 'I do not like the color of this review';
      const reason = REVIEW_FLAG_REASON_OTHER;

      mockApi
        .expects('flagReview')
        .once()
        .withArgs({
          apiState,
          note,
          reason,
          reviewId,
        })
        .returns(Promise.resolve());

      _flagReview({ note, reason, reviewId });

      const expectedAction = setReviewWasFlagged({ reason, reviewId });
      await sagaTester.waitFor(expectedAction.type);
      mockApi.verify();
    });

    it('handles API errors', async () => {
      const error = new Error('some API error');
      mockApi
        .expects('flagReview')
        .returns(Promise.reject(error));

      _flagReview();

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);

      const calledActions = sagaTester.getCalledActions();
      expect(calledActions.slice(-1).pop()).toEqual(errorAction);
      mockApi.verify();
    });
  });
});
