import { all, call, put, select, takeLatest } from 'redux-saga/effects';
import { getCollectionAddons } from 'amo/api/collections';
import { LANDING_PAGE_ADDON_COUNT } from 'amo/constants';
import {
  FETCH_HOME_ADDONS,
  loadHomeAddons,
} from 'amo/reducers/home';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  SEARCH_SORT_RANDOM,
  SEARCH_SORT_TRENDING,
} from 'core/constants';
import { search as searchApi } from 'core/api/search';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';


export function* fetchHomeAddons({
  payload: {
    errorHandlerId,
    firstCollectionSlug,
    firstCollectionUser,
    secondCollectionSlug,
    secondCollectionUser,
  },
}) {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const {
      firstCollection,
      secondCollection,
      featuredThemes,
      upAndComingExtensions,
    } = yield all({
      firstCollection: call(getCollectionAddons, {
        api: state.api,
        page: 1,
        slug: firstCollectionSlug,
        user: firstCollectionUser,
      }),
      secondCollection: call(getCollectionAddons, {
        api: state.api,
        page: 1,
        slug: secondCollectionSlug,
        user: secondCollectionUser,
      }),
      featuredThemes: call(searchApi, {
        api: state.api,
        filters: {
          addonType: ADDON_TYPE_THEME,
          featured: true,
          page_size: LANDING_PAGE_ADDON_COUNT,
          sort: SEARCH_SORT_RANDOM,
        },
        page: 1,
      }),
      upAndComingExtensions: call(searchApi, {
        api: state.api,
        filters: {
          addonType: ADDON_TYPE_EXTENSION,
          page_size: LANDING_PAGE_ADDON_COUNT,
          sort: SEARCH_SORT_TRENDING,
        },
        page: 1,
      }),
    });

    yield put(loadHomeAddons({
      firstCollection,
      secondCollection,
      featuredThemes,
      upAndComingExtensions,
    }));
  } catch (error) {
    log.warn(`Home add-ons failed to load: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* homeSaga() {
  yield takeLatest(FETCH_HOME_ADDONS, fetchHomeAddons);
}
