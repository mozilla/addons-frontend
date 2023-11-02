/* @flow */
import { call, put, select, takeLatest } from 'redux-saga/effects';

import { getHomeShelves } from 'amo/api/homeShelves';
import { search as searchApi } from 'amo/api/search';
import {
  ADDON_TYPE_EXTENSION,
  MOBILE_HOME_PAGE_RECOMMENDED_EXTENSIONS_COUNT,
  MOBILE_HOME_PAGE_TRENDING_EXTENSIONS_COUNT,
  RECOMMENDED,
  SEARCH_SORT_RANDOM,
  SEARCH_SORT_TRENDING,
} from 'amo/constants';
import log from 'amo/logger';
import {
  FETCH_HOME_DATA,
  abortFetchHomeData,
  loadHomeData,
} from 'amo/reducers/home';
import { createErrorHandler, getState } from 'amo/sagas/utils';
import type { SearchParams } from 'amo/api/search';
import type { FetchHomeDataAction } from 'amo/reducers/home';
import type { Saga } from 'amo/types/sagas';

export function* fetchHomeData({
  payload: { errorHandlerId, isDesktopSite },
}: FetchHomeDataAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  const state = yield select(getState);

  try {
    if (isDesktopSite) {
      let homeShelves = null;
      try {
        homeShelves = yield call(getHomeShelves, { api: state.api });
      } catch (error) {
        log.warn(`Home shelves failed to load: ${error}`);
        throw error;
      }

      yield put(loadHomeData({ homeShelves, shelves: {} }));
    } else {
      // Mobile homepage logic, which does not fetch the home shelves since
      // they aren't app-specific at the moment, and we want a completely
      // different homepage on Android vs. Desktop.
      const recommendedExtensionsParams: SearchParams = {
        api: state.api,
        filters: {
          addonType: ADDON_TYPE_EXTENSION,
          page_size: String(MOBILE_HOME_PAGE_RECOMMENDED_EXTENSIONS_COUNT),
          promoted: RECOMMENDED,
          sort: SEARCH_SORT_RANDOM,
        },
      };
      const trendingExtensionsParams: SearchParams = {
        api: state.api,
        filters: {
          addonType: ADDON_TYPE_EXTENSION,
          page_size: String(MOBILE_HOME_PAGE_TRENDING_EXTENSIONS_COUNT),
          sort: SEARCH_SORT_TRENDING,
        },
      };

      let recommendedExtensions;
      let trendingExtensions;
      try {
        recommendedExtensions = yield call(
          searchApi,
          recommendedExtensionsParams,
        );
        trendingExtensions = yield call(searchApi, trendingExtensionsParams);
      } catch (error) {
        log.warn(`Mobile homepage add-ons failed to load: ${error}`);
        throw error;
      }

      yield put(
        loadHomeData({
          homeShelves: null,
          shelves: { recommendedExtensions, trendingExtensions },
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
