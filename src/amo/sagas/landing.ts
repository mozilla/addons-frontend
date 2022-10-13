import { oneLine } from 'common-tags';
import { all, call, put, select, takeLatest } from 'redux-saga/effects';

import { GET_LANDING, loadLanding } from 'amo/reducers/landing';
import { LANDING_PAGE_EXTENSION_COUNT, LANDING_PAGE_THEME_COUNT, ADDON_TYPE_EXTENSION, RECOMMENDED, SEARCH_SORT_RANDOM, SEARCH_SORT_TRENDING, SEARCH_SORT_TOP_RATED, ADDON_TYPE_STATIC_THEME } from 'amo/constants';
import { search as searchApi } from 'amo/api/search';
import log from 'amo/logger';
import { createErrorHandler, getState } from 'amo/sagas/utils';
import type { GetLandingAction } from 'amo/reducers/landing';
import type { SearchParams } from 'amo/api/search';
import type { Saga } from 'amo/types/sagas';

export function* fetchLandingAddons({
  payload: {
    addonType,
    category,
    errorHandlerId,
  },
}: GetLandingAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);

  try {
    const {
      api,
    } = yield select(getState);
    let filters = {
      addonType,
      page_size: ADDON_TYPE_STATIC_THEME === addonType ? String(LANDING_PAGE_THEME_COUNT) : String(LANDING_PAGE_EXTENSION_COUNT),
      promoted: addonType === ADDON_TYPE_EXTENSION ? RECOMMENDED : undefined,
    };

    if (category) {
      filters = { ...filters,
        category,
      };
    }

    const recommendedParams: SearchParams = {
      api,
      filters: { ...filters,
        promoted: RECOMMENDED,
        sort: SEARCH_SORT_RANDOM,
        page: '1',
      },
    };
    const highlyRatedParams: SearchParams = {
      api,
      filters: { ...filters,
        sort: SEARCH_SORT_TOP_RATED,
        page: '1',
      },
    };
    const trendingParams: SearchParams = {
      api,
      filters: { ...filters,
        sort: SEARCH_SORT_TRENDING,
        page: '1',
      },
    };
    const [recommended, highlyRated, trending] = yield all([call(searchApi, recommendedParams), call(searchApi, highlyRatedParams), call(searchApi, trendingParams)]);
    yield put(loadLanding({
      addonType,
      recommended,
      highlyRated,
      trending,
    }));
  } catch (error) {
    log.warn(oneLine`Failed to fetch landing page add-ons for
      addonType ${addonType}: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}
export default function* landingSaga(): Saga {
  yield takeLatest(GET_LANDING, fetchLandingAddons);
}