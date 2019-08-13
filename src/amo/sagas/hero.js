/* @flow */
import { call, put, select, takeLatest } from 'redux-saga/effects';

import {
  FETCH_HERO_SHELVES,
  abortFetchHeroShelves,
  loadHeroShelves,
} from 'amo/reducers/hero';
import * as api from 'amo/api/hero';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';
import type { GetHeroShelvesParams } from 'amo/api/hero';
import type { FetchHeroShelvesAction } from 'amo/reducers/hero';
import type { Saga } from 'core/types/sagas';

export function* fetchHeroShelves({
  payload: { errorHandlerId },
}: FetchHeroShelvesAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);
  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: GetHeroShelvesParams = {
      api: state.api,
    };
    const heroShelves = yield call(api.getHeroShelves, params);

    yield put(loadHeroShelves({ heroShelves }));
  } catch (error) {
    log.warn(`Failed to hero: ${error}`);
    yield put(errorHandler.createErrorAction(error));
    yield put(abortFetchHeroShelves());
  }
}

export default function* heroSaga(): Saga {
  yield takeLatest(FETCH_HERO_SHELVES, fetchHeroShelves);
}
