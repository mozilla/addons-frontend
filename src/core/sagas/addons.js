/* @flow */
/* global Generator */
import { hideLoading, showLoading } from 'react-redux-loading-bar';
import { call, put, select, takeEvery } from 'redux-saga/effects';

import { loadEntities } from 'core/actions';
import { fetchAddon as fetchAddonFromApi } from 'core/api';
import { FETCH_ADDON } from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import log from 'core/logger';
import type { FetchAddonAction } from 'core/actions/addons';

import { getApi } from './utils';


export function* fetchAddon(
  { payload: { errorHandlerId, slug } }: FetchAddonAction
): Generator<any, any, any> {
  const errorHandler = new ErrorHandler({
    id: errorHandlerId,
    dispatch: () => log.error(
      'ErrorHandler cannot dispatch from a saga'),
  });
  yield put(errorHandler.createClearingAction());
  try {
    yield put(showLoading());
    const api = yield select(getApi);
    const response = yield call(fetchAddonFromApi, { api, slug });
    // TODO: put this back
    // yield put(loadEntities(response.entities));
  } catch (error) {
    log.warn(`Failed to load add-on with slug ${slug}: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  } finally {
    yield put(hideLoading());
  }
}

export default function* addonsSaga(): Generator<any, any, any> {
  yield takeEvery(FETCH_ADDON, fetchAddon);
}
