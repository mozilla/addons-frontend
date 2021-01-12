/* @flow */
import { call, put, select, takeLatest } from 'redux-saga/effects';

import {
  FETCH_SPONSORED,
  abortFetchSponsored,
  loadSponsored,
} from 'amo/reducers/shelves';
import { getSponsoredShelf } from 'amo/api/shelves';
import log from 'amo/logger';
import { createErrorHandler, getState } from 'amo/sagas/utils';
import type { GetSponsoredShelfParams } from 'amo/api/shelves';
import type { FetchSponsoredAction } from 'amo/reducers/shelves';
import type { Saga } from 'amo/types/sagas';

export function* fetchSponsored({
  payload: { errorHandlerId },
}: FetchSponsoredAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);
  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: GetSponsoredShelfParams = {
      api: state.api,
    };
    const shelfData = yield call(getSponsoredShelf, params);
    yield put(
      loadSponsored({
        shelfData,
      }),
    );
  } catch (error) {
    log.warn(`Failed to fetch sponsored shelf: ${error}`);
    yield put(errorHandler.createErrorAction(error));
    yield put(abortFetchSponsored());
  }
}

export default function* recommendationsSaga(): Saga {
  yield takeLatest(FETCH_SPONSORED, fetchSponsored);
}
