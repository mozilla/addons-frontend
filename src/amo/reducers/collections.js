/* @flow */
import { oneLine } from 'common-tags';
import invariant from 'invariant';
import { LOCATION_CHANGE } from 'redux-first-history';

import { createInternalAddon } from 'amo/reducers/addons';
import { SET_LANG } from 'amo/reducers/api';
import type { UserId } from 'amo/reducers/users';
import { selectLocalizedContent } from 'amo/reducers/utils';
import type { CollectionAddonType, ExternalAddonType } from 'amo/types/addons';
import type { LocalizedString, QueryParams } from 'amo/types/api';
import type { I18nType } from 'amo/types/i18n';

export const ADD_ADDON_TO_COLLECTION: 'ADD_ADDON_TO_COLLECTION' =
  'ADD_ADDON_TO_COLLECTION';
export const FETCH_CURRENT_COLLECTION: 'FETCH_CURRENT_COLLECTION' =
  'FETCH_CURRENT_COLLECTION';
export const FETCH_USER_COLLECTIONS: 'FETCH_USER_COLLECTIONS' =
  'FETCH_USER_COLLECTIONS';
export const LOAD_CURRENT_COLLECTION: 'LOAD_CURRENT_COLLECTION' =
  'LOAD_CURRENT_COLLECTION';
export const FETCH_CURRENT_COLLECTION_PAGE: 'FETCH_CURRENT_COLLECTION_PAGE' =
  'FETCH_CURRENT_COLLECTION_PAGE';
export const LOAD_CURRENT_COLLECTION_PAGE: 'LOAD_CURRENT_COLLECTION_PAGE' =
  'LOAD_CURRENT_COLLECTION_PAGE';
export const ABORT_FETCH_CURRENT_COLLECTION: 'ABORT_FETCH_CURRENT_COLLECTION' =
  'ABORT_FETCH_CURRENT_COLLECTION';
export const ABORT_FETCH_USER_COLLECTIONS: 'ABORT_FETCH_USER_COLLECTIONS' =
  'ABORT_FETCH_USER_COLLECTIONS';
export const ABORT_ADD_ADDON_TO_COLLECTION: 'ABORT_ADD_ADDON_TO_COLLECTION' =
  'ABORT_ADD_ADDON_TO_COLLECTION';
export const LOAD_USER_COLLECTIONS: 'LOAD_USER_COLLECTIONS' =
  'LOAD_USER_COLLECTIONS';
export const ADDON_ADDED_TO_COLLECTION: 'ADDON_ADDED_TO_COLLECTION' =
  'ADDON_ADDED_TO_COLLECTION';
export const LOAD_COLLECTION_ADDONS: 'LOAD_COLLECTION_ADDONS' =
  'LOAD_COLLECTION_ADDONS';
export const UPDATE_COLLECTION: 'UPDATE_COLLECTION' = 'UPDATE_COLLECTION';
export const UNLOAD_COLLECTION_BY_SLUG: 'UNLOAD_COLLECTION_BY_SLUG' =
  'UNLOAD_COLLECTION_BY_SLUG';
export const CREATE_COLLECTION: 'CREATE_COLLECTION' = 'CREATE_COLLECTION';
export const BEGIN_COLLECTION_MODIFICATION: 'BEGIN_COLLECTION_MODIFICATION' =
  'BEGIN_COLLECTION_MODIFICATION';
export const FINISH_COLLECTION_MODIFICATION: 'FINISH_COLLECTION_MODIFICATION' =
  'FINISH_COLLECTION_MODIFICATION';
export const REMOVE_ADDON_FROM_COLLECTION: 'REMOVE_ADDON_FROM_COLLECTION' =
  'REMOVE_ADDON_FROM_COLLECTION';
export const ADDON_REMOVED_FROM_COLLECTION: 'ADDON_REMOVED_FROM_COLLECTION' =
  'ADDON_REMOVED_FROM_COLLECTION';
export const DELETE_COLLECTION: 'DELETE_COLLECTION' = 'DELETE_COLLECTION';
export const UPDATE_COLLECTION_ADDON: 'UPDATE_COLLECTION_ADDON' =
  'UPDATE_COLLECTION_ADDON';
export const DELETE_COLLECTION_ADDON_NOTES: 'DELETE_COLLECTION_ADDON_NOTES' =
  'DELETE_COLLECTION_ADDON_NOTES';
export const BEGIN_EDITING_COLLECTION_DETAILS: 'BEGIN_EDITING_COLLECTION_DETAILS' =
  'BEGIN_EDITING_COLLECTION_DETAILS';
