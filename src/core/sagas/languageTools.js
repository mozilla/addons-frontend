/* @flow */
import { call, put, select, takeLatest } from 'redux-saga/effects';

import { languageTools as languageToolsApi } from 'core/api/languageTools';
import log from 'core/logger';
import {
  FETCH_LANGUAGE_TOOLS,
  loadLanguageTools,
} from 'core/reducers/languageTools';
import { createErrorHandler, getState } from 'core/sagas/utils';
import type { LanguageToolsParams } from 'core/api/languageTools';
import type { FetchLanguageToolsAction } from 'core/reducers/languageTools';
import type { Saga } from 'core/types/sagas';

export function* fetchLanguageTools({
  payload: { errorHandlerId },
}: FetchLanguageToolsAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: LanguageToolsParams = { api: state.api };
    const response = yield call(languageToolsApi, params);

    yield put(loadLanguageTools({ languageTools: response.results }));
  } catch (error) {
    log.warn(`Loading Language tools failed: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* languageToolsSaga(): Saga {
  yield takeLatest(FETCH_LANGUAGE_TOOLS, fetchLanguageTools);
}
