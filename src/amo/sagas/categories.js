// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
/* eslint-disable import/order */
import { hideLoading, showLoading } from 'react-redux-loading-bar';
import { call, put, select, takeEvery } from 'redux-saga/effects';
/* eslint-enable import/order */

import {
  categoriesFail,
  categoriesLoad,
} from 'core/actions/categories';
import { categories as categoriesApi } from 'core/api';
import { CATEGORIES_FETCH } from 'core/constants';
import log from 'core/logger';
import { getApi } from 'core/sagas/utils';


export function* fetchCategories() {
  try {
    yield put(showLoading());
    const api = yield select(getApi);
    const response = yield call(categoriesApi, { api });
    yield put(categoriesLoad(response));
  } catch (err) {
    log.warn('Categories failed to load:', err);
    yield put(categoriesFail(err));
  } finally {
    yield put(hideLoading());
  }
}

// Starts fetchUser on each dispatched `categoriesFetch` action.
// Allows concurrent fetches of categoriesFetch.
export default function* categoriesSaga() {
  yield takeEvery(CATEGORIES_FETCH, fetchCategories);
}
