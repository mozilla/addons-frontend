/* @flow */
import { call, put, select, takeLatest } from 'redux-saga/effects';
import log from 'core/logger';
import { loadAddons } from 'core/reducers/addons';
import { createErrorHandler, getState } from 'core/sagas/utils';
import {
  GET_DISCO_RESULTS,
  loadDiscoResults,
} from 'disco/reducers/discoResults';
import { getDiscoveryAddons } from 'disco/api';
import type {
  ExternalDiscoResultsType,
  GetDiscoResultsAction,
} from 'disco/reducers/discoResults';

export function* fetchDiscoveryAddons({
  payload: { errorHandlerId, taarParams },
}: GetDiscoResultsAction): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);

  try {
    const state = yield select(getState);

    const { entities, result }: ExternalDiscoResultsType = yield call(
      getDiscoveryAddons,
      {
        api: state.api,
        taarParams,
      },
    );

    yield put(loadAddons(entities));
    yield put(loadDiscoResults({ entities, result }));
  } catch (error) {
    log.warn(`Failed to fetch discovery add-ons: ${error}`);

    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* discoSaga(): Generator<any, any, any> {
  yield takeLatest(GET_DISCO_RESULTS, fetchDiscoveryAddons);
}
