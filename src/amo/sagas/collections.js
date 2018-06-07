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
  DELETE_COLLECTION,
  FETCH_CURRENT_COLLECTION,
  FETCH_CURRENT_COLLECTION_PAGE,
  FETCH_USER_COLLECTIONS,
  REMOVE_ADDON_FROM_COLLECTION,
  UPDATE_COLLECTION,
  abortAddAddonToCollection,
  abortFetchCurrentCollection,
  abortFetchUserCollections,
  addonAddedToCollection,
  beginCollectionModification,
  deleteCollectionBySlug,
  finishCollectionModification,
  fetchCurrentCollectionPage as fetchCurrentCollectionPageAction,
  fetchUserCollections as fetchUserCollectionsAction,
  loadCurrentCollection,
  loadCurrentCollectionPage,
  loadUserCollections,
  localizeCollectionDetail,
} from 'amo/reducers/collections';
import * as api from 'amo/api/collections';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';
import type {
  CreateCollectionAddonParams,
  CreateCollectionParams,
  DeleteCollectionParams,
  GetAllUserCollectionsParams,
  GetCollectionAddonsParams,
  GetCollectionParams,
  RemoveAddonFromCollectionParams,
  UpdateCollectionParams,
} from 'amo/api/collections';
import type {
  AddAddonToCollectionAction,
  CreateCollectionAction,
  DeleteCollectionAction,
  FetchCurrentCollectionAction,
  FetchCurrentCollectionPageAction,
  FetchUserCollectionsAction,
  RemoveAddonFromCollectionAction,
  UpdateCollectionAction,
} from 'amo/reducers/collections';

export function* fetchCurrentCollection({
  payload: {
    errorHandlerId,
    page,
    slug,
    username,
  },
}: FetchCurrentCollectionAction): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const baseParams = {
      api: state.api,
      slug,
      username,
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

    const addonsToLoad = addons.results;
    yield put(loadCurrentCollection({ addons: addonsToLoad, detail }));
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
    username,
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
      username,
    };
    const addons = yield call(api.getCollectionAddons, params);

    yield put(loadCurrentCollectionPage({ addons: addons.results }));
  } catch (error) {
    log.warn(`Collection page failed to load: ${error}`);
    yield put(errorHandler.createErrorAction(error));
    yield put(abortFetchCurrentCollection());
  }
}

export function* fetchUserCollections({
  payload: { errorHandlerId, username },
}: FetchUserCollectionsAction): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);
  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: GetAllUserCollectionsParams = {
      api: state.api, username,
    };
    const collections = yield call(api.getAllUserCollections, params);

    yield put(loadUserCollections({ username, collections }));
  } catch (error) {
    log.warn(`Failed to fetch user collections: ${error}`);
    yield put(errorHandler.createErrorAction(error));
    yield put(abortFetchUserCollections({ username }));
  }
}

export function* addAddonToCollection({
  payload: {
    addonId, collectionId, editing, errorHandlerId, notes, page, slug, username,
  },
}: AddAddonToCollectionAction): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);
  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: CreateCollectionAddonParams = {
      addonId,
      api: state.api,
      slug,
      notes,
      username,
    };
    yield call(api.createCollectionAddon, params);

    if (editing) {
      invariant(page, 'A page parameter is required when editing');

      yield put(fetchCurrentCollectionPageAction({
        page,
        errorHandlerId: errorHandler.id,
        slug,
        username,
      }));
    }
    yield put(addonAddedToCollection({
      addonId, username, collectionId,
    }));
  } catch (error) {
    log.warn(`Failed to add add-on to collection: ${error}`);
    yield put(errorHandler.createErrorAction(error));
    yield put(abortAddAddonToCollection({ addonId, username }));
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
    username,
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
    let response;

    const baseApiParams = {
      api: state.api,
      defaultLocale,
      description,
      username,
    };

    if (creating) {
      invariant(name, 'name cannot be empty when creating');
      invariant(slug, 'slug cannot be empty when creating');
      const apiParams: $Shape<CreateCollectionParams> = {
        name,
        slug,
        ...baseApiParams,
      };
      response = yield call(api.createCollection, apiParams);
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
    const newLocation =
      `/${lang}/${clientApp}/collections/${username}/${effectiveSlug}/`;

    if (creating) {
      invariant(response, 'response is required when creating');
      // If a new collection was just created, load it so that it will
      // be available when the user arrives at the collection edit screen.
      const localizedDetail = localizeCollectionDetail({ detail: response, lang });
      yield put(loadCurrentCollection({ addons: [], detail: localizedDetail }));
      yield put(pushLocation(`${newLocation}edit/`));
    } else {
      // TODO: invalidate the stored collection instead of redirecting.
      // Ultimately, we just want to invalidate the old collection data.
      // This redirect is in place to handle slug changes but it causes
      // a race condition if we mix it with deleting old collection data.
      // If we could move to an ID based URL then we won't have to redirect.
      // See https://github.com/mozilla/addons-server/issues/7529
      yield put(pushLocation(newLocation));

      const slugWasEdited = slug && slug !== collectionSlug;
      if (!slugWasEdited) {
        // Invalidate the stored collection object. This will force each
        // component to re-fetch the collection. This is only necessary
        // when the slug hasn't changed.
        yield put(deleteCollectionBySlug(effectiveSlug));
      }
    }
  } catch (error) {
    log.warn(`Failed to ${type}: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  } finally {
    yield put(finishCollectionModification());
  }
}

export function* removeAddonFromCollection({
  payload: {
    addonId, errorHandlerId, page, slug, username,
  },
}: RemoveAddonFromCollectionAction): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);
  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: RemoveAddonFromCollectionParams = {
      addonId,
      api: state.api,
      slug,
      username,
    };
    yield call(api.removeAddonFromCollection, params);

    yield put(fetchCurrentCollectionPageAction({
      page,
      errorHandlerId: errorHandler.id,
      slug,
      username,
    }));
  } catch (error) {
    log.warn(`Failed to remove add-on from collection: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export function* deleteCollection({
  payload: {
    errorHandlerId, slug, username,
  },
}: DeleteCollectionAction): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);
  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);
    const { lang, clientApp } = state.api;

    const params: DeleteCollectionParams = {
      api: state.api,
      slug,
      username,
    };
    yield call(api.deleteCollection, params);

    // Unload the collection from state.
    yield put(deleteCollectionBySlug(slug));

    yield put(fetchUserCollectionsAction({
      errorHandlerId: errorHandler.id,
      username,
    }));
    // Eventually we will redirect to the user's list of collections,
    // but for now we'll just redirect to the home page.
    // See: https://github.com/mozilla/addons-frontend/issues/3142
    yield put(pushLocation(`/${lang}/${clientApp}`));
  } catch (error) {
    log.warn(`Failed to delete collection: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* collectionsSaga(): Generator<any, any, any> {
  yield takeLatest(ADD_ADDON_TO_COLLECTION, addAddonToCollection);
  yield takeLatest([CREATE_COLLECTION, UPDATE_COLLECTION], modifyCollection);
  yield takeLatest(DELETE_COLLECTION, deleteCollection);
  yield takeLatest(FETCH_CURRENT_COLLECTION, fetchCurrentCollection);
  yield takeLatest(
    FETCH_CURRENT_COLLECTION_PAGE, fetchCurrentCollectionPage
  );
  yield takeLatest(FETCH_USER_COLLECTIONS, fetchUserCollections);
  yield takeLatest(REMOVE_ADDON_FROM_COLLECTION, removeAddonFromCollection);
}
