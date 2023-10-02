import invariant from 'invariant';
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
  fetchLatestUserReview,
  fetchReview,
  fetchReviewPermissions,
  fetchReviews,
  fetchUserReviews,
  flagReview,
  hideEditReviewForm,
  hideFlashedReviewMessage,
  hideReplyToReviewForm,
  sendReplyToReview,
  setAddonReviews,
  flashReviewMessage,
  setReview,
  setReviewPermissions,
  setReviewReply,
  setLatestReview,
  setReviewWasFlagged,
  setUserReviews,
  updateAddonReview,
  updateRatingCounts,
} from 'amo/actions/reviews';
import {
  REVIEW_FLAG_REASON_OTHER,
  REVIEW_FLAG_REASON_SPAM,
} from 'amo/constants';
import reviewsReducer from 'amo/reducers/reviews';
import reviewsSaga, { FLASH_SAVED_MESSAGE_DURATION } from 'amo/sagas/reviews';
import { DEFAULT_API_PAGE_SIZE } from 'amo/api';
import apiReducer from 'amo/reducers/api';
import {
  createInternalReviewWithLang,
  apiResponsePage,
  createExternalReview,
  createStubErrorHandler,
  dispatchSignInActions,
  fakeAddon,
  fakeReview,
  matchingSagaAction,
} from 'tests/unit/helpers';

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
          score: null,
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
          page: '1',
          score: undefined,
          // note: no page_size parameter - we want/expect the default
        })
        .resolves(
          apiResponsePage({
            page_size: DEFAULT_API_PAGE_SIZE,
            results: reviews,
          }),
        );

      _fetchReviews();

      const action = await sagaTester.waitFor(SET_ADDON_REVIEWS);
      mockApi.verify();

      expect(action).toEqual(
        setAddonReviews({
          addonSlug: fakeAddon.slug,
          page: '1',
          pageSize: DEFAULT_API_PAGE_SIZE,
          reviewCount: 1,
          reviews,
          score: null,
        }),
      );
    });

    it('can filter by rating score', async () => {
      const score = 5;
      mockApi
        .expects('getReviews')
        .withArgs(sinon.match({ score }))
        .resolves(apiResponsePage({ results: [fakeReview] }));

      _fetchReviews({ score });

      await sagaTester.waitFor(SET_ADDON_REVIEWS);
      mockApi.verify();
    });

    it('clears the error handler', async () => {
      mockApi.expects('getReviews').resolves(apiResponsePage());

      _fetchReviews();

      const expectedAction = errorHandler.createClearingAction();

      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
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

  describe('fetchReviewPermissions', () => {
    function _fetchReviewPermissions(params = {}) {
      sagaTester.dispatch(
        fetchReviewPermissions({
          errorHandlerId: errorHandler.id,
          addonId: 5432,
          userId: 98432,
          ...params,
        }),
      );
    }

    it('fetches review permissions from the API', async () => {
      const addonId = 12344;
      const userId = 912345;

      mockApi
        .expects('getReviews')
        .once()
        .withArgs({
          addon: addonId,
          apiState,
          show_permissions_for: userId,
        })
        .resolves(apiResponsePage({ can_reply: true }));

      _fetchReviewPermissions({ addonId, userId });

      const expectedAction = setReviewPermissions({
        addonId,
        canReplyToReviews: true,
        userId,
      });

      const action = await sagaTester.waitFor(expectedAction.type);
      mockApi.verify();

      expect(action).toEqual(expectedAction);
    });

    it('clears the error handler', async () => {
      mockApi
        .expects('getReviews')
        .resolves(apiResponsePage({ can_reply: true }));

      _fetchReviewPermissions();

      const expectedAction = errorHandler.createClearingAction();

      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');
      mockApi.expects('getReviews').rejects(error);

      _fetchReviewPermissions();

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
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
          page: '1',
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
          score: 5,
          versionId: 1234,
          ...params,
        }),
      );
    }

    function _updateAddonReview({
      oldReview = createExternalReview({ id: 88664 }),
      ...params
    } = {}) {
      invariant(
        !params.reviewId,
        'Cannot set reviewId directly; set oldReview instead',
      );
      sagaTester.dispatch(setReview(oldReview));
      sagaTester.dispatch(
        updateAddonReview({
          body: 'I do not like this add-on',
          errorHandlerId: errorHandler.id,
          score: 1,
          reviewId: oldReview.id,
          ...params,
        }),
      );
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
      const score = 4;
      const versionId = 7653;

      const externalReview = createExternalReview({
        addonId,
        body,
        score,
        versionId,
      });

      mockApi
        .expects('submitReview')
        .once()
        .withArgs({
          addonId,
          apiState,
          body,
          score,
          versionId,
        })
        .resolves(externalReview);

      _createAddonReview({ addonId, body, score, versionId });

      const expectedAction = setReview(externalReview);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);

      mockApi.verify();
    });

    it('dispatches updateRatingCounts after creating a review', async () => {
      const addonId = 98767;
      const submittedReview = createExternalReview({ addonId, id: 987 });
      mockApi.expects('submitReview').resolves(submittedReview);

      _createAddonReview({ addonId });

      const expectedAction = updateRatingCounts({
        addonId,
        oldReview: undefined,
        newReview: createInternalReviewWithLang(submittedReview),
      });
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);

      // It's important that the update only runs once because otherwise
      // it will double all the review counts.
      expect(
        sagaTester.getCalledActions().filter((a) => a.type === action.type),
      ).toHaveLength(1);
    });

    it('updates an add-on review', async () => {
      const oldReview = createExternalReview({
        body: 'This add-on is amazing',
        id: 87654,
      });
      const newBody = 'This add-on is OK';
      const newScore = 3;

      const updatedReview = createExternalReview({
        id: oldReview.id,
        body: newBody,
        score: newScore,
      });

      mockApi
        .expects('submitReview')
        .once()
        .withArgs({
          apiState,
          body: newBody,
          score: newScore,
          reviewId: oldReview.id,
        })
        .resolves(updatedReview);

      _updateAddonReview({ body: newBody, oldReview, score: newScore });

      const expectedAction = setReview(updatedReview);
      const action = await matchingSagaAction(sagaTester, (a) => {
        // Wait for the updated review.
        return a.type === expectedAction.type && a.payload.body === newBody;
      });
      expect(action).toEqual(expectedAction);

      mockApi.verify();
    });

    it('dispatches updateRatingCounts after updating', async () => {
      const addonId = 96334;
      const oldReviewParams = {
        addonId,
        body: 'This add-on is just OK',
        id: 87654,
      };
      const oldReview = createExternalReview({ ...oldReviewParams });

      const newBody = 'This add-on is fantastic';
      const newReview = createExternalReview({
        ...oldReviewParams,
        body: newBody,
      });

      mockApi.expects('submitReview').resolves(newReview);

      _updateAddonReview({ body: newBody, oldReview });

      const expectedAction = updateRatingCounts({
        addonId,
        oldReview: createInternalReviewWithLang(oldReview),
        newReview: createInternalReviewWithLang(newReview),
      });
      const action = await sagaTester.waitFor(expectedAction.type);

      expect(action).toEqual(expectedAction);
    });

    it('hides the review form after successful update', async () => {
      const oldReview = createExternalReview({ id: 321 });
      const newBody = 'This is an essential add-on';
      mockApi
        .expects('submitReview')
        .resolves(createExternalReview({ body: newBody, id: oldReview.id }));

      _updateAddonReview({ oldReview, body: newBody });

      const expectedAction = hideEditReviewForm({ reviewId: oldReview.id });
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });

    it('hides the review form after successful creation', async () => {
      const reviewId = 55321;
      mockApi
        .expects('submitReview')
        .resolves(createExternalReview({ id: reviewId }));

      _createAddonReview({ body: 'This is an essential add-on' });

      const expectedAction = hideEditReviewForm({ reviewId });
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });

    it('does not hide the review form when only saving a rating', async () => {
      const oldReview = createExternalReview({ id: 321 });
      mockApi
        .expects('submitReview')
        .resolves(createExternalReview({ body: undefined, id: oldReview.id }));

      _updateAddonReview({ oldReview, body: undefined, score: 4 });

      const expectedAction = hideFlashedReviewMessage();
      await sagaTester.waitFor(expectedAction.type);

      const exampleHideAction = hideEditReviewForm({ reviewId: oldReview.id });

      expect(sagaTester.numCalled(exampleHideAction.type)).toEqual(0);
    });

    it('does not hide the review form after a failed update', async () => {
      const error = new Error('some API error maybe');
      mockApi.expects('submitReview').rejects(error);

      const oldReview = createExternalReview({ id: 321 });
      _updateAddonReview({ oldReview, body: 'This is an essential add-on' });

      const expectedAction = flashReviewMessage(ABORTED);
      await sagaTester.waitFor(expectedAction.type);

      const exampleHideAction = hideEditReviewForm({ reviewId: oldReview.id });

      expect(sagaTester.numCalled(exampleHideAction.type)).toEqual(0);
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
      const score = 4;
      const externalReview = createExternalReview({ score });

      mockApi.expects('submitReview').resolves(externalReview);

      _updateAddonReview({ body: undefined, score });

      const expectedAction = flashReviewMessage(STARTED_SAVE_RATING);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });

    it('flashes the start of saving a review', async () => {
      const body = 'I love this add-on';
      const externalReview = createExternalReview({ body });

      mockApi.expects('submitReview').resolves(externalReview);

      _updateAddonReview({ body, score: undefined });

      const expectedAction = flashReviewMessage(STARTED_SAVE_REVIEW);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });

    it('flashes when a rating gets saved', async () => {
      const score = 4;
      const externalReview = createExternalReview({ score });

      mockApi.expects('submitReview').resolves(externalReview);

      _updateAddonReview({ body: undefined, score });

      const expectedAction = flashReviewMessage(SAVED_RATING);
      await matchingSagaAction(sagaTester, matchMessage(expectedAction));
    });

    it('flashes when a review gets saved', async () => {
      const body = 'uBlock Origin is easy on CPU';
      const externalReview = createExternalReview({ body });

      mockApi.expects('submitReview').resolves(externalReview);

      _updateAddonReview({ body, score: undefined });

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

    it('dispatches setLatestReview after saving a review', async () => {
      const addonId = 98767;
      const body = 'This add-on works pretty well for me';
      const score = 4;
      const userId = 12345;

      const externalReview = createExternalReview({
        addonId,
        body,
        score,
        userId,
      });

      mockApi.expects('submitReview').resolves(externalReview);

      _createAddonReview({ addonId, body, score });

      const expectedAction = setLatestReview({
        addonId,
        review: externalReview,
        userId,
      });
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });

    it('does not dispatch setLatestReview after saving a reply', async () => {
      const addonId = 98767;
      const body = 'This add-on works pretty well for me';
      const rating = 4;
      const userId = 12345;

      const externalReview = createExternalReview({
        addonId,
        body,
        isDeveloperReply: true,
        rating,
        userId,
      });

      mockApi.expects('submitReview').resolves(externalReview);

      _updateAddonReview();

      const expectedAction = hideFlashedReviewMessage();
      await sagaTester.waitFor(expectedAction.type);

      const unexpectedAction = setLatestReview({
        addonId,
        review: externalReview,
        userId,
      });

      expect(sagaTester.numCalled(unexpectedAction.type)).toEqual(0);
    });
  });

  describe('deleteAddonReview', () => {
    function _deleteAddonReview(params = {}) {
      sagaTester.dispatch(
        deleteAddonReview({
          addonId: fakeAddon.id,
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
      const addonId = 123;
      const reviewId = 12345;

      mockApi
        .expects('deleteReview')
        .once()
        .withArgs({
          apiState,
          reviewId,
        })
        .returns(Promise.resolve());

      _deleteAddonReview({ addonId, reviewId });

      const expectedAction = unloadAddonReviews({ addonId, reviewId });
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);

      mockApi.verify();
    });

    it('clears reviews for an add-on review reply', async () => {
      const addonId = 123;
      const reviewId = 12345;
      const isReplyToReviewId = 98765;

      mockApi.expects('deleteReview').once().returns(Promise.resolve());

      _deleteAddonReview({ addonId, isReplyToReviewId, reviewId });

      const expectedAction = unloadAddonReviews({
        addonId,
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

      mockApi.expects('deleteReview').once().returns(Promise.resolve());

      _deleteAddonReview({ isReplyToReviewId, reviewId });

      const expectedAction = unloadAddonReviews({
        addonId: fakeAddon.id,
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

  describe('fetchReview', () => {
    function _fetchReview(params = {}) {
      sagaTester.dispatch(
        fetchReview({
          errorHandlerId: errorHandler.id,
          reviewId: 1,
          ...params,
        }),
      );
    }

    it('clears the error handler', async () => {
      _fetchReview();

      const expectedAction = errorHandler.createClearingAction();

      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });

    it('fetches an add-on review', async () => {
      const reviewId = 12345;
      const review = fakeReview;

      mockApi
        .expects('getReview')
        .once()
        .withArgs({
          apiState,
          reviewId,
        })
        .resolves(review);

      _fetchReview({ reviewId });

      const expectedAction = setReview(review);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);

      mockApi.verify();
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');
      mockApi.expects('getReview').rejects(error);

      _fetchReview();

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);

      expect(action).toEqual(expectedAction);
    });
  });

  describe('fetchLatestUserReview', () => {
    function _fetchLatestUserReview(params = {}) {
      sagaTester.dispatch(
        fetchLatestUserReview({
          addonId: fakeAddon.id,
          errorHandlerId: 'any-error-handler',
          userId: 9876,
          ...params,
        }),
      );
    }

    it('clears the error handler', async () => {
      _fetchLatestUserReview({ errorHandlerId: errorHandler.id });

      const expectedAction = errorHandler.createClearingAction();

      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });

    it('fetches and sets the latest user review', async () => {
      const review = { ...fakeReview, id: 34421 };
      const addonId = review.addon.id;
      const userId = review.user.id;
      mockApi
        .expects('getLatestUserReview')
        .withArgs({
          apiState,
          user: userId,
          addon: addonId,
        })
        .resolves(review);

      _fetchLatestUserReview({
        addonId,
        userId,
      });

      const expectedAction = setReview(review);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);

      const expectedSetLatestAction = setLatestReview({
        userId,
        addonId,
        review,
      });
      const setLatestAction = await matchingSagaAction(
        sagaTester,
        (a) => a.type === expectedSetLatestAction.type,
      );

      expect(setLatestAction).toEqual(expectedSetLatestAction);

      mockApi.verify();
    });

    it('sets the latest review to null when none exists', async () => {
      const review = { ...fakeReview, id: 34421 };
      const addonId = review.addon.id;
      const userId = review.user.id;

      mockApi.expects('getLatestUserReview').resolves(null);

      _fetchLatestUserReview({
        addonId,
        userId,
      });

      const expectedAction = setLatestReview({
        addonId,
        userId,
        review: null,
      });
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');
      mockApi.expects('getLatestUserReview').rejects(error);

      _fetchLatestUserReview({ errorHandlerId: errorHandler.id });

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);

      expect(action).toEqual(expectedAction);
    });
  });
});