export const FINISH_EDITING_COLLECTION_DETAILS: 'FINISH_EDITING_COLLECTION_DETAILS' =
  'FINISH_EDITING_COLLECTION_DETAILS';

export type CollectionFilters = {|
  page: string,
  collectionSort: string,
|};

export type CollectionType = {
  addons: Array<CollectionAddonType> | null,
  authorId: number,
  authorName: string,
  authorUsername: string,
  defaultLocale: string,
  description: string | null,
  id: number,
  lastUpdatedDate: string,
  name: string,
  numberOfAddons: number | null,
  pageSize: string | null,
  slug: string,
};

export type CollectionId = number;

export type CollectionsState = {
  byId: {
    [id: CollectionId]: CollectionType,
  },

  bySlug: {
    [slug: string]: CollectionId,
  },

  // This is the collection currently visible on the detail page.
  current: {|
    id: CollectionId | null,
    loading: boolean,
  |},

  userCollections: {
    [userId: UserId]: {|
      // This is a list of all collections belonging to the user.
      collections: Array<CollectionId> | null,
      loading: boolean,
    |},
  },

  addonInCollections: {
    [userId: UserId]: {
      [addonId: number]: {|
        // This is a list of all user collections that the add-on
        // is a part of.
        collections: Array<CollectionId> | null,
        loading: boolean,
      |},
    },
  },

  isCollectionBeingModified: boolean,
  hasAddonBeenAdded: boolean,
  hasAddonBeenRemoved: boolean,
  editingCollectionDetails: boolean,
  lang: string,
};

export const initialState: CollectionsState = {
  byId: {},
  bySlug: {},
  current: { id: null, loading: false },
  userCollections: {},
  addonInCollections: {},
  isCollectionBeingModified: false,
  hasAddonBeenAdded: false,
  hasAddonBeenRemoved: false,
  editingCollectionDetails: false,
  // We default lang to '' to avoid having to add a lot of invariants to our
  // code, and protect against a lang of '' in selectLocalizedContent.
  lang: '',
};

type FetchCurrentCollectionParams = {|
  errorHandlerId: string,
  filters?: CollectionFilters,
  slug: string,
  userId: UserId,
|};

export type FetchCurrentCollectionAction = {|
  type: typeof FETCH_CURRENT_COLLECTION,
  payload: FetchCurrentCollectionParams,
|};

export const fetchCurrentCollection = ({
  errorHandlerId,
  filters,
  slug,
  userId,
}: FetchCurrentCollectionParams): FetchCurrentCollectionAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(slug, 'slug is required');
  invariant(userId, 'userId is required');

  return {
    type: FETCH_CURRENT_COLLECTION,
    payload: { errorHandlerId, filters, slug, userId },
  };
};

type FetchUserCollectionsParams = {|
  errorHandlerId: string,
  userId: UserId,
|};

export type FetchUserCollectionsAction = {|
  type: typeof FETCH_USER_COLLECTIONS,
  payload: FetchUserCollectionsParams,
|};

export const fetchUserCollections = ({
  errorHandlerId,
  userId,
}: FetchUserCollectionsParams): FetchUserCollectionsAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(userId, 'userId is required');

  return {
    type: FETCH_USER_COLLECTIONS,
    payload: { errorHandlerId, userId },
  };
};

type AbortFetchUserCollectionsParams = {|
  userId: UserId,
|};

type AbortFetchUserCollectionsAction = {|
  type: typeof ABORT_FETCH_USER_COLLECTIONS,
  payload: AbortFetchUserCollectionsParams,
|};

export const abortFetchUserCollections = ({
  userId,
}: AbortFetchUserCollectionsParams): AbortFetchUserCollectionsAction => {
  invariant(userId, 'userId is required');

  return {
    type: ABORT_FETCH_USER_COLLECTIONS,
    payload: { userId },
  };
};

type AbortAddAddonToCollectionParams = {|
  addonId: number,
  userId: UserId,
|};

type AbortAddAddonToCollectionAction = {|
  type: typeof ABORT_ADD_ADDON_TO_COLLECTION,
  payload: AbortAddAddonToCollectionParams,
|};

export const abortAddAddonToCollection = ({
  addonId,
  userId,
}: AbortAddAddonToCollectionParams): AbortAddAddonToCollectionAction => {
  invariant(userId, 'userId is required');
  invariant(addonId, 'addonId is required');

  return {
    type: ABORT_ADD_ADDON_TO_COLLECTION,
    payload: { userId, addonId },
  };
};

