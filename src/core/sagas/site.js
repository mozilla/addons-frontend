/* @flow */
import { call, put, select, takeLatest } from 'redux-saga/effects';

import { getSiteStatus } from 'core/api/site';
import { FETCH_SITE_STATUS, loadSiteStatus } from 'core/reducers/site';
import { getState } from 'core/sagas/utils';
import type { GetSiteStatusParams } from 'core/api/site';
import type { Saga } from 'core/types/sagas';

// This saga is not triggered by the UI but on the server side, hence do not
// have a `errorHandler`. We do not want to miss any error so we let this saga
// throw errors without catching them.
export function* fetchSiteStatus(): Saga {
  const state = yield select(getState);

  const params: GetSiteStatusParams = { api: state.api };

  const { read_only: readOnly, notice } = yield call(getSiteStatus, params);

  yield put(loadSiteStatus({ readOnly, notice }));
}

export default function* siteSaga(): Saga {
  yield takeLatest(FETCH_SITE_STATUS, fetchSiteStatus);
}
