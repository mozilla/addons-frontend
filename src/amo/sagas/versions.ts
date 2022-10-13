import { call, put, select, takeLatest } from 'redux-saga/effects';

import { getVersion, getVersions } from 'amo/api/versions';
import { FETCH_VERSION, FETCH_VERSIONS, loadVersions } from 'amo/reducers/versions';
import log from 'amo/logger';
import { createErrorHandler, getState } from 'amo/sagas/utils';
import type { GetVersionParams, GetVersionsParams, GetVersionsResponse } from 'amo/api/versions';
import type { FetchVersionAction, FetchVersionsAction } from 'amo/reducers/versions';
import type { Saga } from 'amo/types/sagas';

export function* fetchVersion({
  payload: {
    errorHandlerId,
    slug,
    versionId,
  },
}: FetchVersionAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);
  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);
    const params: GetVersionParams = {
      api: state.api,
      slug,
      versionId,
    };
    const version = yield call(getVersion, params);
    yield put(loadVersions({
      slug,
      versions: [version],
    }));
  } catch (error) {
    log.warn(`Failed to fetch version: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}
export function* fetchVersions({
  payload: {
    errorHandlerId,
    page,
    slug,
  },
}: FetchVersionsAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);
  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);
    const params: GetVersionsParams = {
      api: state.api,
      page,
      slug,
    };
    const versions: GetVersionsResponse = yield call(getVersions, params);
    yield put(loadVersions({
      slug,
      versions: versions.results,
    }));
  } catch (error) {
    log.warn(`Failed to fetch versions: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}
export default function* collectionsSaga(): Saga {
  yield takeLatest(FETCH_VERSION, fetchVersion);
  yield takeLatest(FETCH_VERSIONS, fetchVersions);
}