export type FetchCurrentCollectionPageAction = {|
  type: typeof FETCH_CURRENT_COLLECTION_PAGE,
  payload: FetchCurrentCollectionParams,
|};

export const fetchCurrentCollectionPage = ({
  errorHandlerId,
  filters,
  slug,
  userId,
}: FetchCurrentCollectionParams): FetchCurrentCollectionPageAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(slug, 'slug is required');
  invariant(userId, 'userId is required');

  return {
    type: FETCH_CURRENT_COLLECTION_PAGE,
    payload: { errorHandlerId, filters, slug, userId },
  };
};

export type ExternalCollectionAddon = {|
  addon: ExternalAddonType,
  notes: LocalizedString | null,
|};

export type ExternalCollectionAddons = Array<ExternalCollectionAddon>;

export type ExternalCollectionDetail = {|
  addon_count: number,
  author: {|
    id: number,
    name: string,
    url: string,
    username: string,
  |},

  default_locale: string,
  description: LocalizedString | null,
  id: number,
  modified: string,
  name: LocalizedString,
  public: boolean,
  slug: string,
  url: string,
  uuid: string,
|};

export type CollectionAddonsListResponse = {|
  count: number,
  next: string,
  page_size: string,
  previous: string,
  results: ExternalCollectionAddons,
|};

type LoadCurrentCollectionParams = {|
  addonsResponse?: CollectionAddonsListResponse,
  detail: ExternalCollectionDetail,
|};

type LoadCurrentCollectionAction = {|
  type: typeof LOAD_CURRENT_COLLECTION,
  payload: LoadCurrentCollectionParams,
|};

export const loadCurrentCollection = ({
  addonsResponse,
  detail,
}: LoadCurrentCollectionParams): LoadCurrentCollectionAction => {
  invariant(detail, 'detail is required');

  return {
    type: LOAD_CURRENT_COLLECTION,
    payload: { addonsResponse, detail },
  };
};

type LoadCurrentCollectionPageParams = {|
  addonsResponse: CollectionAddonsListResponse,
|};

type LoadCurrentCollectionPageAction = {|
  type: typeof LOAD_CURRENT_COLLECTION_PAGE,
  payload: LoadCurrentCollectionPageParams,
|};

export const loadCurrentCollectionPage = ({
  addonsResponse,
}: LoadCurrentCollectionPageParams): LoadCurrentCollectionPageAction => {
  invariant(addonsResponse, 'The addonsResponse parameter is required');

  return {
    type: LOAD_CURRENT_COLLECTION_PAGE,
    payload: { addonsResponse },
  };
};

type LoadCollectionAddonsParams = {|
  addons: ExternalCollectionAddons,
  slug: string,
|};

type LoadCollectionAddonsAction = {|
  type: typeof LOAD_COLLECTION_ADDONS,
  payload: LoadCollectionAddonsParams,
|};

export const loadCollectionAddons = ({
  addons,
  slug,
}: LoadCollectionAddonsParams): LoadCollectionAddonsAction => {
  if (!addons) {
    throw new Error('The addons parameter is required');
  }
  if (!slug) {
    throw new Error('The slug parameter is required');
  }

  return {
    type: LOAD_COLLECTION_ADDONS,
    payload: { addons, slug },
  };
};

type LoadUserCollectionsParams = {|
  collections: Array<ExternalCollectionDetail>,
  userId: UserId,
|};

type LoadUserCollectionsAction = {|
  type: typeof LOAD_USER_COLLECTIONS,
  payload: LoadUserCollectionsParams,
|};

export const loadUserCollections = ({
  collections,
  userId,
}: LoadUserCollectionsParams): LoadUserCollectionsAction => {
  invariant(userId, 'userId is required');
  invariant(collections, 'collections are required');

  return {
    type: LOAD_USER_COLLECTIONS,
    payload: { userId, collections },
  };
};

type AddonAddedToCollectionParams = {|
  addonId: number,
  collectionId: CollectionId,
  userId: UserId,
|};

type AddonAddedToCollectionAction = {|
  type: typeof ADDON_ADDED_TO_COLLECTION,
  payload: AddonAddedToCollectionParams,
|};

export const addonAddedToCollection = ({
  addonId,
  collectionId,
  userId,
}: AddonAddedToCollectionParams): AddonAddedToCollectionAction => {
  invariant(addonId, 'addonId is required');
  invariant(userId, 'userId is required');
  invariant(collectionId, 'collectionId is required');

  return {
    type: ADDON_ADDED_TO_COLLECTION,
    payload: { addonId, collectionId, userId },
  };
};

