/* @flow */
// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
/* eslint-disable import/order */
import invariant from 'invariant';
import { all, call, put, select, takeLatest } from 'redux-saga/effects';
import { push as pushLocation } from 'react-router-redux';
/* eslint-enable import/order */

import {
  ADD_ADDON_TO_COLLECTION,
  CREATE_COLLECTION,
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
  beginCollectionModification,
  finishCollectionModification,
} from 'amo/reducers/collections';
import * as api from 'amo/api/collections';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';
import type {
  CreateCollectionAddonParams,
  CreateCollectionParams,
  GetAllUserCollectionsParams,
  GetCollectionAddonsParams,
  GetCollectionParams,
  UpdateCollectionParams,
} from 'amo/api/collections';
import type {
  AddAddonToCollectionAction,
  CreateCollectionAction,
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

    const params: CreateCollectionAddonParams = {
      addonId,
      api: state.api,
      collectionSlug,
      notes,
      user: userId,
    };
    yield call(api.createCollectionAddon, params);

    yield put(addonAddedToCollection({
      addonId, userId, collectionId,
    }));
  } catch (error) {
    log.warn(`Failed to add add-on to collection: ${error}`);
    yield put(errorHandler.createErrorAction(error));
    yield put(abortAddAddonToCollection({ addonId, userId }));
  }
}

export function* modifyCollection(
  action: CreateCollectionAction | UpdateCollectionAction
): Generator<any, any, any> {
  const { type, payload } = action;
  const creating = type === CREATE_COLLECTION;

  const {
    defaultLocale,
    description,
    errorHandlerId,
    name,
    slug,
    user,
  } = payload;

  yield put(beginCollectionModification());

  const errorHandler = createErrorHandler(errorHandlerId);
  yield put(errorHandler.createClearingAction());

  let collectionSlug;
  if (action.type === UPDATE_COLLECTION) {
    collectionSlug = action.payload.collectionSlug;
  }

  try {
    const state = yield select(getState);

    const baseApiParams = {
      api: state.api,
      defaultLocale,
      description,
      user,
    };

    if (creating) {
      invariant(name, 'name cannot be empty when creating');
      invariant(slug, 'slug cannot be empty when creating');
      const apiParams: $Shape<CreateCollectionParams> = {
        name,
        slug,
        ...baseApiParams,
      };
      yield call(api.createCollection, apiParams);
    } else {
      invariant(collectionSlug,
        'collectionSlug cannot be empty when updating');
      const apiParams: $Shape<UpdateCollectionParams> = {
        collectionSlug,
        name,
        slug,
        ...baseApiParams,
      };
      yield call(api.updateCollection, apiParams);
    }

    const { lang, clientApp } = state.api;
    const effectiveSlug = slug || collectionSlug;
    invariant(effectiveSlug,
      'Both slug and collectionSlug cannot be empty');
    // TODO: invalidate the stored collection instead of redirecting.
    // Ultimately, we just want to invalidate the old collection data.
    // This redirect is in place to handle slug changes but it causes
    // a race condition if we mix it with deleting old collection data.
    // If we could move to an ID based URL then we won't have to redirect.
    // See https://github.com/mozilla/addons-server/issues/7529
    yield put(pushLocation(
      `/${lang}/${clientApp}/collections/${user}/${effectiveSlug}/`
    ));

    const slugWasEdited = !creating && slug && slug !== collectionSlug;
    if (!slugWasEdited) {
      // Invalidate the stored collection object. This will force each
      // component to re-fetch the collection. This is only necessary
      // when the slug hasn't changed.
      yield put(deleteCollectionBySlug(effectiveSlug));
    }
  } catch (error) {
    log.warn(`Failed to ${type}: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  } finally {
    yield put(finishCollectionModification());
  }
}

export default function* collectionsSaga(): Generator<any, any, any> {
  yield takeLatest(FETCH_CURRENT_COLLECTION, fetchCurrentCollection);
  yield takeLatest(
    FETCH_CURRENT_COLLECTION_PAGE, fetchCurrentCollectionPage
  );
  yield takeLatest(FETCH_USER_COLLECTIONS, fetchUserCollections);
  yield takeLatest(ADD_ADDON_TO_COLLECTION, addAddonToCollection);
  yield takeLatest([CREATE_COLLECTION, UPDATE_COLLECTION], modifyCollection);
}
