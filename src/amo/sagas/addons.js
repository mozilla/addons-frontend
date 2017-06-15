/* @flow */
/* global Generator */
import { hideLoading, showLoading } from 'react-redux-loading-bar';
import { call, put, select, takeEvery } from 'redux-saga/effects';

import { loadEntities } from 'core/actions';
import { fetchAddon as fetchAddonFromApi } from 'core/api';
import { FETCH_ADDON } from 'core/constants';
import log from 'core/logger';
import type { FetchAddonAction } from 'core/actions/addons';

import { getApi } from './utils';


export function* fetchAddon(
  { payload: { slug } }: FetchAddonAction
): Generator<any, any, any> {
  try {
    yield put(showLoading());
    const api = yield select(getApi);
    const response = yield call(fetchAddonFromApi, { api, slug });
    yield put(loadEntities(response.entities));
  } catch (err) {
    log.warn('Addon failed to load:', err);
    // TODO: handle errors and stuff
  } finally {
    yield put(hideLoading());
  }
}

export default function* addonsSaga(): Generator<any, any, any> {
  yield takeEvery(FETCH_ADDON, fetchAddon);
}
