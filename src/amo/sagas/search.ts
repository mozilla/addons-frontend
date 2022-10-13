import { call, put, select, takeLatest } from 'redux-saga/effects';

import { search as searchApi } from 'amo/api/search';
import log from 'amo/logger';
import { SEARCH_STARTED, abortSearch, searchLoad } from 'amo/reducers/search';
import { createErrorHandler, getState } from 'amo/sagas/utils';
import type { SearchParams } from 'amo/api/search';
import type { SearchStartAction } from 'amo/reducers/search';
import type { Saga } from 'amo/types/sagas';

export function* fetchSearchResults({
  payload,
}: SearchStartAction): Saga {
  const {
    errorHandlerId,
  } = payload;
  const errorHandler = createErrorHandler(errorHandlerId);
  yield put(errorHandler.createClearingAction());

  try {
    const {
      filters,
    } = payload;
    const state = yield select(getState);
    const params: SearchParams = {
      api: state.api,
      auth: true,
      filters,
    };
    const response = yield call(searchApi, params);
    const {
      count,
      page_size: pageSize,
      results,
    } = response;
    yield put(searchLoad({
      count,
      pageSize,
      results,
    }));
  } catch (error) {
    log.warn(`Search results failed to load: ${error}`);
    yield put(errorHandler.createErrorAction(error));
    yield put(abortSearch());
  }
}
export default function* searchSaga(): Saga {
  yield takeLatest(SEARCH_STARTED, fetchSearchResults);
}