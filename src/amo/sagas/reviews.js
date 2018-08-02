/* @flow */
// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
/* eslint-disable import/order */
import { call, put, select, takeLatest } from 'redux-saga/effects';
/* eslint-enable import/order */

import { flagReview, getReviews, replyToReview } from 'amo/api/reviews';
import {
  hideReplyToReviewForm,
  setAddonReviews,
  setRatingSummary,
  setReviewReply,
  setReviewWasFlagged,
  setUserReviews,
} from 'amo/actions/reviews';
import {
  FETCH_RATING_SUMMARY,
  FETCH_REVIEWS,
  FETCH_USER_REVIEWS,
  SEND_REPLY_TO_REVIEW,
  SEND_REVIEW_FLAG,
} from 'amo/constants';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';
import type { GetReviewsApiResponse, GetReviewsParams } from 'amo/api/reviews';
import type {
  FetchRatingSummaryAction,
  FetchReviewsAction,
  FetchUserReviewsAction,
  FlagReviewAction,
  SendReplyToReviewAction,
} from 'amo/actions/reviews';

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

function* fetchRatingSummary({
  payload: { errorHandlerId, addonId },
}: FetchRatingSummaryAction): Generator<any, any, any> {
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
        'The request to getReviews({ show_grouped_ratings: true }) unexpectedly returned an empty grouped_ratings object',
      );
    }
    yield put(
      setRatingSummary({
        addonId,
        summary: response.grouped_ratings,
      }),
    );
  } catch (error) {
    log.warn(
      `Failed to load rating summary for add-on ID ${addonId}: ${error}`,
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
    const reviewResponse = yield call(replyToReview, {
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

export default function* reviewsSaga(): Generator<any, any, any> {
  yield takeLatest(FETCH_RATING_SUMMARY, fetchRatingSummary);
  yield takeLatest(FETCH_REVIEWS, fetchReviews);
  yield takeLatest(FETCH_USER_REVIEWS, fetchUserReviews);
  yield takeLatest(SEND_REPLY_TO_REVIEW, handleReplyToReview);
  yield takeLatest(SEND_REVIEW_FLAG, handleFlagReview);
}
