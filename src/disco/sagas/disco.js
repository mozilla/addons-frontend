// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
/* eslint-disable import/order */
import { call, put, select, takeLatest } from 'redux-saga/effects';
/* eslint-enable import/order */

import { loadAddons } from 'core/reducers/addons';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';
import { loadDiscoResults } from 'disco/actions';
import { GET_DISCO_RESULTS } from 'disco/constants';
import { getDiscoveryAddons } from 'disco/api';


export function* fetchDiscoveryAddons({
  payload: { errorHandlerId, platform, telemetryClientId },
}) {
  const errorHandler = createErrorHandler(errorHandlerId);
  try {
    const state = yield select(getState);
    const { entities, result } = yield call(getDiscoveryAddons, {
      api: state.api, platform, telemetryClientId,
    });

    yield put(loadAddons(entities));
    yield put(loadDiscoResults({ entities, result }));
  } catch (error) {
    log.warn(`Failed to fetch discovery add-ons: ${error}`);

    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* discoSaga() {
  yield takeLatest(GET_DISCO_RESULTS, fetchDiscoveryAddons);
}
