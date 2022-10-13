import { call, put, select, takeLatest } from 'redux-saga/effects';

import { languageTools as languageToolsApi } from 'amo/api/languageTools';
import log from 'amo/logger';
import { FETCH_LANGUAGE_TOOLS, loadLanguageTools } from 'amo/reducers/languageTools';
import { createErrorHandler, getState } from 'amo/sagas/utils';
import type { LanguageToolsParams } from 'amo/api/languageTools';
import type { FetchLanguageToolsAction } from 'amo/reducers/languageTools';
import type { Saga } from 'amo/types/sagas';

export function* fetchLanguageTools({
  payload: {
    errorHandlerId,
  },
}: FetchLanguageToolsAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);
  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);
    const params: LanguageToolsParams = {
      api: state.api,
    };
    const response = yield call(languageToolsApi, params);
    yield put(loadLanguageTools({
      languageTools: response.results,
    }));
  } catch (error) {
    log.warn(`Loading Language tools failed: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}
export default function* languageToolsSaga(): Saga {
  yield takeLatest(FETCH_LANGUAGE_TOOLS, fetchLanguageTools);
}