type AbortFetchCurrentCollection = {|
  type: typeof ABORT_FETCH_CURRENT_COLLECTION,
|};

export const abortFetchCurrentCollection = (): AbortFetchCurrentCollection => {
  return { type: ABORT_FETCH_CURRENT_COLLECTION };
};

type AddAddonToCollectionParams = {|
  addonId: number,
  collectionId: CollectionId,
  editing?: boolean,
  errorHandlerId: string,
  filters?: CollectionFilters,
  notes?: LocalizedString,
  slug: string,
  userId: UserId,
|};

export type AddAddonToCollectionAction = {|
  type: typeof ADD_ADDON_TO_COLLECTION,
  payload: AddAddonToCollectionParams,
|};

export const addAddonToCollection = ({
  addonId,
  collectionId,
  editing,
  errorHandlerId,
  filters,
  notes,
  slug,
  userId,
}: AddAddonToCollectionParams): AddAddonToCollectionAction => {
  invariant(addonId, 'The addonId parameter is required');
  invariant(collectionId, 'The collectionId parameter is required');
  invariant(slug, 'The slug parameter is required');
  invariant(errorHandlerId, 'The errorHandlerId parameter is required');
  invariant(userId, 'The userId parameter is required');

  if (editing) {
    invariant(filters, 'The filters parameter is required when editing');
  }

  return {
    type: ADD_ADDON_TO_COLLECTION,
    payload: {
      addonId,
      collectionId,
      editing,
      errorHandlerId,
      filters,
      notes,
      slug,
      userId,
    },
  };
};

export type RequiredModifyCollectionParams = {|
  errorHandlerId: string,
  userId: UserId,
|};

export type OptionalModifyCollectionParams = {|
  defaultLocale: ?string,
  description: ?LocalizedString,
|};

type CreateCollectionParams = {|
  ...RequiredModifyCollectionParams,
  ...OptionalModifyCollectionParams,
  includeAddonId?: number,
  name: LocalizedString,
  slug: string,
|};

type UpdateCollectionParams = {|
  ...RequiredModifyCollectionParams,
  ...OptionalModifyCollectionParams,
  collectionSlug: string,
  filters: CollectionFilters,
  name: ?LocalizedString,
  slug: ?string,
|};

export type CreateCollectionAction = {|
  type: typeof CREATE_COLLECTION,
  payload: CreateCollectionParams,
|};

export type UpdateCollectionAction = {|
  type: typeof UPDATE_COLLECTION,
  payload: UpdateCollectionParams,
|};

export const createCollection = ({
  errorHandlerId,
  defaultLocale,
  description,
  includeAddonId,
  name,
  slug,
  userId,
}: CreateCollectionParams): CreateCollectionAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(userId, 'userId is required');
  invariant(name, 'name is required when creating a collection');
  invariant(slug, 'slug is required when creating a collection');

  return {
    type: CREATE_COLLECTION,
    payload: {
      errorHandlerId,
      defaultLocale,
      description,
      includeAddonId,
      name,
      slug,
      userId,
    },
  };
};

export const updateCollection = ({
  collectionSlug,
  defaultLocale,
  description,
  errorHandlerId,
  filters,
  name,
  slug,
  userId,
}: UpdateCollectionParams): UpdateCollectionAction => {
  invariant(collectionSlug, 'collectionSlug is required when updating');
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(filters, 'filters is required');
  invariant(userId, 'userId is required');

  return {
    type: UPDATE_COLLECTION,
    payload: {
      collectionSlug,
      defaultLocale,
      description,
      errorHandlerId,
      filters,
      name,
      slug,
      userId,
    },
  };
};

type BeginCollectionModificationAction = {|
  type: typeof BEGIN_COLLECTION_MODIFICATION,
  payload: null,
|};

export const beginCollectionModification =
  (): BeginCollectionModificationAction => {
    return {
      type: BEGIN_COLLECTION_MODIFICATION,
      payload: null,
    };
  };

type FinishCollectionModificationAction = {|
  type: typeof FINISH_COLLECTION_MODIFICATION,
  payload: null,
|};

export const finishCollectionModification =
  (): FinishCollectionModificationAction => {
    return {
      type: FINISH_COLLECTION_MODIFICATION,
      payload: null,
    };
  };

type UnloadCollectionBySlugAction = {|
  type: typeof UNLOAD_COLLECTION_BY_SLUG,
  payload: {| slug: string |},
|};

