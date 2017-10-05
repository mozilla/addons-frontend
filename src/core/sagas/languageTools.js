// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
/* eslint-disable import/order */
import { call, put, select, takeLatest } from 'redux-saga/effects';
/* eslint-enable import/order */

import { languageTools as languageToolsApi } from 'core/api/languageTools';
import log from 'core/logger';
import {
  FETCH_LANGUAGE_TOOLS,
  loadAddonResults,
} from 'core/reducers/addons';
import { createErrorHandler, getState } from 'core/sagas/utils';


export function* fetchLanguageTools({
  payload: { errorHandlerId },
}) {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const response = yield call(languageToolsApi, { api: state.api });

    yield put(loadAddonResults({ addons: response.results }));
  } catch (error) {
    log.warn(`Loading Language tools failed: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* languageToolsSaga() {
  yield takeLatest(FETCH_LANGUAGE_TOOLS, fetchLanguageTools);
}
