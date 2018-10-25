/* @flow */
import { call, put, select, takeEvery } from 'redux-saga/effects';
import { search as searchApi } from 'core/api/search';
import { FETCH_GUIDES_ADDONS, loadGuidesAddons } from 'amo/reducers/guides';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';
import type { SearchParams } from 'core/api/search';
import type { FetchGuidesAction } from 'amo/reducers/guides';

export function* fetchGuidesAddons({
  payload: { errorHandlerId, guid },
}: FetchGuidesAction): Generator<any, any, any> {
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

    yield put(loadGuidesAddons({ addons: results }));
  } catch (error) {
    log.warn('Search for guide addons failed:', error);
    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* guideAddonsSaga(): Generator<any, any, any> {
  yield takeEvery(FETCH_GUIDES_ADDONS, fetchGuidesAddons);
}
