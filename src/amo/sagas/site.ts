import { call, put, select, takeLatest } from 'redux-saga/effects';

import { getSiteStatus } from 'amo/api/site';
import { FETCH_SITE_STATUS, loadSiteStatus } from 'amo/reducers/site';
import { getState } from 'amo/sagas/utils';
import log from 'amo/logger';
import type { GetSiteStatusParams } from 'amo/api/site';
import type { Saga } from 'amo/types/sagas';

export function* fetchSiteStatus(): Saga {
  const state = yield select(getState);
  const params: GetSiteStatusParams = {
    api: state.api,
  };

  try {
    const {
      read_only: readOnly,
      notice,
    } = yield call(getSiteStatus, params);
    yield put(loadSiteStatus({
      readOnly,
      notice,
    }));
  } catch (error) {
    log.error(`Could not fetch site status: ${error}`);
  }
}
export default function* siteSaga(): Saga {
  yield takeLatest(FETCH_SITE_STATUS, fetchSiteStatus);
}