export const unloadCollectionBySlug = (
  slug: string,
): UnloadCollectionBySlugAction => {
  if (!slug) {
    throw new Error('A slug is required');
  }

  return {
    type: UNLOAD_COLLECTION_BY_SLUG,
    payload: { slug },
  };
};

type RemoveAddonFromCollectionParams = {|
  addonId: number,
  errorHandlerId: string,
  filters: CollectionFilters,
  slug: string,
  userId: UserId,
|};

export type RemoveAddonFromCollectionAction = {|
  type: typeof REMOVE_ADDON_FROM_COLLECTION,
  payload: RemoveAddonFromCollectionParams,
|};

export const removeAddonFromCollection = ({
  addonId,
  errorHandlerId,
  filters,
  slug,
  userId,
}: RemoveAddonFromCollectionParams): RemoveAddonFromCollectionAction => {
  invariant(addonId, 'The addonId parameter is required');
  invariant(errorHandlerId, 'The errorHandlerId parameter is required');
  invariant(filters, 'The filters parameter is required');
  invariant(slug, 'The slug parameter is required');
  invariant(userId, 'The userId parameter is required');

  return {
    type: REMOVE_ADDON_FROM_COLLECTION,
    payload: {
      addonId,
      errorHandlerId,
      filters,
      slug,
      userId,
    },
  };
};

type AddonRemovedFromCollectionAction = {|
  type: typeof ADDON_REMOVED_FROM_COLLECTION,
|};

export const addonRemovedFromCollection =
  (): AddonRemovedFromCollectionAction => {
    return {
      type: ADDON_REMOVED_FROM_COLLECTION,
    };
  };

type DeleteCollectionParams = {|
  errorHandlerId: string,
  slug: string,
  userId: UserId,
|};

export type DeleteCollectionAction = {|
  type: typeof DELETE_COLLECTION,
  payload: DeleteCollectionParams,
|};

export const deleteCollection = ({
  errorHandlerId,
  slug,
  userId,
}: DeleteCollectionParams): DeleteCollectionAction => {
  invariant(errorHandlerId, 'The errorHandlerId parameter is required');
  invariant(slug, 'The slug parameter is required');
  invariant(userId, 'The userId parameter is required');

  return {
    type: DELETE_COLLECTION,
    payload: {
      errorHandlerId,
      slug,
      userId,
    },
  };
};

type UpdateCollectionAddonParams = {|
  addonId: number,
  errorHandlerId: string,
  filters: CollectionFilters,
  notes: LocalizedString,
  slug: string,
  userId: UserId,
|};

export type UpdateCollectionAddonAction = {|
  type: typeof UPDATE_COLLECTION_ADDON,
  payload: UpdateCollectionAddonParams,
|};

export const updateCollectionAddon = ({
  addonId,
  errorHandlerId,
  notes,
  filters,
  slug,
  userId,
}: UpdateCollectionAddonParams): UpdateCollectionAddonAction => {
  invariant(addonId, 'The addonId parameter is required');
  invariant(errorHandlerId, 'The errorHandlerId parameter is required');
  invariant(
    notes !== undefined && notes !== null,
    'The notes parameter is required',
  );
  invariant(filters, 'The filters parameter is required');
  invariant(slug, 'The slug parameter is required');
  invariant(userId, 'The userId parameter is required');

  return {
    type: UPDATE_COLLECTION_ADDON,
    payload: {
      addonId,
      errorHandlerId,
      notes,
      filters,
      slug,
      userId,
    },
  };
};

type DeleteCollectionAddonNotesParams = {|
  addonId: number,
  errorHandlerId: string,
  filters: CollectionFilters,
  lang: string,
  slug: string,
  userId: UserId,
|};

export type DeleteCollectionAddonNotesAction = {|
  type: typeof DELETE_COLLECTION_ADDON_NOTES,
  payload: UpdateCollectionAddonParams,
|};

export const deleteCollectionAddonNotes = ({
  addonId,
  errorHandlerId,
  filters,
  lang,
  slug,
  userId,
}: DeleteCollectionAddonNotesParams): DeleteCollectionAddonNotesAction => {
  invariant(addonId, 'The addonId parameter is required');
  invariant(errorHandlerId, 'The errorHandlerId parameter is required');
  invariant(filters, 'The filters parameter is required');
  invariant(lang, 'The lang parameter is required');
  invariant(slug, 'The slug parameter is required');
  invariant(userId, 'The userId parameter is required');

  // For delete we set the notes field to an empty string and call update.
  // TODO: Use a null instead when https://github.com/mozilla/addons-server/issues/7832 is fixed.
  return {
    type: DELETE_COLLECTION_ADDON_NOTES,
    payload: {
      addonId,
      errorHandlerId,
      filters,
      notes: { [lang]: '' },
      slug,
      userId,
    },
  };
};

