/* @flow */
import { oneLine } from 'common-tags';
import invariant from 'invariant';

import { createInternalAddon } from 'core/reducers/addons';
import type { CollectionAddonType, ExternalAddonType } from 'core/types/addons';
import type { LocalizedString } from 'core/types/api';

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
export const DELETE_COLLECTION: 'DELETE_COLLECTION' = 'DELETE_COLLECTION';
export const UPDATE_COLLECTION_ADDON: 'UPDATE_COLLECTION_ADDON' =
  'UPDATE_COLLECTION_ADDON';
export const DELETE_COLLECTION_ADDON_NOTES: 'DELETE_COLLECTION_ADDON_NOTES' =
  'DELETE_COLLECTION_ADDON_NOTES';

export type CollectionFilters = {|
  page: number,
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
  numberOfAddons: number,
  pageSize: number | null,
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
    [username: string]: {|
      // This is a list of all collections belonging to the user.
      collections: Array<CollectionId> | null,
      loading: boolean,
    |},
  },
  addonInCollections: {
    [username: string]: {
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
};

export const initialState: CollectionsState = {
  byId: {},
  bySlug: {},
  current: { id: null, loading: false },
  userCollections: {},
  addonInCollections: {},
  isCollectionBeingModified: false,
  hasAddonBeenAdded: false,
};

type FetchCurrentCollectionParams = {|
  errorHandlerId: string,
  filters?: CollectionFilters,
  slug: string,
  username: string,
|};

export type FetchCurrentCollectionAction = {|
  type: typeof FETCH_CURRENT_COLLECTION,
  payload: FetchCurrentCollectionParams,
|};

export const fetchCurrentCollection = ({
  errorHandlerId,
  filters,
  slug,
  username,
}: FetchCurrentCollectionParams = {}): FetchCurrentCollectionAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(slug, 'slug is required');
  invariant(username, 'username is required');

  return {
    type: FETCH_CURRENT_COLLECTION,
    payload: { errorHandlerId, filters, slug, username },
  };
};

type FetchUserCollectionsParams = {|
  errorHandlerId: string,
  username: string,
|};

export type FetchUserCollectionsAction = {|
  type: typeof FETCH_USER_COLLECTIONS,
  payload: FetchUserCollectionsParams,
|};

export const fetchUserCollections = ({
  errorHandlerId,
  username,
}: FetchUserCollectionsParams = {}): FetchUserCollectionsAction => {
  if (!errorHandlerId) {
    throw new Error('errorHandlerId is required');
  }
  if (!username) {
    throw new Error('username is required');
  }

  return {
    type: FETCH_USER_COLLECTIONS,
    payload: { errorHandlerId, username },
  };
};

type AbortFetchUserCollectionsParams = {|
  username: string,
|};

type AbortFetchUserCollectionsAction = {|
  type: typeof ABORT_FETCH_USER_COLLECTIONS,
  payload: AbortFetchUserCollectionsParams,
|};

export const abortFetchUserCollections = ({
  username,
}: AbortFetchUserCollectionsParams = {}): AbortFetchUserCollectionsAction => {
  if (!username) {
    throw new Error('username is required');
  }

  return {
    type: ABORT_FETCH_USER_COLLECTIONS,
    payload: { username },
  };
};

type AbortAddAddonToCollectionParams = {|
  addonId: number,
  username: string,
|};

type AbortAddAddonToCollectionAction = {|
  type: typeof ABORT_ADD_ADDON_TO_COLLECTION,
  payload: AbortAddAddonToCollectionParams,
|};

export const abortAddAddonToCollection = ({
  addonId,
  username,
}: AbortAddAddonToCollectionParams = {}): AbortAddAddonToCollectionAction => {
  if (!username) {
    throw new Error('username is required');
  }
  if (!addonId) {
    throw new Error('addonId is required');
  }

  return {
    type: ABORT_ADD_ADDON_TO_COLLECTION,
    payload: { username, addonId },
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
  username,
}: FetchCurrentCollectionParams = {}): FetchCurrentCollectionPageAction => {
  if (!errorHandlerId) {
    throw new Error('errorHandlerId is required');
  }
  if (!slug) {
    throw new Error('slug is required');
  }
  if (!username) {
    throw new Error('username is required');
  }

  return {
    type: FETCH_CURRENT_COLLECTION_PAGE,
    payload: { errorHandlerId, filters, slug, username },
  };
};

