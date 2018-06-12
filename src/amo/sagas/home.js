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

  const state = yield select(getState);

  const collections = [];
  for (const collection of collectionsToFetch) {
    try {
      const result = yield call(getCollectionAddons, {
        api: state.api,
        page: 1,
        slug: collection.slug,
        username: collection.username,
      });
      collections.push(result);
    } catch (error) {
      if (error.response.status === 404) {
        // The collection was not found.
        collections.push(null);
      } else {
        log.warn(`Home add-ons failed to load: ${error}`);
        yield put(errorHandler.createErrorAction(error));
      }
    }
  }

  let featuredExtensions;
  let featuredThemes;

  try {
    featuredExtensions = yield call(searchApi, {
      api: state.api,
      filters: {
        addonType: ADDON_TYPE_EXTENSION,
        featured: true,
        page_size: LANDING_PAGE_ADDON_COUNT,
        sort: SEARCH_SORT_RANDOM,
      },
      page: 1,
    });
  } catch (error) {
    log.warn(`Home add-ons failed to load: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }

  try {
    featuredThemes = yield call(searchApi, {
      api: state.api,
      filters: {
        addonType: ADDON_TYPE_THEME,
        featured: true,
        page_size: LANDING_PAGE_ADDON_COUNT,
        sort: SEARCH_SORT_RANDOM,
      },
      page: 1,
    });
  } catch (error) {
    log.warn(`Home add-ons failed to load: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }

  yield put(loadHomeAddons({
    collections,
    featuredExtensions,
    featuredThemes,
  }));
}

export default function* homeSaga() {
  yield takeLatest(FETCH_HOME_ADDONS, fetchHomeAddons);
}
