/* @flow */
import { call, put, select, takeEvery } from 'redux-saga/effects';

import { search as searchApi } from 'core/api/search';
import { FETCH_GUIDES_ADDONS } from 'amo/reducers/guides';
import log from 'core/logger';
import { loadAddonResults } from 'core/reducers/addons';
import { createErrorHandler, getState } from 'core/sagas/utils';
import type { Saga } from 'core/types/sagas';
import type { SearchParams } from 'core/api/search';
import type { FetchGuidesAction } from 'amo/reducers/guides';

export function* fetchGuidesAddons({
  payload: { errorHandlerId, guids },
}: FetchGuidesAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: SearchParams = {
      api: state.api,
      filters: {
        guid: guids.join(','),
      },
    };

    const { results } = yield call(searchApi, params);
    yield put(loadAddonResults({ addons: results }));
  } catch (error) {
    log.warn(`Search for guide addons failed: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* guideAddonsSaga(): Saga {
  yield takeEvery(FETCH_GUIDES_ADDONS, fetchGuidesAddons);
}