export type ExternalCollectionAddon = {|
  addon: ExternalAddonType,
  downloads: number,
  notes: string | null,
|};

type ExternalCollectionAddons = Array<ExternalCollectionAddon>;

export type ExternalCollectionDetail = {|
  addon_count: number,
  author: {|
    id: number,
    name: string,
    url: string,
    username: string,
  |},
  default_locale: string,
  description: string | null,
  id: number,
  modified: string,
  name: string,
  public: boolean,
  slug: string,
  url: string,
  uuid: string,
|};

export type ExternalCollectionDetailWithLocalizedStrings = {|
  ...ExternalCollectionDetail,
  description: LocalizedString | null,
  name: LocalizedString,
|};

export type CollectionAddonsListResponse = {|
  count: number,
  next: string,
  previous: string,
  results: ExternalCollectionAddons,
|};

type LoadCurrentCollectionParams = {|
  addons: ExternalCollectionAddons,
  detail: ExternalCollectionDetail,
  pageSize: number | null,
|};

type LoadCurrentCollectionAction = {|
  type: typeof LOAD_CURRENT_COLLECTION,
  payload: LoadCurrentCollectionParams,
|};

export const loadCurrentCollection = ({
  addons,
  detail,
  pageSize,
}: LoadCurrentCollectionParams = {}): LoadCurrentCollectionAction => {
  invariant(addons, 'addons are required');
  invariant(detail, 'detail is required');

  return {
    type: LOAD_CURRENT_COLLECTION,
    payload: { addons, detail, pageSize },
  };
};

type LoadCurrentCollectionPageParams = {|
  addons: ExternalCollectionAddons,
  numberOfAddons: number,
  pageSize: number,
|};

type LoadCurrentCollectionPageAction = {|
  type: typeof LOAD_CURRENT_COLLECTION_PAGE,
  payload: LoadCurrentCollectionPageParams,
|};

export const loadCurrentCollectionPage = ({
  addons,
  numberOfAddons,
  pageSize,
}: LoadCurrentCollectionPageParams = {}): LoadCurrentCollectionPageAction => {
  invariant(addons, 'The addons parameter is required');
  invariant(
    typeof numberOfAddons === 'number',
    'The numberOfAddons parameter must be a number',
  );
  invariant(typeof pageSize === 'number', 'pageSize is required');

  return {
    type: LOAD_CURRENT_COLLECTION_PAGE,
    payload: { addons, numberOfAddons, pageSize },
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
}: LoadCollectionAddonsParams = {}): LoadCollectionAddonsAction => {
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
  username: string,
|};

type LoadUserCollectionsAction = {|
  type: typeof LOAD_USER_COLLECTIONS,
  payload: LoadUserCollectionsParams,
|};

export const loadUserCollections = ({
  collections,
  username,
}: LoadUserCollectionsParams = {}): LoadUserCollectionsAction => {
  if (!username) {
    throw new Error('The username parameter is required');
  }
  if (!collections) {
    throw new Error('The collections parameter is required');
  }

  return {
    type: LOAD_USER_COLLECTIONS,
    payload: { username, collections },
  };
};

type AddonAddedToCollectionParams = {|
  addonId: number,
  collectionId: CollectionId,
  username: string,
|};

type AddonAddedToCollectionAction = {|
  type: typeof ADDON_ADDED_TO_COLLECTION,
  payload: AddonAddedToCollectionParams,
|};

