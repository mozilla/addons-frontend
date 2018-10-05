/* @flow */
import { oneLine } from 'common-tags';

import { all, call, put, select, takeLatest } from 'redux-saga/effects';
import { getCollectionAddons } from 'amo/api/collections';
import {
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
} from 'amo/constants';
import { FETCH_HOME_ADDONS, loadHomeAddons } from 'amo/reducers/home';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  SEARCH_SORT_RANDOM,
  SEARCH_SORT_POPULAR,
} from 'core/constants';
import { search as searchApi } from 'core/api/search';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';
import type { GetCollectionAddonsParams } from 'amo/api/collections';
import type { FetchHomeAddonsAction } from 'amo/reducers/home';
import type { SearchParams } from 'core/api/search';
import { getAddonTypeFilter } from 'core/utils';

export function* fetchHomeAddons({
  payload: { collectionsToFetch, errorHandlerId, includeFeaturedThemes },
}: FetchHomeAddonsAction): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  const state = yield select(getState);

  const collections = [];
  for (const collection of collectionsToFetch) {
    try {
      const params: GetCollectionAddonsParams = {
        api: state.api,
        slug: collection.slug,
        username: collection.username,
      };
      const result = yield call(getCollectionAddons, params);
      collections.push(result);
    } catch (error) {
      log.warn(
        oneLine`Home collection: ${collection.username}/${collection.slug}
          failed to load: ${error}`,
      );
      if (error.response && [401, 404].includes(error.response.status)) {
        // The collection was not found or is marked private.
        collections.push(null);
      } else {
        yield put(errorHandler.createErrorAction(error));
        return;
      }
    }
  }

  const featuredSearchFilters = {
    featured: true,
    page_size: LANDING_PAGE_EXTENSION_COUNT,
    sort: SEARCH_SORT_RANDOM,
  };
  const featuredExtensionsParams: SearchParams = {
    api: state.api,
    filters: {
      addonType: ADDON_TYPE_EXTENSION,
      ...featuredSearchFilters,
    },
  };
  const featuredThemesParams: SearchParams = {
    api: state.api,
    filters: {
      addonType: getAddonTypeFilter(ADDON_TYPE_THEME),
      ...featuredSearchFilters,
      page_size: LANDING_PAGE_THEME_COUNT,
    },
  };
  const popularExtensionsParams: SearchParams = {
    api: state.api,
    filters: {
      addonType: ADDON_TYPE_EXTENSION,
      page_size: LANDING_PAGE_EXTENSION_COUNT,
      sort: SEARCH_SORT_POPULAR,
    },
  };

  let homeAddons = {};
  try {
    homeAddons = yield all({
      featuredExtensions: call(searchApi, featuredExtensionsParams),
      featuredThemes: includeFeaturedThemes
        ? call(searchApi, featuredThemesParams)
        : null,
      popularExtensions: call(searchApi, popularExtensionsParams),
    });
  } catch (error) {
    log.warn(`Home add-ons failed to load: ${error}`);
    yield put(errorHandler.createErrorAction(error));
    return;
  }

  yield put(
    loadHomeAddons({
      collections,
      featuredExtensions: homeAddons.featuredExtensions,
      featuredThemes: homeAddons.featuredThemes,
      popularExtensions: homeAddons.popularExtensions,
    }),
  );
}

export default function* homeSaga(): Generator<any, any, any> {
  yield takeLatest(FETCH_HOME_ADDONS, fetchHomeAddons);
}