type BeginEditingCollectionDetailsAction = {|
  type: typeof BEGIN_EDITING_COLLECTION_DETAILS,
|};

export const beginEditingCollectionDetails =
  (): BeginEditingCollectionDetailsAction => {
    return {
      type: BEGIN_EDITING_COLLECTION_DETAILS,
    };
  };

type FinishEditingCollectionDetailsAction = {|
  type: typeof FINISH_EDITING_COLLECTION_DETAILS,
|};

export const finishEditingCollectionDetails =
  (): FinishEditingCollectionDetailsAction => {
    return {
      type: FINISH_EDITING_COLLECTION_DETAILS,
    };
  };

export const createInternalAddons = (
  items: ExternalCollectionAddons,
  lang: string,
): Array<CollectionAddonType> => {
  return items.map(({ addon, notes }) => {
    // This allows to have a consistent way to manipulate addons in the app.
    return {
      ...createInternalAddon(addon, lang),
      notes: selectLocalizedContent(notes, lang),
    };
  });
};

type GetCollectionByIdParams = {|
  state: CollectionsState,
  id: CollectionId,
|};

export const getCollectionById = ({
  id,
  state,
}: GetCollectionByIdParams): CollectionType | null => {
  if (!id) {
    throw new Error('The id parameter is required');
  }
  if (!state) {
    throw new Error('The state parameter is required');
  }

  return state.byId[id] || null;
};

export const getCurrentCollection = (
  collectionsState: CollectionsState,
): CollectionType | null => {
  if (!collectionsState) {
    throw new Error('The collectionsState parameter is required');
  }
  if (!collectionsState.current.id) {
    return null;
  }

  return getCollectionById({
    id: collectionsState.current.id,
    state: collectionsState,
  });
};

type CreateInternalCollectionParams = {|
  addonsResponse?: CollectionAddonsListResponse,
  detail: ExternalCollectionDetail,
  lang: string,
|};

export const createInternalCollection = ({
  addonsResponse,
  detail,
  lang,
}: CreateInternalCollectionParams): CollectionType => ({
  addons: addonsResponse
    ? createInternalAddons(addonsResponse.results, lang)
    : null,
  authorId: detail.author.id,
  authorName: detail.author.name,
  authorUsername: detail.author.username,
  defaultLocale: detail.default_locale,
  description: selectLocalizedContent(detail.description, lang),
  id: detail.id,
  lastUpdatedDate: detail.modified,
  name: selectLocalizedContent(detail.name, lang) || '',
  numberOfAddons: addonsResponse ? addonsResponse.count : detail.addon_count,
  pageSize: addonsResponse ? addonsResponse.page_size : null,
  slug: detail.slug,
});

type LoadCollectionIntoStateParams = {|
  addonsResponse?: CollectionAddonsListResponse,
  collection: ExternalCollectionDetail,
  state: CollectionsState,
|};

export const loadCollectionIntoState = ({
  addonsResponse,
  collection,
  state,
}: LoadCollectionIntoStateParams): CollectionsState => {
  const existingCollection = state.byId[collection.id];
  const internalCollection = createInternalCollection({
    detail: collection,
    addonsResponse,
    lang: state.lang,
  });
  // In case the new collection isn't loaded with add-ons,
  // make sure we don't overwrite any existing addons.
  if (!internalCollection.addons && existingCollection) {
    internalCollection.addons = existingCollection.addons;
    internalCollection.pageSize = existingCollection.pageSize;
  }

  return {
    ...state,
    byId: {
      ...state.byId,
      [internalCollection.id]: internalCollection,
    },
    bySlug: {
      ...state.bySlug,
      [internalCollection.slug]: internalCollection.id,
    },
  };
};

type ChangeAddonCollectionsLoadingFlagParams = {|
  addonId: number,
  loading: boolean,
  state: CollectionsState,
  userId: UserId,
|};

export const changeAddonCollectionsLoadingFlag = ({
  addonId,
  loading,
  state,
  userId,
}: ChangeAddonCollectionsLoadingFlagParams): CollectionsState => {
  const userState = state.addonInCollections[userId];
  const addonState = userState && userState[addonId];

  return {
    ...state,
    addonInCollections: {
      ...state.addonInCollections,
      [userId]: {
        ...userState,
        [addonId]: {
          collections: addonState ? addonState.collections : null,
          loading,
        },
      },
    },
  };
};

