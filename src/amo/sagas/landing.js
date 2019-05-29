/* @flow */
import { oneLine } from 'common-tags';
import { all, call, put, select, takeLatest } from 'redux-saga/effects';

import { GET_LANDING, loadLanding } from 'amo/reducers/landing';
import {
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
} from 'amo/constants';
import { search as searchApi } from 'core/api/search';
import {
  ADDON_TYPE_EXTENSION,
  SEARCH_SORT_RANDOM,
  SEARCH_SORT_TRENDING,
  SEARCH_SORT_TOP_RATED,
} from 'core/constants';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';
import { getAddonTypeFilter, isTheme } from 'core/utils';
import type { GetLandingAction } from 'amo/reducers/landing';
import type { SearchParams } from 'core/api/search';
import type { Saga } from 'core/types/sagas';

export function* fetchLandingAddons({
  payload: {
    addonType,
    category,
    enableFeatureRecommendedBadges,
    errorHandlerId,
  },
}: GetLandingAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);
  try {
    const { api } = yield select(getState);

    let filters = {
      addonType: getAddonTypeFilter(addonType),
      page_size: isTheme(addonType)
        ? String(LANDING_PAGE_THEME_COUNT)
        : String(LANDING_PAGE_EXTENSION_COUNT),
      recommended:
        addonType === ADDON_TYPE_EXTENSION && enableFeatureRecommendedBadges
          ? true
          : undefined,
    };

    if (category) {
      filters = { ...filters, category };
    }

    const featuredParams: SearchParams = {
      api,
      filters: {
        ...filters,
        featured: true,
        sort: SEARCH_SORT_RANDOM,
        page: '1',
      },
    };
    const highlyRatedParams: SearchParams = {
      api,
      filters: {
        ...filters,
        sort: SEARCH_SORT_TOP_RATED,
        page: '1',
      },
    };
    const trendingParams: SearchParams = {
      api,
      filters: {
        ...filters,
        sort: SEARCH_SORT_TRENDING,
        page: '1',
      },
    };

    const [featured, highlyRated, trending] = yield all([
      call(searchApi, featuredParams),
      call(searchApi, highlyRatedParams),
      call(searchApi, trendingParams),
    ]);

    yield put(
      loadLanding({
        addonType,
        featured,
        highlyRated,
        trending,
      }),
    );
  } catch (error) {
    log.warn(oneLine`Failed to fetch landing page add-ons for
      addonType ${addonType}: ${error}`);

    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* landingSaga(): Saga {
  yield takeLatest(GET_LANDING, fetchLandingAddons);
}
