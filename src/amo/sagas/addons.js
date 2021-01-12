/* @flow */
import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';

import { getAddonInfo } from 'amo/api/addonInfo';
import { fetchAddon as fetchAddonFromApi } from 'amo/api';
import {
  FETCH_ADDON,
  FETCH_ADDON_INFO,
  loadAddonInfo,
  loadAddon,
} from 'amo/reducers/addons';
import log from 'amo/logger';
import { createErrorHandler, getState } from 'amo/sagas/utils';
import type {
  ExternalAddonInfoType,
  GetAddonInfoParams,
} from 'amo/api/addonInfo';
import type { AppState } from 'amo/store';
import type { FetchAddonParams } from 'amo/api';
import type {
  FetchAddonAction,
  FetchAddonInfoAction,
} from 'amo/reducers/addons';
import type { Saga } from 'amo/types/sagas';

export function* fetchAddon({
  payload: { errorHandlerId, slug },
}: FetchAddonAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);
  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: FetchAddonParams = { api: state.api, slug };
    const addon = yield call(fetchAddonFromApi, params);

    yield put(loadAddon({ addon, slug }));
  } catch (error) {
    log.warn(`Failed to load add-on with slug ${slug}: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export function* fetchAddonInfo({
  payload: { errorHandlerId, slug },
}: FetchAddonInfoAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state: AppState = yield select(getState);

    const params: GetAddonInfoParams = {
      api: state.api,
      slug,
    };
    const info: ExternalAddonInfoType = yield call(getAddonInfo, params);

    yield put(loadAddonInfo({ slug, info }));
  } catch (error) {
    log.warn(`Failed to fetch add-on info: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* addonsSaga(): Saga {
  yield takeEvery(FETCH_ADDON, fetchAddon);
  yield takeLatest(FETCH_ADDON_INFO, fetchAddonInfo);
}
