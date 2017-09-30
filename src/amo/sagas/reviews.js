/* @flow */
/* global Generator */
// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
/* eslint-disable import/order */
import { call, put, select, takeEvery } from 'redux-saga/effects';
/* eslint-enable import/order */

import { getReviews } from 'amo/api';
import { setAddonReviews } from 'amo/actions/reviews';
import { FETCH_REVIEWS } from 'amo/constants';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';
import type { FetchReviewsAction } from 'amo/actions/reviews';


export function* fetchReviews(
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

export default function* reviewsSaga(): Generator<any, any, any> {
  yield takeEvery(FETCH_REVIEWS, fetchReviews);
}
