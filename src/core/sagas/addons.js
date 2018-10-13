/* @flow */
/* global Generator */
// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
/* eslint-disable import/order */
import { call, put, select, takeEvery } from 'redux-saga/effects';
/* eslint-enable import/order */

import { fetchAddon as fetchAddonFromApi } from 'core/api';
import { FETCH_ADDON, loadAddonResults } from 'core/reducers/addons';
import log from 'core/logger';
import type { FetchAddonParams } from 'core/api';
import type { FetchAddonAction } from 'core/reducers/addons';

import { createErrorHandler, getState } from './utils';

export function* fetchAddon({
  payload: { errorHandlerId, slug },
}: FetchAddonAction): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);
  yield put(errorHandler.createClearingAction());
  try {
    const state = yield select(getState);

    const params: FetchAddonParams = { api: state.api, slug };
    const addon = yield call(fetchAddonFromApi, params);

    yield put(loadAddonResults({ addons: [addon] }));
  } catch (error) {
    log.warn(`Failed to load add-on with slug ${slug}: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* addonsSaga(): Generator<any, any, any> {
  yield takeEvery(FETCH_ADDON, fetchAddon);
}
