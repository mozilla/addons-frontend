import SagaTester from 'redux-saga-tester';

import * as reviewsApi from 'amo/api/reviews';
import {
  fetchRatingSummary,
  fetchReviews,
  fetchUserReviews,
  flagReview,
  hideReplyToReviewForm,
  sendReplyToReview,
  setAddonReviews,
  setRatingSummary,
  setReview,
  setReviewReply,
  setReviewWasFlagged,
  setUserReviews,
} from 'amo/actions/reviews';
import {
  REVIEW_FLAG_REASON_OTHER,
  REVIEW_FLAG_REASON_SPAM,
  SET_ADDON_REVIEWS,
} from 'amo/constants';
import reviewsReducer from 'amo/reducers/reviews';
import reviewsSaga from 'amo/sagas/reviews';
import { DEFAULT_API_PAGE_SIZE } from 'core/api';
import apiReducer from 'core/reducers/api';
import {
  dispatchSignInActions,
  fakeAddon,
  fakeReview,
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
      sagaTester.dispatch(
        fetchReviews({
          errorHandlerId: errorHandler.id,
          addonSlug: fakeAddon.slug,
          ...params,
        }),
      );
    }

    it('fetches reviews from the API', async () => {
      const reviews = [fakeReview];
      mockApi
        .expects('getReviews')
        .once()
        .withArgs({
          addon: fakeAddon.slug,
          apiState,
          filter: 'without_empty_body',
          page: 1,
        })
        .returns(
          Promise.resolve(
            apiResponsePage({
              page_size: DEFAULT_API_PAGE_SIZE,
              results: reviews,
            }),
          ),
        );

      _fetchReviews();

      const action = await sagaTester.waitFor(SET_ADDON_REVIEWS);
      mockApi.verify();

      expect(action).toEqual(
        setAddonReviews({
          addonSlug: fakeAddon.slug,
          pageSize: DEFAULT_API_PAGE_SIZE,
          reviewCount: 1,
          reviews,
        }),
      );
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');
      mockApi.expects('getReviews').returns(Promise.reject(error));

      _fetchReviews();

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });
  });

  describe('fetchRatingSummary', () => {
    function _fetchRatingSummary(params = {}) {
      sagaTester.dispatch(
        fetchRatingSummary({
          errorHandlerId: errorHandler.id,
          addonId: fakeAddon.id,
          ...params,
        }),
      );
    }

    const ratingSummaryResponse = (
      summary = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    ) => {
      // When requesting with show_grouped_ratings=true, a specical
      // response page is returned with 0 results and a new
      // grouped_ratings object.
      return apiResponsePage({
        results: [],
        grouped_ratings: summary,
      });
    };

    it('fetches and sets a rating summary', async () => {
      const addonId = 54123;
      const summary = {
        1: 5,
        2: 9,
        3: 22,
        4: 899,
        5: 422,
      };
      mockApi
        .expects('getReviews')
        .once()
        .withArgs({
          addon: addonId,
          apiState,
          show_grouped_ratings: true,
        })
        .returns(Promise.resolve(ratingSummaryResponse(summary)));

      _fetchRatingSummary({ addonId });

      const expectedAction = setRatingSummary({
        addonId,
        summary,
      });
      const action = await sagaTester.waitFor(expectedAction.type);
      mockApi.verify();

      expect(action).toEqual(expectedAction);
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');
      mockApi.expects('getReviews').returns(Promise.reject(error));

      _fetchRatingSummary();

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);

      expect(action).toEqual(expectedAction);
    });

    it('handles an empty grouped_ratings response', async () => {
      mockApi.expects('getReviews').returns(ratingSummaryResponse(null));

      _fetchRatingSummary();

      const exampleErrorAction = errorHandler.createErrorAction(new Error());
      const errorAction = await sagaTester.waitFor(exampleErrorAction.type);

      expect(errorAction.payload.error.message).toMatch(
        /returned an empty grouped_ratings object/,
      );
    });
  });

  describe('handleReplyToReview', () => {
    const _sendReplyToReview = (params = {}) => {
      sagaTester.dispatch(
        sendReplyToReview({
          errorHandlerId: errorHandler.id,
          originalReviewId: fakeReview.id,
          body: 'A reply to the review',
          ...params,
        }),
      );
    };

    const _setFakeReview = (params = {}) => {
      const review = { ...fakeReview, id: 2, ...params };
      sagaTester.dispatch(setReview(review));
      return review;
    };

    const createReplyToReviewResponse = ({
      reply = {},
      review = { ...fakeReview, id: 1 },
    } = {}) => {
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
        .returns(
          Promise.resolve(
            createReplyToReviewResponse({
              review,
            }),
          ),
        );

      _sendReplyToReview({ originalReviewId, body, title });
      const lastExpectedAction = hideReplyToReviewForm({
        reviewId: originalReviewId,
      });

      const action = await sagaTester.waitFor(lastExpectedAction.type);
      mockApi.verify();

      expect(action).toEqual(lastExpectedAction);
    });

    it('loads a review from the reply response', async () => {
      const review = _setFakeReview();

      const originalReviewId = review.id;
      const body = 'This is a reply to the review';
      const title = 'Title of the Reply';

      const reviewFromResponse = createReplyToReviewResponse({
        review,
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

      const action = await sagaTester.waitFor(expectedSetReviewAction.type);
      mockApi.verify();

      expect(action).toEqual(expectedSetReviewAction);
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');
      mockApi.expects('replyToReview').returns(Promise.reject(error));

      _sendReplyToReview();

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);

      expect(action).toEqual(expectedAction);
      mockApi.verify();
    });

    it('clears the error handler', async () => {
      const review = _setFakeReview();

      mockApi
        .expects('replyToReview')
        .returns(Promise.resolve(createReplyToReviewResponse()));

      _sendReplyToReview({ originalReviewId: review.id });

      const expectedAction = errorHandler.createClearingAction();

      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
      mockApi.verify();
    });
  });

  describe('handleFlagReview', () => {
    const _flagReview = (params = {}) => {
      sagaTester.dispatch(
        flagReview({
          errorHandlerId: errorHandler.id,
          reason: REVIEW_FLAG_REASON_SPAM,
          reviewId: fakeReview.id,
          ...params,
        }),
      );
    };

    it('clears the error handler', async () => {
      _flagReview();

      const expectedAction = errorHandler.createClearingAction();

      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
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
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
      mockApi.verify();
    });

    it('handles API errors', async () => {
      const error = new Error('some API error');
      mockApi.expects('flagReview').returns(Promise.reject(error));

      _flagReview();

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);

      expect(action).toEqual(expectedAction);
      mockApi.verify();
    });
  });

  describe('fetchUserReviews', () => {
    function _fetchUserReviews(params = {}) {
      sagaTester.dispatch(
        fetchUserReviews({
          errorHandlerId: errorHandler.id,
          userId: 123,
          ...params,
        }),
      );
    }

    it('fetches reviews from the API', async () => {
      const userId = 123;
      const reviews = [fakeReview];

      mockApi
        .expects('getReviews')
        .once()
        .withArgs({
          apiState,
          page: 1,
          user: userId,
        })
        .returns(
          Promise.resolve(
            apiResponsePage({
              page_size: DEFAULT_API_PAGE_SIZE,
              results: reviews,
            }),
          ),
        );

      _fetchUserReviews();

      const expectedAction = setUserReviews({
        pageSize: DEFAULT_API_PAGE_SIZE,
        reviewCount: 1,
        reviews,
        userId,
      });

      const action = await sagaTester.waitFor(expectedAction.type);
      mockApi.verify();

      expect(action).toEqual(expectedAction);
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');
      mockApi.expects('getReviews').returns(Promise.reject(error));

      _fetchUserReviews();

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);

      expect(action).toEqual(expectedAction);
    });
  });
});
