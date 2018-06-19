import { call, put, select, takeEvery } from 'redux-saga/effects';
import { SEARCH_SORT_TRENDING } from 'core/constants';
import {
  FETCH_ADDONS_BY_AUTHORS,
  loadAddonsByAuthors,
} from 'amo/reducers/addonsByAuthors';
import { search as searchApi } from 'core/api/search';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';
import { getAddonTypeFilter } from 'core/utils';

export function* fetchAddonsByAuthors({ payload }) {
  const {
    addonType,
    authorUsernames,
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

    const response = yield call(searchApi, {
      api: state.api,
      filters: {
        addonType: getAddonTypeFilter(addonType),
        author: authorUsernames.sort().join(','),
        exclude_addons: forAddonSlug,
        page: page || 1,
        page_size: pageSize,
        sort: sort || SEARCH_SORT_TRENDING,
      },
    });

    // TODO: remove the line below and pass `response.addons` directly once
    // https://github.com/mozilla/addons-frontend/issues/2917 is done.
    const addons = Object.values(response.entities.addons || {});
    const { count } = response.result;

    yield put(
      loadAddonsByAuthors({
        addonType,
        addons,
        authorUsernames,
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

export default function* addonsByAuthorsSaga() {
  yield takeEvery(FETCH_ADDONS_BY_AUTHORS, fetchAddonsByAuthors);
}
