/* @flow */
import { call, put, select, takeLatest } from 'redux-saga/effects';
import {
  FETCH_RECOMMENDATIONS,
  abortFetchRecommendations,
  loadRecommendations,
} from 'amo/reducers/recommendations';
import * as api from 'amo/api/recommendations';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';
import type { GetRecommendationsParams } from 'amo/api/recommendations';
import type {
  FetchRecommendationsAction,
} from 'amo/reducers/recommendations';


export function* fetchRecommendations({
  payload: { errorHandlerId, guid, recommended },
}: FetchRecommendationsAction): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);
  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: GetRecommendationsParams = {
      api: state.api, guid, recommended,
    };
    const recommendations = yield call(api.getRecommendations, params);
    const { fallback_reason: fallbackReason, outcome, results: addons }
      = recommendations;

    yield put(loadRecommendations({
      addons,
      fallbackReason,
      guid,
      outcome,
    }));
  } catch (error) {
    log.warn(`Failed to recommendations: ${error}`);
    yield put(errorHandler.createErrorAction(error));
    yield put(abortFetchRecommendations({ guid }));
  }
}

export default function* recommendationsSaga(): Generator<any, any, any> {
  yield takeLatest(FETCH_RECOMMENDATIONS, fetchRecommendations);
}
