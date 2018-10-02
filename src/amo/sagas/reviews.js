/* @flow */
import { oneLine } from 'common-tags';
import invariant from 'invariant';

// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
/* eslint-disable import/order */
import { call, put, select, takeLatest } from 'redux-saga/effects';
import { delay } from 'redux-saga/lib/internal/utils';
/* eslint-enable import/order */

import {
  deleteReview,
  flagReview,
  getReview,
  getReviews,
  replyToReview,
  submitReview,
} from 'amo/api/reviews';
import {
  ABORTED,
  CREATE_ADDON_REVIEW,
  DELETE_ADDON_REVIEW,
  FETCH_GROUPED_RATINGS,
  FETCH_REVIEW,
  FETCH_REVIEWS,
  FETCH_USER_REVIEWS,
  SAVED_RATING,
  SAVED_REVIEW,
  SEND_REPLY_TO_REVIEW,
  SEND_REVIEW_FLAG,
  STARTED_SAVE_RATING,
  STARTED_SAVE_REVIEW,
  UPDATE_ADDON_REVIEW,
  unloadAddonReviews,
  flashReviewMessage,
  hideEditReviewForm,
  hideFlashedReviewMessage,
  hideReplyToReviewForm,
  setAddonReviews,
  setGroupedRatings,
  setLatestReview,
  setReview,
  setReviewReply,
  setReviewWasFlagged,
  setUserReviews,
} from 'amo/actions/reviews';
import log from 'core/logger';
import { fetchAddon } from 'core/reducers/addons';
import { createErrorHandler, getState } from 'core/sagas/utils';
import type { AppState } from 'amo/store';
import type {
  ExternalReviewReplyType,
  ExternalReviewType,
  GetReviewsApiResponse,
  GetReviewParams,
  GetReviewsParams,
  SubmitReviewParams,
  SubmitReviewResponse,
} from 'amo/api/reviews';
import type {
  CreateAddonReviewAction,
  DeleteAddonReviewAction,
  FetchGroupedRatingsAction,
  FetchReviewAction,
  FetchReviewsAction,
  FetchUserReviewsAction,
  FlagReviewAction,
  SendReplyToReviewAction,
  UpdateAddonReviewAction,
} from 'amo/actions/reviews';

// Number of millesconds that a message should be flashed on screen.
export const FLASH_SAVED_MESSAGE_DURATION = 2000;

type Options = {|
  _delay?: typeof delay,
|};