export const addonAddedToCollection = ({
  addonId,
  collectionId,
  username,
}: AddonAddedToCollectionParams = {}): AddonAddedToCollectionAction => {
  if (!addonId) {
    throw new Error('The addonId parameter is required');
  }
  if (!username) {
    throw new Error('The username parameter is required');
  }
  if (!collectionId) {
    throw new Error('The collectionId parameter is required');
  }

  return {
    type: ADDON_ADDED_TO_COLLECTION,
    payload: { addonId, collectionId, username },
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
  notes?: string,
  slug: string,
  username: string,
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
  username,
}: AddAddonToCollectionParams = {}): AddAddonToCollectionAction => {
  invariant(addonId, 'The addonId parameter is required');
  invariant(collectionId, 'The collectionId parameter is required');
  invariant(slug, 'The slug parameter is required');
  invariant(errorHandlerId, 'The errorHandlerId parameter is required');
  invariant(username, 'The username parameter is required');

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
      username,
    },
  };
};

export type RequiredModifyCollectionParams = {|
  errorHandlerId: string,
  username: string,
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
  username,
}: CreateCollectionParams = {}): CreateCollectionAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(username, 'username is required');
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
      username,
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
  username,
}: UpdateCollectionParams = {}): UpdateCollectionAction => {
  invariant(collectionSlug, 'collectionSlug is required when updating');
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(filters, 'filters is required');
  invariant(username, 'username is required');

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
      username,
    },
  };
};

type BeginCollectionModificationAction = {|
  type: typeof BEGIN_COLLECTION_MODIFICATION,
  payload: null,
|};

export const beginCollectionModification = (): BeginCollectionModificationAction => {
  return {
    type: BEGIN_COLLECTION_MODIFICATION,
    payload: null,
  };
};

type FinishCollectionModificationAction = {|
  type: typeof FINISH_COLLECTION_MODIFICATION,
  payload: null,
|};

export const finishCollectionModification = (): FinishCollectionModificationAction => {
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
  username: string,
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
  username,
}: RemoveAddonFromCollectionParams = {}): RemoveAddonFromCollectionAction => {
  invariant(addonId, 'The addonId parameter is required');
  invariant(errorHandlerId, 'The errorHandlerId parameter is required');
  invariant(filters, 'The filters parameter is required');
  invariant(slug, 'The slug parameter is required');
  invariant(username, 'The username parameter is required');

  return {
    type: REMOVE_ADDON_FROM_COLLECTION,
    payload: {
      addonId,
      errorHandlerId,
      filters,
      slug,
      username,
    },
  };
};

type DeleteCollectionParams = {|
  errorHandlerId: string,
  slug: string,
  username: string,
|};

export type DeleteCollectionAction = {|
  type: typeof DELETE_COLLECTION,
  payload: DeleteCollectionParams,
|};

export const deleteCollection = ({
  errorHandlerId,
  slug,
  username,
}: DeleteCollectionParams = {}): DeleteCollectionAction => {
  invariant(errorHandlerId, 'The errorHandlerId parameter is required');
  invariant(slug, 'The slug parameter is required');
  invariant(username, 'The username parameter is required');

  return {
    type: DELETE_COLLECTION,
    payload: {
      errorHandlerId,
      slug,
      username,
    },
  };
};

type UpdateCollectionAddonParams = {|
  addonId: number,
  errorHandlerId: string,
  filters: CollectionFilters,
  notes: string,
  slug: string,
  username: string,
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
  username,
}: UpdateCollectionAddonParams = {}): UpdateCollectionAddonAction => {
  invariant(addonId, 'The addonId parameter is required');
  invariant(errorHandlerId, 'The errorHandlerId parameter is required');
  invariant(
    notes !== undefined && notes !== null,
    'The notes parameter is required',
  );
  invariant(filters, 'The filters parameter is required');
  invariant(slug, 'The slug parameter is required');
  invariant(username, 'The username parameter is required');

  return {
    type: UPDATE_COLLECTION_ADDON,
    payload: {
      addonId,
      errorHandlerId,
      notes,
      filters,
      slug,
      username,
    },
  };
};

type DeleteCollectionAddonNotesParams = {|
  addonId: number,
  errorHandlerId: string,
  filters: CollectionFilters,
  slug: string,
  username: string,
|};

