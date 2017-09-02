/* @flow */
/* global Generator */
// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
/* eslint-disable import/order */
import { hideLoading, showLoading } from 'react-redux-loading-bar';
import { call, put, select, takeEvery } from 'redux-saga/effects';
/* eslint-enable import/order */

import { loadEntities } from 'core/actions';
import { fetchAddon as fetchAddonFromApi } from 'core/api';
import { FETCH_ADDON } from 'core/reducers/addons';
import log from 'core/logger';
import type { FetchAddonAction } from 'core/reducers/addons';

import { createErrorHandler, getState } from './utils';


export function* fetchAddon(
  { payload: { errorHandlerId, slug } }: FetchAddonAction
): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);
  yield put(errorHandler.createClearingAction());
  try {
    yield put(showLoading());
    const state = yield select(getState);
    const response = yield call(fetchAddonFromApi, { api: state.api, slug });
    yield put(loadEntities(response.entities));
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
