/* @flow */
import { call, put, select, takeLatest } from 'redux-saga/effects';
import { getVersions } from 'amo/api/versions';
import { FETCH_VERSIONS, loadVersions } from 'amo/reducers/versions';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';
import type { GetVersionsParams } from 'amo/api/versions';
import type { FetchVersionsAction } from 'amo/reducers/versions';

export function* fetchVersions({
  payload: { errorHandlerId, page, slug },
}: FetchVersionsAction): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: GetVersionsParams = {
      api: state.api,
      page,
      slug,
    };
    const versions = yield call(getVersions, params);

    yield put(loadVersions({ slug, versions }));
  } catch (error) {
    log.warn(`Failed to fetch versions: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* collectionsSaga(): Generator<any, any, any> {
  yield takeLatest(FETCH_VERSIONS, fetchVersions);
}