export type DeleteCollectionAddonNotesAction = {|
  type: typeof DELETE_COLLECTION_ADDON_NOTES,
  payload: UpdateCollectionAddonParams,
|};

export const deleteCollectionAddonNotes = ({
  addonId,
  errorHandlerId,
  filters,
  slug,
  username,
}: DeleteCollectionAddonNotesParams = {}): DeleteCollectionAddonNotesAction => {
  invariant(addonId, 'The addonId parameter is required');
  invariant(errorHandlerId, 'The errorHandlerId parameter is required');
  invariant(filters, 'The filters parameter is required');
  invariant(slug, 'The slug parameter is required');
  invariant(username, 'The username parameter is required');

  // For delete we set the notes field to an empty string and call update.
  // TODO: Use a null instead when https://github.com/mozilla/addons-server/issues/7832 is fixed.
  return {
    type: DELETE_COLLECTION_ADDON_NOTES,
    payload: {
      addonId,
      errorHandlerId,
      filters,
      notes: '',
      slug,
      username,
    },
  };
};

export const createInternalAddons = (
  items: ExternalCollectionAddons,
): Array<CollectionAddonType> => {
  return items.map(({ addon, notes }) => {
    // This allows to have a consistent way to manipulate addons in the app.
    return {
      ...createInternalAddon(addon),
      notes,
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
  detail: ExternalCollectionDetail,
  items?: ExternalCollectionAddons,
  pageSize: number | null,
|};

export const createInternalCollection = ({
  detail,
  items,
  pageSize,
}: CreateInternalCollectionParams): CollectionType => ({
  addons: items ? createInternalAddons(items) : null,
  authorId: detail.author.id,
  authorName: detail.author.name,
  authorUsername: detail.author.username,
  defaultLocale: detail.default_locale,
  description: detail.description,
  id: detail.id,
  lastUpdatedDate: detail.modified,
  name: detail.name,
  numberOfAddons: detail.addon_count,
  pageSize,
  slug: detail.slug,
});

type LoadCollectionIntoStateParams = {|
  state: CollectionsState,
  collection: ExternalCollectionDetail,
  addons?: ExternalCollectionAddons,
  pageSize: number | null,
|};

export const loadCollectionIntoState = ({
  state,
  collection,
  addons,
  pageSize,
}: LoadCollectionIntoStateParams): CollectionsState => {
  const existingCollection = state.byId[collection.id];
  const internalCollection = createInternalCollection({
    detail: collection,
    items: addons,
    pageSize,
  });
  // In case the new collection isn't loaded with add-ons,
  // make sure we don't overwrite any existing addons.
  if (!internalCollection.addons && existingCollection) {
    internalCollection.addons = existingCollection.addons;
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
  username: string,
|};

export const changeAddonCollectionsLoadingFlag = ({
  addonId,
  loading,
  state,
  username,
}: ChangeAddonCollectionsLoadingFlagParams = {}): CollectionsState => {
  const userState = state.addonInCollections[username];
  const addonState = userState && userState[addonId];

  return {
    ...state,
    addonInCollections: {
      ...state.addonInCollections,
      [username]: {
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
  username: string,
|};

const unloadUserCollections = ({
  state,
  username,
}: UnloadUserCollectionsParams = {}): CollectionsState => {
  return {
    ...state,
    userCollections: {
      ...state.userCollections,
      [username]: {
        collections: null,
        loading: false,
      },
    },
  };
};

type LocalizeCollectionDetailParams = {|
  detail: ExternalCollectionDetailWithLocalizedStrings,
  lang: string,
|};

export const localizeCollectionDetail = ({
  detail,
  lang,
}: LocalizeCollectionDetailParams): ExternalCollectionDetail => {
  invariant(detail, 'detail is required for localizeCollectionDetail');
  invariant(lang, 'lang is required for localizeCollectionDetail');

  // Flow will not allow us to use the spread operator here, so we have
  // to repeat all the fields.
  return {
    addon_count: detail.addon_count,
    author: detail.author,
    default_locale: detail.default_locale,
    description: detail.description ? detail.description[lang] : null,
    id: detail.id,
    modified: detail.modified,
    name: detail.name[lang],
    public: detail.public,
    slug: detail.slug,
    url: detail.url,
    uuid: detail.uuid,
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

export const convertFiltersToQueryParams = (filters: CollectionFilters) => {
  return {
    page: filters.page,
    collection_sort: filters.collectionSort,
  };
};

type CollectionUrlParams = {|
  authorUsername?: string,
  collection: CollectionType | null,
  collectionSlug?: string,
  _collectionUrl?: Function,
|};

export const collectionUrl = ({
  authorUsername,
  collection,
  collectionSlug,
}: CollectionUrlParams): string => {
  let slug = collectionSlug;
  let username = authorUsername;
  if (collection) {
    slug = collection.slug;
    username = collection.authorUsername;
  }
  invariant(
    slug && username,
    'Either a collection or an authorUsername and collectionSlug are required.',
  );

  return `/collections/${username}/${slug}/`;
};

export const collectionEditUrl = ({
  authorUsername,
  collection,
  collectionSlug,
  _collectionUrl = collectionUrl,
}: CollectionUrlParams): string => {
  return `${_collectionUrl({
    authorUsername,
    collection,
    collectionSlug,
  })}edit/`;
};

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
          },
        },
        current,
      };
    }

    case LOAD_CURRENT_COLLECTION: {
      const { addons, detail, pageSize } = action.payload;

      const newState = loadCollectionIntoState({
        state,
        collection: detail,
        addons,
        pageSize,
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
      const { addons, numberOfAddons, pageSize } = action.payload;

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
            addons: createInternalAddons(addons),
            numberOfAddons,
            pageSize,
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
            addons: createInternalAddons(addons),
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
      const { username } = action.payload;

      return {
        ...state,
        userCollections: {
          ...state.userCollections,
          [username]: {
            collections: null,
            loading: true,
          },
        },
      };
    }

    case ABORT_FETCH_USER_COLLECTIONS: {
      const { username } = action.payload;

      return {
        ...state,
        userCollections: {
          ...state.userCollections,
          [username]: {
            collections: null,
            loading: false,
          },
        },
      };
    }

    case LOAD_USER_COLLECTIONS: {
      const { collections, username } = action.payload;

      let newState = { ...state };
      collections.forEach((collection) => {
        newState = loadCollectionIntoState({
          state: newState,
          collection,
          pageSize: null,
        });
      });

      return {
        ...newState,
        userCollections: {
          ...state.userCollections,
          [username]: {
            collections: collections.map((collection) => collection.id),
            loading: false,
          },
        },
      };
    }

    case ADDON_ADDED_TO_COLLECTION: {
      const { addonId, collectionId, username } = action.payload;
      const { addonInCollections } = state;
      let collections = [];
      if (
        addonInCollections[username] &&
        addonInCollections[username][addonId]
      ) {
        const existingCollections =
          addonInCollections[username][addonId].collections;
        if (existingCollections) {
          collections = existingCollections;
        }
      }

      return {
        ...state,
        addonInCollections: {
          ...state.addonInCollections,
          [username]: {
            ...state.addonInCollections[username],
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
      const { addonId, username } = action.payload;

      const newState = changeAddonCollectionsLoadingFlag({
        addonId,
        username,
        state,
        loading: true,
      });
      return {
        ...newState,
        hasAddonBeenAdded: false,
      };
    }

    case ABORT_ADD_ADDON_TO_COLLECTION: {
      const { addonId, username } = action.payload;

      const newState = changeAddonCollectionsLoadingFlag({
        addonId,
        username,
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
        const newIdMap = { ...state.byId };
        delete newIdMap[collectionId];
        return { ...state, byId: newIdMap };
      }
      return state;
    }

    case CREATE_COLLECTION:
    case DELETE_COLLECTION:
    case UPDATE_COLLECTION: {
      const { username } = action.payload;
      return unloadUserCollections({ state, username });
    }

    default:
      return state;
  }
};

export default reducer;
