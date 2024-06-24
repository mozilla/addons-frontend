/* @flow */
import invariant from 'invariant';
import { call, delay, put, select, takeLatest } from 'redux-saga/effects';

import { REVIEW_FLAG_REASON_LANGUAGE } from 'amo/constants';
import {
  deleteReview,
  flagReview,
  getLatestUserReview,
  getReview,
  getReviews,
  replyToReview,
  submitReview,
} from 'amo/api/reviews';
import { reportRating } from 'amo/api/abuse';
import {
  ABORTED,
  CREATE_ADDON_REVIEW,
  DELETE_ADDON_REVIEW,
  FETCH_LATEST_USER_REVIEW,
  FETCH_REVIEW,
  FETCH_REVIEW_PERMISSIONS,
  FETCH_REVIEWS,
  FETCH_USER_REVIEWS,
  SAVED_RATING,
  SAVED_REVIEW,
  SEND_REPLY_TO_REVIEW,
  SEND_REVIEW_FLAG,
  SEND_RATING_ABUSE_REPORT,
  STARTED_SAVE_RATING,
  STARTED_SAVE_REVIEW,
  UPDATE_ADDON_REVIEW,
  createInternalReview,
  unloadAddonReviews,
  flashReviewMessage,
  hideEditReviewForm,
  hideFlashedReviewMessage,
  hideReplyToReviewForm,
  setAddonReviews,
  setLatestReview,
  setReview,
  setReviewPermissions,
  setReviewReply,
  setReviewWasFlagged,
  setUserReviews,
  updateRatingCounts,
} from 'amo/actions/reviews';
import log from 'amo/logger';
import { createErrorHandler, getState } from 'amo/sagas/utils';
import type { AppState } from 'amo/store';
import type {
  ExternalReviewReplyType,
  ExternalReviewType,
  GetLatestUserReviewParams,
  GetLatestUserReviewResponse,
  GetReviewsApiResponse,
  GetReviewParams,
  GetReviewsParams,
  SubmitReviewParams,
  SubmitReviewResponse,
} from 'amo/api/reviews';
import type { ReportRatingParams, ReportRatingResponse } from 'amo/api/abuse';
import type {
  CreateAddonReviewAction,
  DeleteAddonReviewAction,
  FetchLatestUserReviewAction,
  FetchReviewAction,
  FetchReviewPermissionsAction,
  FetchReviewsAction,
  FetchUserReviewsAction,
  FlagReviewAction,
  SendRatingAbuseReportAction,
  SendReplyToReviewAction,
  UpdateAddonReviewAction,
} from 'amo/actions/reviews';
import { selectReview } from 'amo/reducers/reviews';
import type { Saga } from 'amo/types/sagas';

// Number of millesconds that a message should be flashed on screen.
export const FLASH_SAVED_MESSAGE_DURATION = 2000;

type Options = {
  _delay?: typeof delay,
};

