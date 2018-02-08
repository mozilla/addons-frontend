/* @flow */
import { all, call, put, select, takeLatest } from 'redux-saga/effects';
import {
  ADD_ADDON_TO_COLLECTION,
  FETCH_CURRENT_COLLECTION,
  FETCH_CURRENT_COLLECTION_PAGE,
  FETCH_USER_COLLECTIONS,
  UPDATE_COLLECTION,
  abortAddAddonToCollection,
  abortFetchCurrentCollection,
  abortFetchUserCollections,
  addonAddedToCollection,
  deleteCollectionBySlug,
  loadCurrentCollection,
  loadCurrentCollectionPage,
  loadUserCollections,
} from 'amo/reducers/collections';
import * as api from 'amo/api/collections';
import {
  beginFormOverlaySubmit, closeFormOverlay, finishFormOverlaySubmit,
} from 'core/reducers/formOverlay';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';
import type {
  AddAddonToCollectionParams,
  GetAllUserCollectionsParams,
  GetCollectionAddonsParams,
  GetCollectionParams,
  UpdateCollectionParams,
} from 'amo/api/collections';
import type {
  AddAddonToCollectionAction,
  FetchCurrentCollectionAction,
  FetchCurrentCollectionPageAction,
  FetchUserCollectionsAction,
  UpdateCollectionAction,
} from 'amo/reducers/collections';

export function* fetchCurrentCollection({
  payload: {
    errorHandlerId,
    page,
    slug,
    user,
  },
}: FetchCurrentCollectionAction): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const baseParams = {
      api: state.api,
      slug,
      user,
    };

    const detailParams: $Shape<GetCollectionParams> = {
      ...baseParams,
    };
    const addonsParams: $Shape<GetCollectionAddonsParams> = {
      ...baseParams,
      page,
    };
    const { detail, addons } = yield all({
      detail: call(api.getCollectionDetail, detailParams),
      addons: call(api.getCollectionAddons, addonsParams),
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
}: FetchCurrentCollectionPageAction): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: GetCollectionAddonsParams = {
      api: state.api,
      page,
      slug,
      user,
    };
    const addons = yield call(api.getCollectionAddons, params);

    yield put(loadCurrentCollectionPage({ addons }));
  } catch (error) {
    log.warn(`Collection page failed to load: ${error}`);
    yield put(errorHandler.createErrorAction(error));
    yield put(abortFetchCurrentCollection());
  }
}

export function* fetchUserCollections({
  payload: { errorHandlerId, userId },
}: FetchUserCollectionsAction): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);
  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: GetAllUserCollectionsParams = {
      api: state.api, user: userId,
    };
    const collections = yield call(api.getAllUserCollections, params);

    yield put(loadUserCollections({ userId, collections }));
  } catch (error) {
    log.warn(`Failed to fetch user collections: ${error}`);
    yield put(errorHandler.createErrorAction(error));
    yield put(abortFetchUserCollections({ userId }));
  }
}

export function* addAddonToCollection({
  payload: {
    addonId, collectionId, collectionSlug, errorHandlerId, notes, userId,
  },
}: AddAddonToCollectionAction): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);
  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: AddAddonToCollectionParams = {
      addon: addonId,
      api: state.api,
      collection: collectionSlug,
      notes,
      user: userId,
    };
    yield call(api.addAddonToCollection, params);

    yield put(addonAddedToCollection({
      addonId, userId, collectionId,
    }));
  } catch (error) {
    log.warn(`Failed to add add-on to collection: ${error}`);
    yield put(errorHandler.createErrorAction(error));
    yield put(abortAddAddonToCollection({ addonId, userId }));
  }
}

export function* updateCollection({
  payload: {
    errorHandlerId,
    collectionSlug,
    defaultLocale,
    description,
    formOverlayId,
    isPublic,
    name,
    user,
  },
}: UpdateCollectionAction): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);
  yield put(errorHandler.createClearingAction());

  try {
    yield put(beginFormOverlaySubmit(formOverlayId));

    const state = yield select(getState);
    const params: UpdateCollectionParams = {
      api: state.api,
      collectionSlug,
      defaultLocale,
      description,
      isPublic,
      name,
      user,
    };
    yield call(api.updateCollection, params);

    // Invalidate the stored collection object. This will force each
    // component to re-fetch the collection.
    yield put(deleteCollectionBySlug(collectionSlug));
    yield put(closeFormOverlay(formOverlayId));
    yield put(finishFormOverlaySubmit(formOverlayId));
  } catch (error) {
    log.warn(`Failed to update collection: ${error}`);
    yield put(errorHandler.createErrorAction(error));
    yield put(finishFormOverlaySubmit(formOverlayId));
  }
}

export default function* collectionsSaga(): Generator<any, any, any> {
  yield takeLatest(FETCH_CURRENT_COLLECTION, fetchCurrentCollection);
  yield takeLatest(
    FETCH_CURRENT_COLLECTION_PAGE, fetchCurrentCollectionPage
  );
  yield takeLatest(FETCH_USER_COLLECTIONS, fetchUserCollections);
  yield takeLatest(ADD_ADDON_TO_COLLECTION, addAddonToCollection);
  yield takeLatest(UPDATE_COLLECTION, updateCollection);
}