function* fetchReviews({
  payload: { errorHandlerId, addonSlug, page },
}: FetchReviewsAction): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);
  try {
    const state = yield select(getState);

    const params: GetReviewsParams = {
      addon: addonSlug,
      apiState: state.api,
      // Hide star-only ratings (reviews that do not have a body).
      filter: 'without_empty_body',
      page,
    };

    const response: GetReviewsApiResponse = yield call(getReviews, params);

    yield put(
      setAddonReviews({
        addonSlug,
        pageSize: response.page_size,
        reviewCount: response.count,
        reviews: response.results,
      }),
    );
  } catch (error) {
    log.warn(`Failed to load reviews for add-on slug ${addonSlug}: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

function* fetchGroupedRatings({
  payload: { errorHandlerId, addonId },
}: FetchGroupedRatingsAction): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);
  try {
    const state = yield select(getState);

    const params: GetReviewsParams = {
      addon: addonId,
      apiState: state.api,
      show_grouped_ratings: true,
    };
    const response: GetReviewsApiResponse = yield call(getReviews, params);

    if (!response.grouped_ratings) {
      // This is unlikely to happen but if it does we should stop the show.
      throw new Error(
        oneLine`The request to getReviews({ show_grouped_ratings: true })
        unexpectedly returned an empty grouped_ratings object`,
      );
    }
    yield put(
      setGroupedRatings({
        addonId,
        grouping: response.grouped_ratings,
      }),
    );
  } catch (error) {
    log.warn(
      `Failed to fetch grouped ratings for add-on ID ${addonId}: ${error}`,
    );
    yield put(errorHandler.createErrorAction(error));
  }
}

function* fetchUserReviews({
  payload: { errorHandlerId, page, userId },
}: FetchUserReviewsAction): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);

  try {
    const state = yield select(getState);

    const params: GetReviewsParams = {
      apiState: state.api,
      page,
      user: userId,
    };

    const response: GetReviewsApiResponse = yield call(getReviews, params);

    yield put(
      setUserReviews({
        pageSize: response.page_size,
        reviewCount: response.count,
        reviews: response.results,
        userId,
      }),
    );
  } catch (error) {
    log.warn(`Failed to load reviews for user ID ${userId}: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

function* handleReplyToReview({
  payload: { errorHandlerId, originalReviewId, body, title },
}: SendReplyToReviewAction): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);
    const reviewResponse: ExternalReviewReplyType = yield call(replyToReview, {
      apiState: state.api,
      body,
      originalReviewId,
      title,
    });

    yield put(setReviewReply({ originalReviewId, reply: reviewResponse }));

    yield put(hideReplyToReviewForm({ reviewId: originalReviewId }));
  } catch (error) {
    log.warn(`Failed to send reply to review ID ${originalReviewId}: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

function* handleFlagReview({
  payload: { errorHandlerId, note, reason, reviewId },
}: FlagReviewAction): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);
    yield call(flagReview, {
      apiState: state.api,
      note,
      reason,
      reviewId,
    });

    yield put(setReviewWasFlagged({ reason, reviewId }));
  } catch (error) {
    log.warn(`Failed to flag review ID ${reviewId}: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

function* manageAddonReview(
  action: CreateAddonReviewAction | UpdateAddonReviewAction,
  { _delay = delay }: Options = {},
) {
  const { body, errorHandlerId, score } = action.payload;
  const errorHandler = createErrorHandler(errorHandlerId);

  const savingRating = !!score;
  const savingReview = !!body;

  yield put(errorHandler.createClearingAction());
  if (savingRating) {
    yield put(flashReviewMessage(STARTED_SAVE_RATING));
  }
  if (savingReview) {
    yield put(flashReviewMessage(STARTED_SAVE_REVIEW));
  }

  try {
    const state: AppState = yield select(getState);
    const baseParams = {
      apiState: state.api,
      body,
      score,
    };
    let params;

    if (action.type === CREATE_ADDON_REVIEW) {
      params = {
        ...baseParams,
        addonId: action.payload.addonId,
        versionId: action.payload.versionId,
      };
    } else if (action.type === UPDATE_ADDON_REVIEW) {
      params = {
        ...baseParams,
        reviewId: action.payload.reviewId,
      };
    }
    invariant(
      params,
      `params was unexpectedly empty; action.type: ${action.type}`,
    );

    const submitParams: SubmitReviewParams = params;
    const reviewFromResponse: SubmitReviewResponse = yield call(
      submitReview,
      submitParams,
    );

    yield put(setReview(reviewFromResponse));

    if (savingRating) {
      yield put(flashReviewMessage(SAVED_RATING));
    }
    if (savingReview) {
      yield put(flashReviewMessage(SAVED_REVIEW));
      yield put(hideEditReviewForm({ reviewId: reviewFromResponse.id }));
    }

    if (!reviewFromResponse.is_developer_reply) {
      invariant(reviewFromResponse.version, 'version is required');
      yield put(
        setLatestReview({
          addonId: reviewFromResponse.addon.id,
          addonSlug: reviewFromResponse.addon.slug,
          review: reviewFromResponse,
          userId: reviewFromResponse.user.id,
          versionId: reviewFromResponse.version.id,
        }),
      );

      // Reload the add-on to update its rating and review counts.
      yield put(
        fetchAddon({ errorHandler, slug: reviewFromResponse.addon.slug }),
      );
    }

    // Make the message disappear after some time.
    yield _delay(FLASH_SAVED_MESSAGE_DURATION);
    yield put(hideFlashedReviewMessage());
  } catch (error) {
    log.warn(
      `Failed to create/update review with action ${action.type}: ${error}`,
    );
    yield put(errorHandler.createErrorAction(error));
    yield put(flashReviewMessage(ABORTED));
  }
}

function* deleteAddonReview({
  payload: { addonId, errorHandlerId, isReplyToReviewId, reviewId },
}: DeleteAddonReviewAction): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);
    yield call(deleteReview, {
      apiState: state.api,
      reviewId,
    });

    yield put(unloadAddonReviews({ addonId, reviewId }));
    if (isReplyToReviewId) {
      yield put(unloadAddonReviews({ addonId, reviewId: isReplyToReviewId }));
    }
  } catch (error) {
    log.warn(`Failed to delete review ID ${reviewId}: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

function* fetchReview({
  payload: { errorHandlerId, reviewId },
}: FetchReviewAction): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: GetReviewParams = {
      apiState: state.api,
      reviewId,
    };

    const review: ExternalReviewType = yield call(getReview, params);

    yield put(setReview(review));
  } catch (error) {
    log.warn(`Failed to get review ID ${reviewId}: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* reviewsSaga(
  options?: Options,
): Generator<any, any, any> {
  yield takeLatest(FETCH_GROUPED_RATINGS, fetchGroupedRatings);
  yield takeLatest(FETCH_REVIEW, fetchReview);
  yield takeLatest(FETCH_REVIEWS, fetchReviews);
  yield takeLatest(FETCH_USER_REVIEWS, fetchUserReviews);
  yield takeLatest(SEND_REPLY_TO_REVIEW, handleReplyToReview);
  yield takeLatest(SEND_REVIEW_FLAG, handleFlagReview);
  yield takeLatest(CREATE_ADDON_REVIEW, (action) =>
    manageAddonReview(action, options),
  );
  yield takeLatest(UPDATE_ADDON_REVIEW, (action) =>
    manageAddonReview(action, options),
  );
  yield takeLatest(DELETE_ADDON_REVIEW, deleteAddonReview);
}
