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
} from 'core/constants';
import { search as searchApi } from 'core/api/search';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';


export function* fetchHomeAddons({
  payload: {
    errorHandlerId,
    collectionsToFetch,
  },
}) {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const collections = [];
    for (const collection of collectionsToFetch) {
      const result = yield call(getCollectionAddons, {
        api: state.api,
        page: 1,
        slug: collection.slug,
        username: collection.username,
      });
      collections.push(result);
    }

    const {
      featuredExtensions,
      featuredThemes,
    } = yield all({
      featuredExtensions: call(searchApi, {
        api: state.api,
        filters: {
          addonType: ADDON_TYPE_EXTENSION,
          featured: true,
          page_size: LANDING_PAGE_ADDON_COUNT,
          sort: SEARCH_SORT_RANDOM,
        },
        page: 1,
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
    });

    yield put(loadHomeAddons({
      collections,
      featuredExtensions,
      featuredThemes,
    }));
  } catch (error) {
    log.warn(`Home add-ons failed to load: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* homeSaga() {
  yield takeLatest(FETCH_HOME_ADDONS, fetchHomeAddons);
}
