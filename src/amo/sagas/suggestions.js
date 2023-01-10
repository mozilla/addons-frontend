/* @flow */
import config from 'config';
import { call, put, select, takeLatest } from 'redux-saga/effects';

import * as api from 'amo/api/collections';
import {
  FETCH_SUGGESTIONS,
  abortFetchSuggestions,
  loadSuggestions,
} from 'amo/reducers/suggestions';
import log from 'amo/logger';
import { createErrorHandler, getState } from 'amo/sagas/utils';
import type { FetchSuggestionsAction } from 'amo/reducers/suggestions';
import type { GetCollectionAddonsParams } from 'amo/api/collections';
import type { Saga } from 'amo/types/sagas';

// This feature depends on collections existing with slugs that look like
// `${category}-suggestions`.
export const getCollectionSlugForCategory = (category: string): string =>
  `${category}-suggestions`;

export function* fetchSuggestions({
  payload: { errorHandlerId, slug },
}: FetchSuggestionsAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);
  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: GetCollectionAddonsParams = {
      api: state.api,
      slug: getCollectionSlugForCategory(slug),
      userId: config.get('mozillaUserId'),
    };
    const response = yield call(api.getCollectionAddons, params);

    const { results: addons } = response;

    yield put(
      loadSuggestions({
        addons,
        slug,
      }),
    );
  } catch (error) {
    log.warn(`Failed to suggestions: ${error}`);
    yield put(errorHandler.createErrorAction(error));
    yield put(abortFetchSuggestions({ slug }));
  }
}

export default function* suggestionsSaga(): Saga {
  yield takeLatest(FETCH_SUGGESTIONS, fetchSuggestions);
}
