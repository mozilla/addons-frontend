import { hideLoading, showLoading } from 'react-redux-loading-bar';
import { call, put, select, takeEvery } from 'redux-saga/effects';

import { loadFeatured } from 'amo/actions/featured';
import { FEATURED_ADDONS_TO_LOAD } from 'amo/constants';
import { featured as featuredApi } from 'core/api';
import { FEATURED_GET } from 'core/constants';
import log from 'core/logger';
import { getApi } from 'core/sagas/utils';


export function* fetchFeaturedAddons(action) {
  const { addonType } = action.payload;
  try {
    yield put(showLoading());
    const api = yield select(getApi);
    const filters = { addonType, page_size: FEATURED_ADDONS_TO_LOAD };
    // yield new Promise((resolve) => setTimeout(resolve, 4000));
    const response = yield call(featuredApi, { api, filters });
    yield put(loadFeatured({
      addonType,
      entities: response.entities,
      result: response.result,
    }));
  } catch (error) {
    log.warn('Could not fetch featured add-ons:', error);
    // TODO: dispatch error state
    throw error;
    // yield put(categoriesFail(err));
  } finally {
    yield put(hideLoading());
  }
}

export default function* featuredSaga() {
  yield takeEvery(FEATURED_GET, fetchFeaturedAddons);
}
