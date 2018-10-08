// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
/* eslint-disable import/order */
import { call, put, select, takeEvery } from 'redux-saga/effects';
/* eslint-enable import/order */

import { categoriesLoad } from 'core/actions/categories';
import { categories as categoriesApi } from 'core/api';
import { CATEGORIES_FETCH } from 'core/constants';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';

export function* fetchCategories({ payload: { errorHandlerId } }) {
  const errorHandler = createErrorHandler(errorHandlerId);
  try {
    const state = yield select(getState);

    const results = yield call(categoriesApi, { api: state.api });

    yield put(categoriesLoad({ results }));
  } catch (error) {
    log.warn('Categories failed to load:', error);
    yield put(errorHandler.createErrorAction(error));
  }
}

// Starts fetchUser on each dispatched `categoriesFetch` action.
// Allows concurrent fetches of categoriesFetch.
export default function* categoriesSaga() {
  yield takeEvery(CATEGORIES_FETCH, fetchCategories);
}