function* fetchReviews({
  payload: { errorHandlerId, addonSlug, page, score },
}: FetchReviewsAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);

  try {
    yield put(errorHandler.createClearingAction());
    const state = yield select(getState);

    const params: GetReviewsParams = {
      addon: addonSlug,
      apiState: state.api,
      page,
      score: score || undefined,
    };

    const response: GetReviewsApiResponse = yield call(getReviews, params);

    yield put(
      setAddonReviews({
        addonSlug,
        page: page || '1',
        pageSize: response.page_size,
        reviewCount: response.count,
        reviews: response.results,
        score,
      }),
    );
  } catch (error) {
    log.warn(`Failed to load reviews for add-on slug ${addonSlug}: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

function* fetchReviewPermissions({
  payload: { errorHandlerId, addonId, userId },
}: FetchReviewPermissionsAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);

  try {
    yield put(errorHandler.createClearingAction());
    const state: AppState = yield select(getState);

    const params: GetReviewsParams = {
      addon: addonId,
      apiState: state.api,
      show_permissions_for: userId,
    };

    const response: GetReviewsApiResponse = yield call(getReviews, params);
    invariant(
      response.can_reply !== undefined,
      'response.can_reply was unexpectedly undefined',
    );

    yield put(
      setReviewPermissions({
        addonId,
        canReplyToReviews: response.can_reply,
        userId,
      }),
    );
  } catch (error) {
    log.warn(
      `Failed to load review permissions for add-on ID ${addonId}, user ID ${userId}: ${error}`,
    );
    yield put(errorHandler.createErrorAction(error));
  }
}

function* fetchUserReviews({
  payload: { errorHandlerId, page, userId },
}: FetchUserReviewsAction): Saga {
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
}: SendReplyToReviewAction): Saga {
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
}: FlagReviewAction): Saga {
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
    // $FlowIgnore: Flow can't tell what redux-saga's `select` returns.
    const state: AppState = yield select(getState);
    const baseParams = {
      apiState: state.api,
      body,
      score,
    };
    let params;

    let oldReview;
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
      oldReview = selectReview(state.reviews, action.payload.reviewId);
      invariant(
        oldReview,
        `review with ID=${action.payload.reviewId} does not exist in state`,
      );
    }
    invariant(
      params,
      `params was unexpectedly empty; action.type: ${action.type}`,
    );

    const submitParams: SubmitReviewParams = params;
    // $FlowIgnore: Flow can't tell what redux-saga's `call` returns.
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
      yield put(
        setLatestReview({
          addonId: reviewFromResponse.addon.id,
          review: reviewFromResponse,
          userId: reviewFromResponse.user.id,
        }),
      );

      yield put(
        updateRatingCounts({
          addonId: reviewFromResponse.addon.id,
          oldReview,
          newReview: createInternalReview(
            reviewFromResponse,
            state.reviews.lang,
          ),
        }),
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
}: DeleteAddonReviewAction): Saga {
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

function* fetchLatestUserReview({
  payload: { addonId, errorHandlerId, userId },
}: FetchLatestUserReviewAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state: AppState = yield select(getState);

    const params: GetLatestUserReviewParams = {
      addon: addonId,
      apiState: state.api,
      user: userId,
    };

    const review: GetLatestUserReviewResponse = yield call(
      getLatestUserReview,
      params,
    );

    const _setLatestReview = (value) => {
      return setLatestReview({
        userId,
        addonId,
        review: value,
      });
    };

    if (review) {
      yield put(setReview(review));
      yield put(_setLatestReview(review));
    } else {
      log.debug(
        `No saved review found for userId ${userId}, addonId ${addonId}`,
      );
      yield put(_setLatestReview(null));
    }
  } catch (error) {
    log.warn(
      `Failed to fetchLatestUserReview for addonId "${addonId}", userId "${userId}": ${error}`,
    );
    yield put(errorHandler.createErrorAction(error));
  }
}

function* fetchReview({
  payload: { errorHandlerId, reviewId },
}: FetchReviewAction): Saga {
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

function* sendRatingAbuseReport({
  payload: {
    auth,
    errorHandlerId,
    message,
    ratingId,
    reason,
    reporterEmail,
    reporterName,
    illegalCategory,
    illegalSubcategory,
  },
}: SendRatingAbuseReportAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const { api } = yield select(getState);

    const params: ReportRatingParams = {
      api,
      auth,
      message,
      ratingId,
      reason,
      reporterName: reporterName || null,
      reporterEmail: reporterEmail || null,
      illegalCategory: illegalCategory || null,
      illegalSubcategory: illegalSubcategory || null,
    };

    const response: ReportRatingResponse = yield call(reportRating, params);

    yield put(
      setReviewWasFlagged({
        reviewId: response.rating.id,
        // This is the reason in our code that opens the feedback form page.
        reason: REVIEW_FLAG_REASON_LANGUAGE,
      }),
    );
  } catch (error) {
    log.warn(`Failed to report rating with ID ${ratingId}: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* reviewsSaga(options?: Options): Saga {
  yield takeLatest(FETCH_LATEST_USER_REVIEW, fetchLatestUserReview);
  yield takeLatest(FETCH_REVIEW, fetchReview);
  yield takeLatest(FETCH_REVIEW_PERMISSIONS, fetchReviewPermissions);
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
  yield takeLatest(SEND_RATING_ABUSE_REPORT, sendRatingAbuseReport);
}
