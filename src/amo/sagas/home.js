import { all, call, put, select, takeLatest } from 'redux-saga/effects';
import { getCollectionAddons } from 'amo/api/collections';
import { LANDING_PAGE_ADDON_COUNT } from 'amo/constants';
import {
  FETCH_HOME_ADDONS,
  loadHomeAddons,
} from 'amo/reducers/home';
import {
  ADDON_TYPE_EXTENSION,
  SEARCH_SORT_POPULAR,
} from 'core/constants';
import { search as searchApi } from 'core/api/search';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';


export function* fetchHomeAddons({
  payload: {
    errorHandlerId,
    featuredCollectionSlug,
    featuredCollectionUser,
  },
}) {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const {
      popularExtensions,
      featuredCollection,
    } = yield all({
      popularExtensions: call(searchApi, {
        api: state.api,
        filters: {
          addonType: ADDON_TYPE_EXTENSION,
          page_size: LANDING_PAGE_ADDON_COUNT,
          sort: SEARCH_SORT_POPULAR,
        },
        page: 1,
      }),
      featuredCollection: call(getCollectionAddons, {
        api: state.api,
        page: 1,
        slug: featuredCollectionSlug,
        user: featuredCollectionUser,
      }),
    });

    yield put(loadHomeAddons({
      popularExtensions,
      featuredCollection,
    }));
  } catch (error) {
    log.warn(`Home add-ons failed to load: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* homeSaga() {
  yield takeLatest(FETCH_HOME_ADDONS, fetchHomeAddons);
}
