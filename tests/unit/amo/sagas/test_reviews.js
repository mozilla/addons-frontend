import SagaTester from 'redux-saga-tester';

import * as reviewsApi from 'amo/api/reviews';
import {
  ABORTED,
  SAVED_RATING,
  SAVED_REVIEW,
  SET_ADDON_REVIEWS,
  STARTED_SAVE_RATING,
  STARTED_SAVE_REVIEW,
  unloadAddonReviews,
  createAddonReview,
  deleteAddonReview,
  fetchGroupedRatings,
  fetchReviews,
  fetchUserReviews,
  flagReview,
  hideFlashedReviewMessage,
  hideReplyToReviewForm,
  sendReplyToReview,
  setAddonReviews,
  setGroupedRatings,
  flashReviewMessage,
  setReview,
  setReviewReply,
  setReviewWasFlagged,
  setUserReviews,
  updateAddonReview,
} from 'amo/actions/reviews';
import {
  REVIEW_FLAG_REASON_OTHER,
  REVIEW_FLAG_REASON_SPAM,
} from 'amo/constants';
import reviewsReducer from 'amo/reducers/reviews';
import reviewsSaga, { FLASH_SAVED_MESSAGE_DURATION } from 'amo/sagas/reviews';
import { DEFAULT_API_PAGE_SIZE } from 'core/api';
import apiReducer from 'core/reducers/api';
import {
  dispatchSignInActions,
  fakeAddon,
  fakeReview,
} from 'tests/unit/amo/helpers';
import {
  apiResponsePage,
  createStubErrorHandler,
  matchingSagaAction,
} from 'tests/unit/helpers';
import { createInternalAddon, unloadAddon } from 'core/reducers/addons';

