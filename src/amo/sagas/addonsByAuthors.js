import { call, put, select, takeLatest } from 'redux-saga/effects';
import { SEARCH_SORT_TRENDING } from 'core/constants';
import {
  FETCH_OTHER_ADDONS_BY_AUTHORS,
  OTHER_ADDONS_BY_AUTHORS_PAGE_SIZE,
  loadOtherAddonsByAuthors,
} from 'amo/reducers/addonsByAuthors';
import { search as searchApi } from 'core/api/search';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';


export function* fetchOtherAddonsByAuthors({ payload }) {
  const { errorHandlerId, authors, slug, addonType } = payload;
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const response = yield call(searchApi, {
      api: state.api,
      filters: {
        addonType,
        author: authors.join(','),
        // We need one more add-on than the number to display because the API
        // may return the main add-on and we cannot tell the API to exclude it.
        page_size: OTHER_ADDONS_BY_AUTHORS_PAGE_SIZE + 1,
        sort: SEARCH_SORT_TRENDING,
      },
    });

    // TODO: remove the line below and pass `response.addons` directly once
    // https://github.com/mozilla/addons-frontend/issues/2917 is done.
    const addons = Object.values(response.entities.addons || {});

    yield put(loadOtherAddonsByAuthors({ addons, slug }));
  } catch (error) {
    log.warn(`Search for addons by authors results failed to load: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* addonsByAuthorsSaga() {
  yield takeLatest(FETCH_OTHER_ADDONS_BY_AUTHORS, fetchOtherAddonsByAuthors);
}
