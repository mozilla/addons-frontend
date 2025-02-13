/* @flow */
import { call, put, select, takeEvery } from 'redux-saga/effects';

import { SEARCH_SORT_POPULAR } from 'amo/constants';
import {
  FETCH_ADDONS_BY_AUTHORS,
  loadAddonsByAuthors,
} from 'amo/reducers/addonsByAuthors';
import { search as searchApi } from 'amo/api/search';
import log from 'amo/logger';
import { createErrorHandler, getState } from 'amo/sagas/utils';
import type { FetchAddonsByAuthorsAction } from 'amo/reducers/addonsByAuthors';
import type { SearchParams } from 'amo/api/search';
import type { Saga } from 'amo/types/sagas';

export function* fetchAddonsByAuthors({
  payload,
}: FetchAddonsByAuthorsAction): Saga {
  const {
    addonType,
    authorIds,
    errorHandlerId,
    forAddonSlug,
    page,
    pageSize,
    sort,
  } = payload;

  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: SearchParams = {
      api: state.api,
      filters: {
        addonType,
        author: authorIds.join(','),
        exclude_addons: forAddonSlug,
        page: page || '1',
        page_size: pageSize,
        sort: sort || SEARCH_SORT_POPULAR,
      },
    };
    const response = yield call(searchApi, params);

    const { count, results } = response;

    yield put(
      loadAddonsByAuthors({
        addonType,
        addons: results,
        authorIds,
        count,
        forAddonSlug,
        pageSize,
      }),
    );
  } catch (error) {
    log.warn(`Search for addons by authors results failed to load: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* addonsByAuthorsSaga(): Saga {
  yield takeEvery(FETCH_ADDONS_BY_AUTHORS, fetchAddonsByAuthors);
}
