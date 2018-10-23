/* @flow */
import { call, put, select, takeEvery } from 'redux-saga/effects';
import { search as searchApi } from 'core/api/search';
import { FETCH_GUIDE_ADDONS, loadGuideAddons } from 'amo/reducers/guide';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';
import type { SearchParams } from 'core/api/search';
import type { FetchGuideAction } from 'amo/reducers/guide';

export function* fetchGuideAddons({
  payload: { errorHandlerId, guid },
}: FetchGuideAction): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: SearchParams = {
      api: state.api,
      filters: {
        guid,
      },
    };

    const guide = yield call(searchApi, params);
    const { results } = guide;

    yield put(loadGuideAddons({ addons: results }));
  } catch (error) {
    log.warn('Search for guide addons failed:', error);
    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* guideAddonsSaga(): Generator<any, any, any> {
  yield takeEvery(FETCH_GUIDE_ADDONS, fetchGuideAddons);
}
