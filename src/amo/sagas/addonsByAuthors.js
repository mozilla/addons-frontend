import { call, put, select, takeEvery } from 'redux-saga/effects';
import { ADDON_TYPE_THEMES_FILTER, SEARCH_SORT_TRENDING } from 'core/constants';
import {
  EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
  FETCH_ADDONS_BY_AUTHORS,
  THEMES_BY_AUTHORS_PAGE_SIZE,
  loadAddonsByAuthors,
} from 'amo/reducers/addonsByAuthors';
import { search as searchApi } from 'core/api/search';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';


export function* fetchAddonsByAuthors({ payload }) {
  const { errorHandlerId, authorUsernames, addonType, forAddonSlug } = payload;
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);
    const pageSize = addonType === ADDON_TYPE_THEMES_FILTER ?
      THEMES_BY_AUTHORS_PAGE_SIZE : EXTENSIONS_BY_AUTHORS_PAGE_SIZE;
    const response = yield call(searchApi, {
      api: state.api,
      filters: {
        addonType,
        author: authorUsernames.sort().join(','),
        exclude_addons: forAddonSlug,
        page_size: pageSize,
        sort: SEARCH_SORT_TRENDING,
      },
    });

    // TODO: remove the line below and pass `response.addons` directly once
    // https://github.com/mozilla/addons-frontend/issues/2917 is done.
    const addons = Object.values(response.entities.addons || {});

    yield put(loadAddonsByAuthors({
      addons,
      addonType,
      authorUsernames,
      forAddonSlug,
    }));
  } catch (error) {
    log.warn(`Search for addons by authors results failed to load: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* addonsByAuthorsSaga() {
  yield takeEvery(FETCH_ADDONS_BY_AUTHORS, fetchAddonsByAuthors);
}
