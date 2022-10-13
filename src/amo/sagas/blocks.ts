import { call, put, select, takeLatest } from 'redux-saga/effects';

import { getBlock } from 'amo/api/blocks';
import { FETCH_BLOCK, abortFetchBlock, loadBlock } from 'amo/reducers/blocks';
import { createErrorHandler, getState } from 'amo/sagas/utils';
import type { FetchBlockAction } from 'amo/reducers/blocks';
import type { Saga } from 'amo/types/sagas';

export function* fetchBlock({
  payload: {
    errorHandlerId,
    guid,
  },
}: FetchBlockAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);
  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);
    const block = yield call(getBlock, {
      apiState: state.api,
      guid,
    });
    yield put(loadBlock({
      block,
    }));
  } catch (error) {
    yield put(errorHandler.createErrorAction(error));
    yield put(abortFetchBlock({
      guid,
    }));
  }
}
export default function* blocksSaga(): Saga {
  yield takeLatest(FETCH_BLOCK, fetchBlock);
}