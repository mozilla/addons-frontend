/* @flow */
import { call, put, select, takeLatest } from 'redux-saga/effects';

import log from 'core/logger';
import { loadAddon } from 'core/reducers/addons';
import { createErrorHandler, getState } from 'core/sagas/utils';
import {
  GET_DISCO_RESULTS,
  createExternalAddonMap,
  loadDiscoResults,
} from 'disco/reducers/discoResults';
import { getDiscoveryAddons } from 'disco/api';
import type {
  ExternalDiscoResultsType,
  GetDiscoResultsAction,
} from 'disco/reducers/discoResults';
import type { Saga } from 'core/types/sagas';

export function* fetchDiscoveryAddons({
  payload: { errorHandlerId, taarParams },
}: GetDiscoResultsAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);

  try {
    const state = yield select(getState);

    const { results }: ExternalDiscoResultsType = yield call(
      getDiscoveryAddons,
      {
        api: state.api,
        taarParams,
      },
    );

    const addons = createExternalAddonMap({ results });

    for (const addon of addons) {
      yield put(loadAddon({ addon }));
    }

    yield put(loadDiscoResults({ results }));
  } catch (error) {
    log.warn(`Failed to fetch discovery add-ons: ${error}`);

    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* discoSaga(): Saga {
  yield takeLatest(GET_DISCO_RESULTS, fetchDiscoveryAddons);
}
