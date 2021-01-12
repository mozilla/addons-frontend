/* @flow */
import { call, put, race, select, take, takeLatest } from 'redux-saga/effects';

import {
  AUTOCOMPLETE_CANCELLED,
  AUTOCOMPLETE_STARTED,
  autocompleteLoad,
} from 'amo/reducers/autocomplete';
import { autocomplete as autocompleteApi } from 'amo/api';
import log from 'amo/logger';
import { createErrorHandler, getState } from 'amo/sagas/utils';
import type { AutocompleteParams } from 'amo/api';
import type { Saga } from 'amo/types/sagas';
import type { AutocompleteStartAction } from 'amo/reducers/autocomplete';

export function* fetchAutocompleteResults({
  payload,
}: AutocompleteStartAction): Saga {
  const { errorHandlerId } = payload;
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const { filters } = payload;

    const state = yield select(getState);

    const params: AutocompleteParams = {
      api: state.api,
      filters,
    };
    const { results } = yield call(autocompleteApi, params);

    yield put(autocompleteLoad({ results }));
  } catch (error) {
    log.warn(`Autcomplete results failed to load: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* autocompleteSaga(): Saga {
  yield takeLatest(AUTOCOMPLETE_STARTED, function* fetchOrCancel(...args) {
    yield race({
      fetch: call(fetchAutocompleteResults, ...args),
      cancel: take(AUTOCOMPLETE_CANCELLED),
    });
  });
}
