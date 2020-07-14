/* @flow */
import { call, put, race, select, take, takeLatest } from 'redux-saga/effects';

import {
  AUTOCOMPLETE_CANCELLED,
  AUTOCOMPLETE_STARTED,
  autocompleteLoad,
} from 'core/reducers/autocomplete';
import { autocomplete as autocompleteApi } from 'core/api';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';
import type { AutocompleteParams } from 'core/api';
import type { Saga } from 'core/types/sagas';
import type { AutocompleteStartAction } from 'core/reducers/autocomplete';

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