describe(__filename, () => {
  let apiState;
  let fakeSagaDelay;
  let errorHandler;
  let mockApi;
  let sagaTester;

  beforeEach(() => {
    errorHandler = createStubErrorHandler();
    fakeSagaDelay = sinon.stub().resolves();
    mockApi = sinon.mock(reviewsApi);

    const { state } = dispatchSignInActions();
    apiState = state.api;
    sagaTester = new SagaTester({
      initialState: state,
      reducers: { reviews: reviewsReducer, api: apiReducer },
    });

    sagaTester.start(() => reviewsSaga({ _delay: fakeSagaDelay }));
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

  describe('fetchGroupedRatings', () => {
    function _fetchGroupedRatings(params = {}) {
      sagaTester.dispatch(
        fetchGroupedRatings({
          errorHandlerId: errorHandler.id,
          addonId: fakeAddon.id,
          ...params,
        }),
      );
    }

    const groupedRatingsResponse = (
      grouping = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    ) => {
      // When requesting with show_grouped_ratings=true, a special
      // response page is returned with 0 results and a new
      // grouped_ratings object.
      return apiResponsePage({
        results: [],
        grouped_ratings: grouping,
      });
    };

    it('fetches and sets grouped ratings', async () => {
      const addonId = 54123;
      const grouping = {
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
        .returns(Promise.resolve(groupedRatingsResponse(grouping)));

      _fetchGroupedRatings({ addonId });

      const expectedAction = setGroupedRatings({
        addonId,
        grouping,
      });
      const action = await sagaTester.waitFor(expectedAction.type);
      mockApi.verify();

      expect(action).toEqual(expectedAction);
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');
      mockApi.expects('getReviews').returns(Promise.reject(error));

      _fetchGroupedRatings();

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);

      expect(action).toEqual(expectedAction);
    });

    it('handles an empty grouped_ratings response', async () => {
      mockApi.expects('getReviews').returns(groupedRatingsResponse(null));

      _fetchGroupedRatings();

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

  describe('manageAddonReview', () => {
    function _createAddonReview(params = {}) {
      sagaTester.dispatch(
        createAddonReview({
          addonId: 54321,
          body: 'pretty sweet add-on',
          errorHandlerId: errorHandler.id,
          rating: 5,
          versionId: 1234,
          ...params,
        }),
      );
    }

    function _updateAddonReview(params = {}) {
      sagaTester.dispatch(
        updateAddonReview({
          body: 'I do not like this add-on',
          errorHandlerId: errorHandler.id,
          rating: 1,
          reviewId: 88664,
          ...params,
        }),
      );
    }

    function createExternalReview({
      id = 76654,
      body,
      rating = 4,
      addonId = fakeReview.addon.id,
      versionId = fakeReview.version.id,
    } = {}) {
      return {
        ...fakeReview,
        id,
        addon: {
          ...fakeAddon,
          id: addonId,
        },
        body,
        rating,
        version: {
          ...fakeReview.version,
          id: versionId,
        },
      };
    }

    function matchMessage(expectedAction) {
      return (maybeAction) => {
        return (
          maybeAction.type === expectedAction.type &&
          maybeAction.payload.message === expectedAction.payload.message
        );
      };
    }

    it('clears the error handler', async () => {
      _createAddonReview();

      const expectedAction = errorHandler.createClearingAction();

      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });

    it('creates an add-on review', async () => {
      const addonId = 98767;
      const body = 'This add-on works pretty well for me';
      const rating = 4;
      const versionId = 7653;

      const externalReview = createExternalReview({
        addonId,
        body,
        rating,
        versionId,
      });

      mockApi
        .expects('submitReview')
        .once()
        .withArgs({
          addonId,
          apiState,
          body,
          rating,
          versionId,
        })
        .resolves(externalReview);

      _createAddonReview({ addonId, body, rating, versionId });

      const expectedAction = setReview(externalReview);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);

      mockApi.verify();
    });

    it('updates an add-on review', async () => {
      const reviewId = 87654;
      const body = 'This add-on is OK';
      const rating = 3;

      const externalReview = createExternalReview({
        id: reviewId,
        body,
        rating,
      });

      mockApi
        .expects('submitReview')
        .once()
        .withArgs({
          apiState,
          body,
          rating,
          reviewId,
        })
        .resolves(externalReview);

      _updateAddonReview({ body, rating, reviewId });

      const expectedAction = setReview(externalReview);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);

      mockApi.verify();
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');
      mockApi.expects('submitReview').rejects(error);

      _createAddonReview();

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);

      expect(action).toEqual(expectedAction);
    });

    it('flashes the start of saving a rating', async () => {
      const rating = 4;
      const externalReview = createExternalReview({ rating });

      mockApi.expects('submitReview').resolves(externalReview);

      _updateAddonReview({ body: undefined, rating });

      const expectedAction = flashReviewMessage(STARTED_SAVE_RATING);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });

    it('flashes the start of saving a review', async () => {
      const body = 'I love this add-on';
      const externalReview = createExternalReview({ body });

      mockApi.expects('submitReview').resolves(externalReview);

      _updateAddonReview({ body, rating: undefined });

      const expectedAction = flashReviewMessage(STARTED_SAVE_REVIEW);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });

    it('flashes when a rating gets saved', async () => {
      const rating = 4;
      const externalReview = createExternalReview({ rating });

      mockApi.expects('submitReview').resolves(externalReview);

      _updateAddonReview({ body: undefined, rating });

      const expectedAction = flashReviewMessage(SAVED_RATING);
      await matchingSagaAction(sagaTester, matchMessage(expectedAction));
    });

    it('flashes when a review gets saved', async () => {
      const body = 'uBlock Origin is easy on CPU';
      const externalReview = createExternalReview({ body });

      mockApi.expects('submitReview').resolves(externalReview);

      _updateAddonReview({ body, rating: undefined });

      const expectedAction = flashReviewMessage(SAVED_REVIEW);
      await matchingSagaAction(sagaTester, matchMessage(expectedAction));
    });

    it('resets the flash message after some time', async () => {
      const body = 'This add-on is pretty good';
      const externalReview = createExternalReview({ body });

      mockApi.expects('submitReview').resolves(externalReview);

      _updateAddonReview({ body });

      const expectedAction = hideFlashedReviewMessage();
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);

      sinon.assert.calledWith(fakeSagaDelay, FLASH_SAVED_MESSAGE_DURATION);
    });

    it('flashes an abort message on error', async () => {
      const error = new Error('some API error maybe');
      mockApi.expects('submitReview').rejects(error);

      _createAddonReview();

      const expectedAction = flashReviewMessage(ABORTED);
      await matchingSagaAction(sagaTester, matchMessage(expectedAction));
    });
  });

  describe('deleteAddonReview', () => {
    function _deleteAddonReview(params = {}) {
      sagaTester.dispatch(
        deleteAddonReview({
          addon: createInternalAddon(fakeAddon),
          errorHandlerId: errorHandler.id,
          reviewId: 1,
          ...params,
        }),
      );
    }

    function matchReviewId(expectedAction) {
      return (maybeAction) => {
        return (
          maybeAction.type === expectedAction.type &&
          maybeAction.payload.reviewId === expectedAction.payload.reviewId
        );
      };
    }

    it('clears the error handler', async () => {
      _deleteAddonReview();

      const expectedAction = errorHandler.createClearingAction();

      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });

    it('deletes an add-on review', async () => {
      const reviewId = 12345;

      mockApi
        .expects('deleteReview')
        .once()
        .withArgs({
          apiState,
          reviewId,
        })
        .returns(Promise.resolve());

      _deleteAddonReview({ reviewId });

      const expectedAction = unloadAddonReviews({ reviewId });
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);

      mockApi.verify();
    });

    it('unloads the add-on for the review', async () => {
      const addon = createInternalAddon(fakeAddon);
      const reviewId = 12345;

      mockApi
        .expects('deleteReview')
        .once()
        .returns(Promise.resolve());

      _deleteAddonReview({ addon, reviewId });

      const expectedAction = unloadAddon({ addon, reviewId });
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);

      mockApi.verify();
    });

    it('clears reviews for an add-on review reply', async () => {
      const reviewId = 12345;
      const isReplyToReviewId = 98765;

      mockApi
        .expects('deleteReview')
        .once()
        .returns(Promise.resolve());

      _deleteAddonReview({ isReplyToReviewId, reviewId });

      const expectedAction = unloadAddonReviews({
        reviewId,
      });
      const action = await matchingSagaAction(
        sagaTester,
        matchReviewId(expectedAction),
      );
      expect(action).toEqual(expectedAction);
    });

    it('clears reviews for the review related to an add-on review reply', async () => {
      const reviewId = 12345;
      const isReplyToReviewId = 98765;

      mockApi
        .expects('deleteReview')
        .once()
        .returns(Promise.resolve());

      _deleteAddonReview({ isReplyToReviewId, reviewId });

      const expectedAction = unloadAddonReviews({
        reviewId: isReplyToReviewId,
      });
      const action = await matchingSagaAction(
        sagaTester,
        matchReviewId(expectedAction),
      );
      expect(action).toEqual(expectedAction);
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');
      mockApi.expects('deleteReview').rejects(error);

      _deleteAddonReview();

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);

      expect(action).toEqual(expectedAction);
    });
  });
});
