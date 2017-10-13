// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
/* eslint-disable import/order */
import { call, put, select, takeEvery } from 'redux-saga/effects';
/* eslint-enable import/order */

import { loadFeatured } from 'amo/actions/featured';
import { FEATURED_ADDONS_TO_LOAD } from 'amo/constants';
import { search as searchApi } from 'core/api/search';
import { FEATURED_GET, SEARCH_SORT_RANDOM } from 'core/constants';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';


export function* fetchFeaturedAddons(
  { payload: { errorHandlerId, addonType } }
) {
  const errorHandler = createErrorHandler(errorHandlerId);
  try {
    const state = yield select(getState);

    const response = yield call(searchApi, {
      api: state.api,
      filters: {
        addonType,
        featured: true,
        page_size: FEATURED_ADDONS_TO_LOAD,
        sort: SEARCH_SORT_RANDOM,
      },
      page: 1,
    });

    yield put(loadFeatured({
      addonType,
      entities: response.entities,
      result: response.result,
    }));
  } catch (error) {
    log.warn(
      `Failed to fetch featured add-ons for addonType ${addonType}: ${error}`);

    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* featuredSaga() {
  yield takeEvery(FEATURED_GET, fetchFeaturedAddons);
}
