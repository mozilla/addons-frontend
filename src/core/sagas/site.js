/* @flow */
import { call, put, select, takeLatest } from 'redux-saga/effects';

import { getSiteStatus } from 'core/api/site';
import { FETCH_SITE_STATUS, loadSiteStatus } from 'core/reducers/site';
import { getState } from 'core/sagas/utils';
import log from 'core/logger';
import type { GetSiteStatusParams } from 'core/api/site';
import type { Saga } from 'core/types/sagas';

export function* fetchSiteStatus(): Saga {
  const state = yield select(getState);

  const params: GetSiteStatusParams = { api: state.api };

  try {
    const { read_only: readOnly, notice } = yield call(getSiteStatus, params);

    yield put(loadSiteStatus({ readOnly, notice }));
  } catch (error) {
    log.error(`Could not fetch site status: ${error}`);
  }
}

export default function* siteSaga(): Saga {
  yield takeLatest(FETCH_SITE_STATUS, fetchSiteStatus);
}
