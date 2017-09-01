// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
/* eslint-disable import/order */
import { call, put, race, select, take, takeLatest } from 'redux-saga/effects';
/* eslint-enable import/order */

import {
  AUTOCOMPLETE_CANCELLED,
  AUTOCOMPLETE_STARTED,
  autocompleteLoad,
} from 'core/reducers/autocomplete';
import { autocomplete as autocompleteApi } from 'core/api';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';

export function* fetchAutocompleteResults({ payload }) {
  const { errorHandlerId } = payload;
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const { filters } = payload;

    const state = yield select(getState);

    const response = yield call(autocompleteApi, {
      api: state.api,
      filters,
    });
    const { results } = response;

    yield put(autocompleteLoad({ results }));
  } catch (error) {
    log.warn(`Autcomplete results failed to load: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* autocompleteSaga() {
  yield takeLatest(AUTOCOMPLETE_STARTED, function* fetchOrCancel(...args) {
    yield race({
      fetch: call(fetchAutocompleteResults, ...args),
      cancel: take(AUTOCOMPLETE_CANCELLED),
    });
  });
}
