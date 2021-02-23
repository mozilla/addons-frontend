/* @flow */
import { call, put, select, takeLatest } from 'redux-saga/effects';

import { getHomeShelves } from 'amo/api/homeShelves';
import {
  FETCH_HOME_DATA,
  abortFetchHomeData,
  loadHomeData,
} from 'amo/reducers/home';
import log from 'amo/logger';
import { createErrorHandler, getState } from 'amo/sagas/utils';
import type { FetchHomeDataAction } from 'amo/reducers/home';
import type { Saga } from 'amo/types/sagas';

export function* fetchHomeData({
  payload: { errorHandlerId },
}: FetchHomeDataAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  const state = yield select(getState);

  try {
    let homeShelves = {};
    try {
      homeShelves = yield call(getHomeShelves, { api: state.api });
    } catch (error) {
      log.warn(`Home shelves failed to load: ${error}`);
      throw error;
    }

    yield put(
      loadHomeData({
        homeShelves,
      }),
    );
  } catch (error) {
    yield put(errorHandler.createErrorAction(error));
    yield put(abortFetchHomeData());
  }
}

export default function* homeSaga(): Saga {
  yield takeLatest(FETCH_HOME_DATA, fetchHomeData);
}
