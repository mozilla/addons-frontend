/* @flow */
import { call, put, select, takeEvery } from 'redux-saga/effects';

import { getCategories } from 'core/api/categories';
import log from 'core/logger';
import { FETCH_CATEGORIES, loadCategories } from 'core/reducers/categories';
import { createErrorHandler, getState } from 'core/sagas/utils';
import type { GetCategoriesParams } from 'core/api/categories';
import type { FetchCategoriesAction } from 'core/reducers/categories';
import type { Saga } from 'core/types/sagas';

export function* fetchCategories({
  payload: { errorHandlerId },
}: FetchCategoriesAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);
  try {
    const state = yield select(getState);

    const params: GetCategoriesParams = { api: state.api };
    const results = yield call(getCategories, params);

    yield put(loadCategories({ results }));
  } catch (error) {
    log.warn(`Categories failed to load: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

// Starts fetchUser on each dispatched `fetchCategories` action.
// Allows concurrent fetches of fetchCategories.
export default function* categoriesSaga(): Saga {
  yield takeEvery(FETCH_CATEGORIES, fetchCategories);
}
