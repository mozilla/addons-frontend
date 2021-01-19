/* @flow */
import { oneLine } from 'common-tags';
import { all, call, put, select, takeLatest } from 'redux-saga/effects';

import { getCollectionAddons } from 'amo/api/collections';
import { getHeroShelves } from 'amo/api/hero';
import {
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
  MOBILE_HOME_PAGE_EXTENSION_COUNT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  RECOMMENDED,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_RANDOM,
  SEARCH_SORT_TRENDING,
} from 'amo/constants';
import {
  FETCH_HOME_DATA,
  abortFetchHomeData,
  loadHomeData,
} from 'amo/reducers/home';
import { search as searchApi } from 'amo/api/search';
import log from 'amo/logger';
import { createErrorHandler, getState } from 'amo/sagas/utils';
import type { GetCollectionAddonsParams } from 'amo/api/collections';
import type { FetchHomeDataAction } from 'amo/reducers/home';
import type { SearchParams } from 'amo/api/search';
import type { Saga } from 'amo/types/sagas';

export function* fetchHomeData({
  payload: {
    collectionsToFetch,
    errorHandlerId,
    includeRecommendedThemes,
    includeTrendingExtensions,
    isDesktopSite,
  },
}: FetchHomeDataAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  const state = yield select(getState);

  const recommendedSearchFilters = {
    page_size: String(
      isDesktopSite
        ? LANDING_PAGE_EXTENSION_COUNT
        : MOBILE_HOME_PAGE_EXTENSION_COUNT,
    ),
    promoted: RECOMMENDED,
    sort: SEARCH_SORT_RANDOM,
  };
  const recommendedExtensionsParams: SearchParams = {
    api: state.api,
    filters: {
      addonType: ADDON_TYPE_EXTENSION,
      ...recommendedSearchFilters,
    },
  };

  try {
    let heroShelves = null;
    try {
      heroShelves = yield call(getHeroShelves, { api: state.api });
    } catch (error) {
      log.warn(`Home hero shelves failed to load: ${error}`);
      throw error;
    }

    if (isDesktopSite) {
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
          if (
            error.response &&
            [401, 403, 404].includes(error.response.status)
          ) {
            // The collection was not found or is marked private.
            collections.push(null);
          } else {
            throw error;
          }
        }
      }

      const recommendedThemesParams: SearchParams = {
        api: state.api,
        filters: {
          addonType: ADDON_TYPE_STATIC_THEME,
          ...recommendedSearchFilters,
          page_size: String(LANDING_PAGE_THEME_COUNT),
        },
      };
      const popularExtensionsParams: SearchParams = {
        api: state.api,
        filters: {
          addonType: ADDON_TYPE_EXTENSION,
          page_size: String(LANDING_PAGE_EXTENSION_COUNT),
          promoted: RECOMMENDED,
          sort: SEARCH_SORT_POPULAR,
        },
      };
      const popularThemesParams: SearchParams = {
        api: state.api,
        filters: {
          addonType: ADDON_TYPE_STATIC_THEME,
          page_size: String(LANDING_PAGE_THEME_COUNT),
          sort: SEARCH_SORT_POPULAR,
        },
      };
      const trendingExtensionsParams: SearchParams = {
        api: state.api,
        filters: {
          addonType: ADDON_TYPE_EXTENSION,
          page_size: String(LANDING_PAGE_EXTENSION_COUNT),
          promoted: RECOMMENDED,
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
          popularExtensions: call(searchApi, popularExtensionsParams),
          popularThemes: call(searchApi, popularThemesParams),
          trendingExtensions: includeTrendingExtensions
            ? call(searchApi, trendingExtensionsParams)
            : null,
        });
      } catch (error) {
        log.warn(`Home add-ons failed to load: ${error}`);
        throw error;
      }

      yield put(
        loadHomeData({
          collections,
          heroShelves,
          shelves,
        }),
      );
    } else {
      // Mobile homepage logic.
      let recommendedExtensions;
      try {
        recommendedExtensions = yield call(
          searchApi,
          recommendedExtensionsParams,
        );
      } catch (error) {
        log.warn(`Home add-ons failed to load: ${error}`);
        throw error;
      }

      yield put(
        loadHomeData({
          collections: [],
          heroShelves,
          shelves: { recommendedExtensions },
        }),
      );
    }
  } catch (error) {
    yield put(errorHandler.createErrorAction(error));
    yield put(abortFetchHomeData());
  }
}

export default function* homeSaga(): Saga {
  yield takeLatest(FETCH_HOME_DATA, fetchHomeData);
}
