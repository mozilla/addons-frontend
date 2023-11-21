/* @flow */
import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import config from 'config';

import { ADDON_TYPE_EXTENSION } from 'amo/constants';
import { getAddonInfo } from 'amo/api/addonInfo';
import { fetchAddon as fetchAddonFromApi } from 'amo/api';
import {
  FETCH_ADDON,
  FETCH_ADDON_INFO,
  loadAddonInfo,
  loadAddon,
} from 'amo/reducers/addons';
import log from 'amo/logger';
import { createErrorHandler, getState } from 'amo/sagas/utils';
import type {
  ExternalAddonInfoType,
  GetAddonInfoParams,
} from 'amo/api/addonInfo';
import type { AppState } from 'amo/store';
import type { FetchAddonParams } from 'amo/api';
import type {
  FetchAddonAction,
  FetchAddonInfoAction,
} from 'amo/reducers/addons';
import type { Saga } from 'amo/types/sagas';
import type { ExternalAddonType } from 'amo/types/addons';

export const ADDON_STATUS_UNKNOWN_NON_PUBLIC = 'unknown-non-public';

export const makeNonPublicAddon = (slug: string): ExternalAddonType => {
  const defaultLocale = config.get('defaultLang');
  return {
    slug,
    // This isn't going to be a numeric ID but that should still be fine.
    id: (slug: any),
    guid: slug,
    name: {
      [defaultLocale]: slug,
    },
    default_locale: defaultLocale,
    homepage: null,
    contributions_url: null,
    url: '',
    average_daily_users: 0,
    weekly_downloads: 0,
    tags: [],
    support_url: null,
    ratings: {
      average: 0,
      bayesian_average: 0,
      count: 0,
      grouped_counts: {
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
      },
      text_count: 0,
    },
    // Assume extension.
    type: ADDON_TYPE_EXTENSION,
    promoted: null,
    created: new Date(0),
    last_updated: null,
    // Mark the add-on as non-public.
    status: ADDON_STATUS_UNKNOWN_NON_PUBLIC,
  };
};

export function* fetchAddon({
  payload: { errorHandlerId, showGroupedRatings, slug, assumeNonPublic },
}: FetchAddonAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);
  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: FetchAddonParams = {
      api: state.api,
      showGroupedRatings,
      slug,
    };
    const addon = yield call(fetchAddonFromApi, params);

    yield put(loadAddon({ addon, slug }));
  } catch (error) {
    log.warn(`Failed to load add-on with slug ${slug}: ${error}`);

    if ([401, 403, 404].includes(error.response?.status) && assumeNonPublic) {
      log.warn('Assuming we attempted to fetch a non-public add-on');
      yield put(loadAddon({ addon: makeNonPublicAddon(slug), slug }));
    } else {
      yield put(errorHandler.createErrorAction(error));
    }
  }
}

export function* fetchAddonInfo({
  payload: { errorHandlerId, slug },
}: FetchAddonInfoAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state: AppState = yield select(getState);

    const params: GetAddonInfoParams = {
      api: state.api,
      slug,
    };
    const info: ExternalAddonInfoType = yield call(getAddonInfo, params);

    yield put(loadAddonInfo({ slug, info }));
  } catch (error) {
    log.warn(`Failed to fetch add-on info: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* addonsSaga(): Saga {
  yield takeEvery(FETCH_ADDON, fetchAddon);
  yield takeLatest(FETCH_ADDON_INFO, fetchAddonInfo);
}
