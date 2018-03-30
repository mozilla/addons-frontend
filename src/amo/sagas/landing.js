// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
/* eslint-disable import/order */
import { oneLine } from 'common-tags';
import { all, call, put, select, takeLatest } from 'redux-saga/effects';
/* eslint-enable import/order */

import { loadLanding } from 'amo/actions/landing';
import { LANDING_PAGE_ADDON_COUNT } from 'amo/constants';
import { search as searchApi } from 'core/api/search';
import {
  LANDING_GET,
  SEARCH_SORT_RANDOM,
  SEARCH_SORT_TRENDING,
  SEARCH_SORT_TOP_RATED,
} from 'core/constants';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';


export function* fetchLandingAddons(
  { payload: { addonType, category, errorHandlerId } }
) {
  const errorHandler = createErrorHandler(errorHandlerId);
  try {
    const state = yield select(getState);
    const { api } = state;
    const filters = {
      addonType,
      page_size: LANDING_PAGE_ADDON_COUNT,
    };

    if (category) {
      filters.category = category;
    }

    const [featured, highlyRated, trending] = yield all([
      call(searchApi, {
        api,
        filters: {
          ...filters,
          featured: true,
          sort: SEARCH_SORT_RANDOM,
        },
        page: 1,
      }),
      call(searchApi, {
        api,
        filters: { ...filters, sort: SEARCH_SORT_TOP_RATED },
        page: 1,
      }),
      call(searchApi, {
        api,
        filters: { ...filters, sort: SEARCH_SORT_TRENDING },
        page: 1,
      }),
    ]);

    yield put(loadLanding({
      addonType, featured, highlyRated, trending,
    }));
  } catch (error) {
    log.warn(oneLine`Failed to fetch landing page add-ons for
      addonType ${addonType}: ${error}`);

    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* landingSaga() {
  yield takeLatest(LANDING_GET, fetchLandingAddons);
}
