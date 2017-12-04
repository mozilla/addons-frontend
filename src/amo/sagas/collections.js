import { all, call, put, select, takeLatest } from 'redux-saga/effects';
import {
  FETCH_CURRENT_COLLECTION,
  FETCH_CURRENT_COLLECTION_PAGE,
  FETCH_USER_COLLECTIONS,
  abortFetchCurrentCollection,
  abortFetchUserCollections,
  loadCurrentCollection,
  loadCurrentCollectionPage,
  loadUserCollections,
} from 'amo/reducers/collections';
import * as api from 'amo/api/collections';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';

export function* fetchCurrentCollection({
  payload: {
    errorHandlerId,
    page,
    slug,
    user,
  },
}) {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const { detail, addons } = yield all({
      detail: call(api.getCollectionDetail, {
        api: state.api,
        slug,
        user,
      }),
      addons: call(api.getCollectionAddons, {
        api: state.api,
        page,
        slug,
        user,
      }),
    });

    yield put(loadCurrentCollection({ addons, detail }));
  } catch (error) {
    log.warn(`Collection failed to load: ${error}`);
    yield put(errorHandler.createErrorAction(error));
    yield put(abortFetchCurrentCollection());
  }
}

export function* fetchCurrentCollectionPage({
  payload: {
    errorHandlerId,
    page,
    slug,
    user,
  },
}) {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const addons = yield call(api.getCollectionAddons, {
      api: state.api,
      page,
      slug,
      user,
    });

    yield put(loadCurrentCollectionPage({ addons }));
  } catch (error) {
    log.warn(`Collection page failed to load: ${error}`);
    yield put(errorHandler.createErrorAction(error));
    yield put(abortFetchCurrentCollection());
  }
}

export function* fetchUserCollections({
  payload: { errorHandlerId, userId },
}) {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const collections = yield call(api.listCollections, {
      api: state.api,
      user: userId,
    });

    yield put(loadUserCollections({
      userId, collections: collections.results,
    }));
  } catch (error) {
    log.warn(`Failed to fetch user collections: ${error}`);
    yield put(errorHandler.createErrorAction(error));
    yield put(abortFetchUserCollections({ userId }));
  }
}

export default function* collectionsSaga() {
  yield takeLatest(FETCH_CURRENT_COLLECTION, fetchCurrentCollection);
  yield takeLatest(
    FETCH_CURRENT_COLLECTION_PAGE, fetchCurrentCollectionPage
  );
  yield takeLatest(FETCH_USER_COLLECTIONS, fetchUserCollections);
}
