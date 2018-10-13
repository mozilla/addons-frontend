// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
/* eslint-disable import/order */
import { call, put, select, takeLatest } from 'redux-saga/effects';
/* eslint-enable import/order */

import { search as searchApi } from 'core/api/search';
import log from 'core/logger';
import { SEARCH_STARTED, abortSearch, searchLoad } from 'core/reducers/search';
import { createErrorHandler, getState } from 'core/sagas/utils';

export function* fetchSearchResults({ payload }) {
  const { errorHandlerId } = payload;
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const { filters } = payload;

    const state = yield select(getState);

    const response = yield call(searchApi, {
      api: state.api,
      auth: true,
      filters,
    });
    const { count, page_size: pageSize, results } = response;

    yield put(searchLoad({ count, pageSize, results }));
  } catch (error) {
    log.warn(`Search results failed to load: ${error}`);
    yield put(errorHandler.createErrorAction(error));
    yield put(abortSearch());
  }
}

export default function* searchSaga() {
  yield takeLatest(SEARCH_STARTED, fetchSearchResults);
}
