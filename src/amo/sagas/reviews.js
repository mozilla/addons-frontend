/* @flow */
/* global Generator */
import { hideLoading, showLoading } from 'react-redux-loading-bar';
import { call, put, select, takeEvery } from 'redux-saga/effects';

import { getReviews } from 'amo/api';
import { setAddonReviews } from 'amo/actions/reviews';
import { FETCH_REVIEWS } from 'amo/constants';
import log from 'core/logger';
import { createErrorHandler, getApi } from 'core/sagas/utils';
import type { FetchReviewsAction } from 'amo/actions/reviews';


export function* fetchReviews(
  {
    payload: { errorHandlerId, addonSlug, page },
  }: FetchReviewsAction
): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);
  try {
    yield put(showLoading());
    const api = yield select(getApi);
    const response = yield call(getReviews, {
      // Hide star ratings (reviews that do not have a body).
      api, addon: addonSlug, page, filter: 'without_empty_body',
    });
    yield put(setAddonReviews({
      addonSlug, reviews: response.results, reviewCount: response.count,
    }));
  } catch (error) {
    log.warn(`Failed to load reviews for add-on slug ${addonSlug}: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  } finally {
    yield put(hideLoading());
  }
}

export default function* reviewsSaga(): Generator<any, any, any> {
  yield takeEvery(FETCH_REVIEWS, fetchReviews);
}
