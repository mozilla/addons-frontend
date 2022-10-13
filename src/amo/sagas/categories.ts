import { call, put, select, takeEvery } from 'redux-saga/effects';

import { getCategories } from 'amo/api/categories';
import log from 'amo/logger';
import { FETCH_CATEGORIES, loadCategories } from 'amo/reducers/categories';
import { createErrorHandler, getState } from 'amo/sagas/utils';
import type { GetCategoriesParams } from 'amo/api/categories';
import type { FetchCategoriesAction } from 'amo/reducers/categories';
import type { Saga } from 'amo/types/sagas';

export function* fetchCategories({
  payload: {
    errorHandlerId,
  },
}: FetchCategoriesAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);

  try {
    const state = yield select(getState);
    const params: GetCategoriesParams = {
      api: state.api,
    };
    const results = yield call(getCategories, params);
    yield put(loadCategories({
      results,
    }));
  } catch (error) {
    log.warn(`Categories failed to load: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
} // Starts fetchUser on each dispatched `fetchCategories` action.
// Allows concurrent fetches of fetchCategories.

export default function* categoriesSaga(): Saga {
  yield takeEvery(FETCH_CATEGORIES, fetchCategories);
}