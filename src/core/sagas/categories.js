import { call, put, select, takeEvery } from 'redux-saga/effects';

import { categoriesLoad } from 'core/actions/categories';
import { categories as categoriesApi } from 'core/api';
import { CATEGORIES_FETCH } from 'core/constants';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';
import type { Saga } from 'core/types/sagas';

export function* fetchCategories({ payload: { errorHandlerId } }): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);
  try {
    const state = yield select(getState);

    const results = yield call(categoriesApi, { api: state.api });

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
