/* @flow */
import { call, put, select, takeEvery } from 'redux-saga/effects';

import { categories as categoriesApi } from 'core/api';
import log from 'core/logger';
import { CATEGORIES_FETCH, categoriesLoad } from 'core/reducers/categories';
import { createErrorHandler, getState } from 'core/sagas/utils';
import type { CategoriesParams } from 'core/api';
import type { CategoriesFetchAction } from 'core/reducers/categories';
import type { Saga } from 'core/types/sagas';

export function* fetchCategories({
  payload: { errorHandlerId },
}: CategoriesFetchAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);
  try {
    const state = yield select(getState);

    const params: CategoriesParams = { api: state.api };
    const results = yield call(categoriesApi, params);

    yield put(categoriesLoad({ results }));
  } catch (error) {
    log.warn(`Categories failed to load: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

// Starts fetchUser on each dispatched `categoriesFetch` action.
// Allows concurrent fetches of categoriesFetch.
export default function* categoriesSaga(): Saga {
  yield takeEvery(CATEGORIES_FETCH, fetchCategories);
}