type UnloadUserCollectionsParams = {|
  state: CollectionsState,
  userId: UserId,
|};

const unloadUserCollections = ({
  state,
  userId,
}: UnloadUserCollectionsParams): CollectionsState => {
  return {
    ...state,
    userCollections: {
      ...state.userCollections,
      [userId]: {
        collections: null,
        loading: false,
      },
    },
  };
};

export const expandCollections = (
  collections: CollectionsState,
  meta?: { collections: Array<CollectionId> | null },
): Array<CollectionType> | null => {
  return meta && meta.collections
    ? meta.collections.reduce((result, id) => {
        const collection = collections.byId[id];
        if (collection) {
          result.push(collection);
        }
        return result;
      }, [])
    : null;
};

export const convertFiltersToQueryParams = (
  filters: CollectionFilters,
): QueryParams => {
  return {
    page: filters.page,
    collection_sort: filters.collectionSort,
  };
};

type CollectionUrlParams = {|
  authorId?: number,
  collection: CollectionType | null,
  collectionSlug?: string,
  _collectionUrl?: Function,
|};

export const collectionUrl = ({
  authorId,
  collection,
  collectionSlug,
}: CollectionUrlParams): string => {
  let slug = collectionSlug;
  let userId = authorId;

  if (collection) {
    slug = collection.slug;
    userId = collection.authorId;
  }
  invariant(
    slug && userId,
    'Either a collection or an authorId and collectionSlug are required.',
  );

  return `/collections/${userId}/${slug}/`;
};

export const collectionEditUrl = ({
  authorId,
  collection,
  collectionSlug,
  _collectionUrl = collectionUrl,
}: CollectionUrlParams): string => {
  return `${_collectionUrl({
    authorId,
    collection,
    collectionSlug,
  })}edit/`;
};

export const collectionName = ({
  i18n,
  name,
}: {|
  i18n: I18nType,
  name?: string,
|}): string => name || i18n.t('(no name)');

type Action =
  | AbortFetchCurrentCollection
  | AbortAddAddonToCollectionAction
  | AbortFetchUserCollectionsAction
  | AddAddonToCollectionAction
  | AddonAddedToCollectionAction
  | BeginCollectionModificationAction
  | CreateCollectionAction
  | DeleteCollectionAction
  | FetchCurrentCollectionAction
  | FetchCurrentCollectionPageAction
  | FetchUserCollectionsAction
  | FinishCollectionModificationAction
  | LoadCollectionAddonsAction
  | LoadCurrentCollectionAction
  | LoadCurrentCollectionPageAction
  | LoadUserCollectionsAction
  | UnloadCollectionBySlugAction
  | UpdateCollectionAction;

