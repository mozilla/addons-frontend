/* @flow */
/* global Generator */
// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
/* eslint-disable import/order */
import { call, put, select, takeLatest } from 'redux-saga/effects';
/* eslint-enable import/order */

import { getReviews, replyToReview } from 'amo/api/reviews';
import {
  hideReplyToReviewForm, setAddonReviews, setReviewReply,
} from 'amo/actions/reviews';
import { FETCH_REVIEWS, SEND_REPLY_TO_REVIEW } from 'amo/constants';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';
import type {
  FetchReviewsAction, SendReplyToReviewAction,
} from 'amo/actions/reviews';


function* fetchReviews(
  {
    payload: { errorHandlerId, addonSlug, page },
  }: FetchReviewsAction
): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);
  try {
    const state = yield select(getState);
    const response = yield call(getReviews, {
      // Hide star-only ratings (reviews that do not have a body).
      api: state.api, addon: addonSlug, page, filter: 'without_empty_body',
    });
    yield put(setAddonReviews({
      addonSlug, reviews: response.results, reviewCount: response.count,
    }));
  } catch (error) {
    log.warn(`Failed to load reviews for add-on slug ${addonSlug}: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

function* handleReplyToReview(
  {
    payload: { errorHandlerId, originalReviewId, body, title },
  }: SendReplyToReviewAction
): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);
    const reviewResponse = yield call(replyToReview, {
      apiState: state.api,
      body,
      // This prevents the error from being handled by callApi();
      // we want to handle it in catch() ourselves.
      errorHandler: undefined,
      originalReviewId,
      title,
    });

    yield put(setReviewReply({ originalReviewId, reply: reviewResponse }));

    yield put(hideReplyToReviewForm({ reviewId: originalReviewId }));
  } catch (error) {
    log.warn(
      `Failed to send reply to review ID ${originalReviewId}: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* reviewsSaga(): Generator<any, any, any> {
  yield takeLatest(FETCH_REVIEWS, fetchReviews);
  yield takeLatest(SEND_REPLY_TO_REVIEW, handleReplyToReview);
}
