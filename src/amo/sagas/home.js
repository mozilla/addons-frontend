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
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_RANDOM,
  SEARCH_SORT_TRENDING,
} from 'core/constants';
import { search as searchApi } from 'core/api/search';
import { getAddonTypeFilter } from 'core/utils';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';
import type { GetCollectionAddonsParams } from 'amo/api/collections';
import type { FetchHomeAddonsAction } from 'amo/reducers/home';
import type { SearchParams } from 'core/api/search';
import type { Saga } from 'core/types/sagas';

export function* fetchHomeAddons({
  payload: {
    collectionsToFetch,
    enableFeatureRecommendedBadges,
    errorHandlerId,
    includeRecommendedThemes,
    includeTrendingExtensions,
  },
}: FetchHomeAddonsAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  const state = yield select(getState);

  const collections = [];
  for (const collection of collectionsToFetch) {
    try {
      const params: GetCollectionAddonsParams = {
        api: state.api,
        slug: collection.slug,
        userId: collection.userId,
      };
      const result = yield call(getCollectionAddons, params);
      collections.push(result);
    } catch (error) {
      log.warn(
        oneLine`Home collection: ${collection.userId}/${collection.slug}
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

  const recommendedSearchFilters = {
    featured: enableFeatureRecommendedBadges ? undefined : true,
    recommended: enableFeatureRecommendedBadges ? true : undefined,
    page_size: String(LANDING_PAGE_EXTENSION_COUNT),
    sort: SEARCH_SORT_RANDOM,
  };
  const recommendedExtensionsParams: SearchParams = {
    api: state.api,
    filters: {
      addonType: ADDON_TYPE_EXTENSION,
      ...recommendedSearchFilters,
    },
  };
  const recommendedThemesParams: SearchParams = {
    api: state.api,
    filters: {
      addonType: getAddonTypeFilter(ADDON_TYPE_THEME),
      ...recommendedSearchFilters,
      page_size: String(LANDING_PAGE_THEME_COUNT),
    },
  };
  const popularAddonsParams: SearchParams = {
    api: state.api,
    filters: {
      addonType: getAddonTypeFilter(ADDON_TYPE_THEME),
      page_size: String(LANDING_PAGE_EXTENSION_COUNT),
      recommended: enableFeatureRecommendedBadges ? true : undefined,
      sort: SEARCH_SORT_POPULAR,
    },
  };
  const trendingExtensionsParams: SearchParams = {
    api: state.api,
    filters: {
      addonType: ADDON_TYPE_EXTENSION,
      page_size: String(LANDING_PAGE_EXTENSION_COUNT),
      recommended: enableFeatureRecommendedBadges ? true : undefined,
      sort: SEARCH_SORT_TRENDING,
    },
  };

  let shelves = {};
  try {
    shelves = yield all({
      recommendedExtensions: call(searchApi, recommendedExtensionsParams),
      recommendedThemes: includeRecommendedThemes
        ? call(searchApi, recommendedThemesParams)
        : null,
      popularAddons: call(searchApi, popularAddonsParams),
      trendingExtensions: includeTrendingExtensions
        ? call(searchApi, trendingExtensionsParams)
        : null,
    });
  } catch (error) {
    log.warn(`Home add-ons failed to load: ${error}`);
    yield put(errorHandler.createErrorAction(error));
    return;
  }

  yield put(
    loadHomeAddons({
      collections,
      shelves,
    }),
  );
}

export default function* homeSaga(): Saga {
  yield takeLatest(FETCH_HOME_ADDONS, fetchHomeAddons);
}