const reducer = (
  // eslint-disable-next-line default-param-last
  state: CollectionsState = initialState,
  action: Action,
): CollectionsState => {
  switch (action.type) {
    case FETCH_CURRENT_COLLECTION:
      return {
        ...state,
        current: {
          id: null,
          loading: true,
        },
      };

    case FETCH_CURRENT_COLLECTION_PAGE: {
      const current = {
        id: state.current.id,
        loading: true,
      };

      const currentCollection = getCurrentCollection(state);
      if (!currentCollection) {
        return { ...state, current };
      }

      return {
        ...state,
        byId: {
          ...state.byId,
          [currentCollection.id]: {
            ...currentCollection,
            addons: [],
            numberOfAddons: null,
            pageSize: null,
          },
        },
        current,
      };
    }

    case LOAD_CURRENT_COLLECTION: {
      const { addonsResponse, detail } = action.payload;

      const newState = loadCollectionIntoState({
        addonsResponse,
        collection: detail,
        state,
      });

      return {
        ...newState,
        current: {
          id: detail.id,
          loading: false,
        },
      };
    }

    case LOAD_CURRENT_COLLECTION_PAGE: {
      const { addonsResponse } = action.payload;

      const currentCollection = getCurrentCollection(state);
      if (!currentCollection) {
        throw new Error(`${action.type}: a current collection does not exist`);
      }

      return {
        ...state,
        byId: {
          ...state.byId,
          [currentCollection.id]: {
            ...currentCollection,
            addons: createInternalAddons(addonsResponse.results, state.lang),
            numberOfAddons: addonsResponse.count,
            pageSize: addonsResponse.page_size,
          },
        },
        current: {
          id: state.current.id,
          loading: false,
        },
      };
    }

    case LOAD_COLLECTION_ADDONS: {
      const { addons, slug } = action.payload;

      const collectionId = state.bySlug[slug];
      if (!collectionId) {
        throw new Error(
          oneLine`Cannot load add-ons for collection
          "${slug}" because the collection has not
          been loaded yet`,
        );
      }
      const collection = state.byId[collectionId];
      return {
        ...state,
        byId: {
          ...state.byId,
          [collectionId]: {
            ...collection,
            addons: createInternalAddons(addons, state.lang),
          },
        },
      };
    }

    case ABORT_FETCH_CURRENT_COLLECTION:
      return {
        ...state,
        current: {
          id: null,
          loading: false,
        },
      };

    case FETCH_USER_COLLECTIONS: {
      const { userId } = action.payload;

      return {
        ...state,
        userCollections: {
          ...state.userCollections,
          [userId]: {
            collections: null,
            loading: true,
          },
        },
      };
    }

    case ABORT_FETCH_USER_COLLECTIONS: {
      const { userId } = action.payload;

      return {
        ...state,
        userCollections: {
          ...state.userCollections,
          [userId]: {
            collections: null,
            loading: false,
          },
        },
      };
    }

    case LOAD_USER_COLLECTIONS: {
      const { collections, userId } = action.payload;

      let newState = { ...state };
      collections.forEach((collection) => {
        newState = loadCollectionIntoState({
          state: newState,
          collection,
        });
      });

      return {
        ...newState,
        userCollections: {
          ...state.userCollections,
          [userId]: {
            collections: collections.map((collection) => collection.id),
            loading: false,
          },
        },
      };
    }

    case ADDON_ADDED_TO_COLLECTION: {
      const { addonId, collectionId, userId } = action.payload;
      const { addonInCollections } = state;
      let collections: Array<CollectionId> = [];
      if (addonInCollections[userId] && addonInCollections[userId][addonId]) {
        const existingCollections =
          addonInCollections[userId][addonId].collections;
        if (existingCollections) {
          collections = existingCollections;
        }
      }

      return {
        ...state,
        addonInCollections: {
          ...state.addonInCollections,
          [userId]: {
            ...state.addonInCollections[userId],
            [addonId]: {
              collections: collections.concat([collectionId]),
              loading: false,
            },
          },
        },
        hasAddonBeenAdded: true,
      };
    }

    case ADD_ADDON_TO_COLLECTION: {
      const { addonId, userId } = action.payload;

      const newState = changeAddonCollectionsLoadingFlag({
        addonId,
        userId,
        state,
        loading: true,
      });
      return {
        ...newState,
        hasAddonBeenAdded: false,
      };
    }

    case ABORT_ADD_ADDON_TO_COLLECTION: {
      const { addonId, userId } = action.payload;

      const newState = changeAddonCollectionsLoadingFlag({
        addonId,
        userId,
        state,
        loading: false,
      });
      return {
        ...newState,
        hasAddonBeenAdded: false,
      };
    }

    case BEGIN_COLLECTION_MODIFICATION: {
      return {
        ...state,
        isCollectionBeingModified: true,
      };
    }

    case FINISH_COLLECTION_MODIFICATION: {
      return {
        ...state,
        isCollectionBeingModified: false,
      };
    }

    case UNLOAD_COLLECTION_BY_SLUG: {
      const { slug } = action.payload;
      const collectionId = state.bySlug[slug];

      if (collectionId) {
        return {
          ...state,
          byId: {
            ...state.byId,
            [collectionId]: undefined,
          },
        };
      }
      return state;
    }

    case CREATE_COLLECTION:
    case DELETE_COLLECTION:
    case UPDATE_COLLECTION: {
      const { userId } = action.payload;
      return unloadUserCollections({ state, userId });
    }

    case REMOVE_ADDON_FROM_COLLECTION: {
      return {
        ...state,
        hasAddonBeenRemoved: false,
      };
    }

    case ADDON_REMOVED_FROM_COLLECTION: {
      return {
        ...state,
        hasAddonBeenRemoved: true,
      };
    }

    case BEGIN_EDITING_COLLECTION_DETAILS: {
      return {
        ...state,
        editingCollectionDetails: true,
      };
    }

    case FINISH_EDITING_COLLECTION_DETAILS: {
      return {
        ...state,
        editingCollectionDetails: false,
      };
    }

    // See: https://github.com/mozilla/addons-frontend/issues/7412
    case LOCATION_CHANGE:
      return {
        ...state,
        addonInCollections: {},
      };

    case SET_LANG:
      return {
        ...state,
        lang: action.payload.lang,
      };

    default:
      return state;
  }
};

export default reducer;
