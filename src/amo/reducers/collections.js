/* @flow */
import { oneLine } from 'common-tags';

import { createInternalAddon } from 'core/reducers/addons';
import type { AddonType, ExternalAddonType } from 'core/types/addons';

export const ADD_ADDON_TO_COLLECTION: 'ADD_ADDON_TO_COLLECTION'
  = 'ADD_ADDON_TO_COLLECTION';
export const FETCH_CURRENT_COLLECTION: 'FETCH_CURRENT_COLLECTION'
  = 'FETCH_CURRENT_COLLECTION';
export const FETCH_USER_COLLECTIONS: 'FETCH_USER_COLLECTIONS'
  = 'FETCH_USER_COLLECTIONS';
export const LOAD_CURRENT_COLLECTION: 'LOAD_CURRENT_COLLECTION'
  = 'LOAD_CURRENT_COLLECTION';
export const FETCH_CURRENT_COLLECTION_PAGE: 'FETCH_CURRENT_COLLECTION_PAGE'
  = 'FETCH_CURRENT_COLLECTION_PAGE';
export const LOAD_CURRENT_COLLECTION_PAGE: 'LOAD_CURRENT_COLLECTION_PAGE'
  = 'LOAD_CURRENT_COLLECTION_PAGE';
export const ABORT_FETCH_CURRENT_COLLECTION: 'ABORT_FETCH_CURRENT_COLLECTION'
  = 'ABORT_FETCH_CURRENT_COLLECTION';
export const ABORT_FETCH_USER_COLLECTIONS: 'ABORT_FETCH_USER_COLLECTIONS'
  = 'ABORT_FETCH_USER_COLLECTIONS';
export const ABORT_ADD_ADDON_TO_COLLECTION: 'ABORT_ADD_ADDON_TO_COLLECTION'
  = 'ABORT_ADD_ADDON_TO_COLLECTION';
export const LOAD_USER_COLLECTIONS: 'LOAD_USER_COLLECTIONS'
  = 'LOAD_USER_COLLECTIONS';
export const ADDON_ADDED_TO_COLLECTION: 'ADDON_ADDED_TO_COLLECTION'
  = 'ADDON_ADDED_TO_COLLECTION';
export const LOAD_COLLECTION_ADDONS: 'LOAD_COLLECTION_ADDONS'
  = 'LOAD_COLLECTION_ADDONS';

export type CollectionType = {
  addons: Array<AddonType> | null,
  authorId: number,
  authorName: string,
  authorUsername: string,
  description: string | null,
  id: number,
  lastUpdatedDate: string,
  name: string,
  numberOfAddons: number,
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
    [userId: number]: {|
      // This is a list of all collections belonging to the user.
      collections: Array<CollectionId> | null,
      loading: boolean,
    |};
  },
  addonInCollections: {
    [userId: number]: {
      [addonId: number]: {|
        // This is a list of all user collections that the add-on
        // is a part of.
        collections: Array<CollectionId> | null,
        loading: boolean,
      |};
    },
  },
};

export const initialState: CollectionsState = {
  byId: {},
  bySlug: {},
  current: { id: null, loading: false },
  userCollections: {},
  addonInCollections: {},
};

type FetchCurrentCollectionParams = {|
  errorHandlerId: string,
  page?: number,
  slug: string,
  user: number | string,
|};

type FetchCurrentCollectionAction = {|
  type: typeof FETCH_CURRENT_COLLECTION,
  payload: FetchCurrentCollectionParams,
|};

export const fetchCurrentCollection = ({
  errorHandlerId,
  page,
  slug,
  user,
}: FetchCurrentCollectionParams = {}): FetchCurrentCollectionAction => {
  if (!errorHandlerId) {
    throw new Error('errorHandlerId is required');
  }
  if (!slug) {
    throw new Error('slug is required');
  }
  if (!user) {
    throw new Error('user is required');
  }

  return {
    type: FETCH_CURRENT_COLLECTION,
    payload: { errorHandlerId, page, slug, user },
  };
};

type FetchUserCollectionsParams = {|
  errorHandlerId: string,
  userId: number,
|};

type FetchUserCollectionsAction = {|
  type: typeof FETCH_USER_COLLECTIONS,
  payload: FetchUserCollectionsParams,
|};

export const fetchUserCollections = ({
  errorHandlerId, userId,
}: FetchUserCollectionsParams = {}): FetchUserCollectionsAction => {
  if (!errorHandlerId) {
    throw new Error('errorHandlerId is required');
  }
  if (!userId) {
    throw new Error('userId is required');
  }

  return {
    type: FETCH_USER_COLLECTIONS,
    payload: { errorHandlerId, userId },
  };
};

type AbortFetchUserCollectionsParams = {|
  userId: number,
|};

type AbortFetchUserCollectionsAction = {|
  type: typeof ABORT_FETCH_USER_COLLECTIONS,
  payload: AbortFetchUserCollectionsParams,
|};

export const abortFetchUserCollections = (
  { userId }: AbortFetchUserCollectionsParams = {}
): AbortFetchUserCollectionsAction => {
  if (!userId) {
    throw new Error('userId is required');
  }

  return {
    type: ABORT_FETCH_USER_COLLECTIONS,
    payload: { userId },
  };
};

type AbortAddAddonToCollectionParams = {|
  userId: number,
  addonId: number,
|};

type AbortAddAddonToCollectionAction = {|
  type: typeof ABORT_ADD_ADDON_TO_COLLECTION,
  payload: AbortAddAddonToCollectionParams,
|};

export const abortAddAddonToCollection = (
  { userId, addonId }: AbortAddAddonToCollectionParams = {}
): AbortAddAddonToCollectionAction => {
  if (!userId) {
    throw new Error('userId is required');
  }
  if (!addonId) {
    throw new Error('addonId is required');
  }

  return {
    type: ABORT_ADD_ADDON_TO_COLLECTION,
    payload: { userId, addonId },
  };
};

type FetchCurrentCollectionPageParams = {|
  ...FetchCurrentCollectionParams,
  page: number,
|};

type FetchCurrentCollectionPageAction = {|
  type: typeof FETCH_CURRENT_COLLECTION_PAGE,
  payload: FetchCurrentCollectionPageParams,
|};

export const fetchCurrentCollectionPage = ({
  errorHandlerId,
  page,
  slug,
  user,
}: FetchCurrentCollectionPageParams = {}): FetchCurrentCollectionPageAction => {
  if (!errorHandlerId) {
    throw new Error('errorHandlerId is required');
  }
  if (!slug) {
    throw new Error('slug is required');
  }
  if (!user) {
    throw new Error('user is required');
  }
  if (!page) {
    throw new Error('page is required');
  }

  return {
    type: FETCH_CURRENT_COLLECTION_PAGE,
    payload: { errorHandlerId, page, slug, user },
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

export type CollectionAddonsListResponse = {|
  count: number,
  next: string,
  previous: string,
  results: ExternalCollectionAddons,
|};

type LoadCurrentCollectionParams = {|
  addons: CollectionAddonsListResponse,
  detail: ExternalCollectionDetail,
|};

type LoadCurrentCollectionAction = {|
  type: typeof LOAD_CURRENT_COLLECTION,
  payload: LoadCurrentCollectionParams,
|};

export const loadCurrentCollection = ({
  addons,
  detail,
}: LoadCurrentCollectionParams = {}): LoadCurrentCollectionAction => {
  if (!addons) {
    throw new Error('addons are required');
  }
  if (!detail) {
    throw new Error('detail is required');
  }

  return {
    type: LOAD_CURRENT_COLLECTION,
    payload: { addons, detail },
  };
};

type LoadCurrentCollectionPageParams = {|
  addons: CollectionAddonsListResponse,
|};

type LoadCurrentCollectionPageAction = {|
  type: typeof LOAD_CURRENT_COLLECTION_PAGE,
  payload: LoadCurrentCollectionPageParams,
|};

export const loadCurrentCollectionPage = ({
  addons,
}: LoadCurrentCollectionPageParams = {}): LoadCurrentCollectionPageAction => {
  if (!addons) {
    throw new Error('addons are required');
  }

  return {
    type: LOAD_CURRENT_COLLECTION_PAGE,
    payload: { addons },
  };
};

type LoadCollectionAddonsParams = {|
  addons: ExternalCollectionAddons,
  collectionSlug: string,
|};

type LoadCollectionAddonsAction = {|
  type: typeof LOAD_COLLECTION_ADDONS,
  payload: LoadCollectionAddonsParams,
|};

export const loadCollectionAddons = ({
  addons, collectionSlug,
}: LoadCollectionAddonsParams = {}): LoadCollectionAddonsAction => {
  if (!addons) {
    throw new Error('The addons parameter is required');
  }
  if (!collectionSlug) {
    throw new Error('The collectionSlug parameter is required');
  }

  return {
    type: LOAD_COLLECTION_ADDONS,
    payload: { addons, collectionSlug },
  };
};

type LoadUserCollectionsParams = {|
  userId: number,
  collections: Array<ExternalCollectionDetail>,
|};

type LoadUserCollectionsAction = {|
  type: typeof LOAD_USER_COLLECTIONS,
  payload: LoadUserCollectionsParams,
|};

export const loadUserCollections = (
  { userId, collections }: LoadUserCollectionsParams = {}
): LoadUserCollectionsAction => {
  if (!userId) {
    throw new Error('The userId parameter is required');
  }
  if (!collections) {
    throw new Error('The collections parameter is required');
  }

  return {
    type: LOAD_USER_COLLECTIONS,
    payload: { userId, collections },
  };
};

type AddonAddedToCollectionParams = {|
  addonId: number,
  userId: number,
  collectionId: CollectionId,
|};

type AddonAddedToCollectionAction = {|
  type: typeof ADDON_ADDED_TO_COLLECTION,
  payload: AddonAddedToCollectionParams,
|};

export const addonAddedToCollection = (
  { addonId, userId, collectionId }: AddonAddedToCollectionParams = {}
): AddonAddedToCollectionAction => {
  if (!addonId) {
    throw new Error('The addonId parameter is required');
  }
  if (!userId) {
    throw new Error('The userId parameter is required');
  }
  if (!collectionId) {
    throw new Error('The collectionId parameter is required');
  }

  return {
    type: ADDON_ADDED_TO_COLLECTION,
    payload: { addonId, userId, collectionId },
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
  collectionSlug: string,
  errorHandlerId: string,
  notes?: string,
  userId: number,
|};

type AddAddonToCollectionAction = {|
  type: typeof ADD_ADDON_TO_COLLECTION,
  payload: AddAddonToCollectionParams,
|};

export const addAddonToCollection = ({
  addonId, collectionId, collectionSlug, errorHandlerId, notes, userId,
}: AddAddonToCollectionParams = {}): AddAddonToCollectionAction => {
  if (!addonId) {
    throw new Error('The addonId parameter is required');
  }
  if (!collectionId) {
    throw new Error('The collectionId parameter is required');
  }
  if (!collectionSlug) {
    throw new Error('The collectionSlug parameter is required');
  }
  if (!errorHandlerId) {
    throw new Error('The errorHandlerId parameter is required');
  }
  if (!userId) {
    throw new Error('The userId parameter is required');
  }

  return {
    type: ADD_ADDON_TO_COLLECTION,
    payload: {
      addonId, collectionId, collectionSlug, errorHandlerId, notes, userId,
    },
  };
};

export const createInternalAddons = (
  items: ExternalCollectionAddons
): Array<AddonType> => {
  return items.map((item) => {
    // This allows to have a consistent way to manipulate addons in the app.
    return createInternalAddon(item.addon);
  });
};

type GetCollectionByIdParams = {|
  state: CollectionsState,
  id: CollectionId,
|};

export const getCollectionById = (
  { id, state }: GetCollectionByIdParams
): CollectionType | null => {
  if (!id) {
    throw new Error('The id parameter is required');
  }
  if (!state) {
    throw new Error('The state parameter is required');
  }

  return state.byId[id] || null;
};

export const getCurrentCollection = (
  state: CollectionsState
): CollectionType | null => {
  if (!state) {
    throw new Error('The state parameter is required');
  }
  if (!state.current.id) {
    return null;
  }

  return getCollectionById({ id: state.current.id, state });
};

type CreateInternalCollectionParams = {|
  detail: ExternalCollectionDetail,
  items?: ExternalCollectionAddons,
|};

export const createInternalCollection = ({
  detail,
  items,
}: CreateInternalCollectionParams): CollectionType => ({
  addons: items ? createInternalAddons(items) : null,
  authorId: detail.author.id,
  authorName: detail.author.name,
  authorUsername: detail.author.username,
  description: detail.description,
  id: detail.id,
  lastUpdatedDate: detail.modified,
  name: detail.name,
  numberOfAddons: detail.addon_count,
  slug: detail.slug,
});

type LoadCollectionIntoStateParams = {|
  state: CollectionsState,
  collection: ExternalCollectionDetail,
  addons?: ExternalCollectionAddons,
|};

export const loadCollectionIntoState = (
  { state, collection, addons }: LoadCollectionIntoStateParams
): CollectionsState => {
  const existingCollection = state.byId[collection.id];
  const internalCollection = createInternalCollection({
    detail: collection, items: addons,
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
  userId: number,
  state: CollectionsState,
  loading: boolean,
|};

export const changeAddonCollectionsLoadingFlag = ({
  addonId, userId, state, loading,
}: ChangeAddonCollectionsLoadingFlagParams = {}): CollectionsState => {
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

type Action =
  | AbortFetchCurrentCollection
  | AbortAddAddonToCollectionAction
  | AbortFetchUserCollectionsAction
  | AddAddonToCollectionAction
  | AddonAddedToCollectionAction
  | FetchCurrentCollectionAction
  | FetchCurrentCollectionPageAction
  | FetchUserCollectionsAction
  | LoadCollectionAddonsAction
  | LoadCurrentCollectionAction
  | LoadCurrentCollectionPageAction
  | LoadUserCollectionsAction
;

const reducer = (
  state: CollectionsState = initialState,
  action: Action
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
      const { addons, detail } = action.payload;

      const newState = loadCollectionIntoState({
        state, collection: detail, addons: addons.results,
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
      const { addons } = action.payload;

      const currentCollection = getCurrentCollection(state);
      if (!currentCollection) {
        throw new Error(
          `${action.type}: a current collection does not exist`);
      }

      return {
        ...state,
        byId: {
          ...state.byId,
          [currentCollection.id]: {
            ...currentCollection,
            addons: createInternalAddons(addons.results),
          },
        },
        current: {
          id: state.current.id,
          loading: false,
        },
      };
    }

    case LOAD_COLLECTION_ADDONS: {
      const { addons, collectionSlug } = action.payload;

      const collectionId = state.bySlug[collectionSlug];
      if (!collectionId) {
        throw new Error(
          oneLine`Cannot load add-ons for collection
          "${collectionSlug}" because the collection has not
          been loaded yet`);
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
          state: newState, collection,
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
      let collections = [];
      if (
        addonInCollections[userId] &&
        addonInCollections[userId][addonId]
      ) {
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
      };
    }

    case ADD_ADDON_TO_COLLECTION: {
      const { addonId, userId } = action.payload;

      return changeAddonCollectionsLoadingFlag({
        addonId,
        userId,
        state,
        loading: true,
      });
    }

    case ABORT_ADD_ADDON_TO_COLLECTION: {
      const { addonId, userId } = action.payload;

      return changeAddonCollectionsLoadingFlag({
        addonId,
        userId,
        state,
        loading: false,
      });
    }

    default:
      return state;
  }
};

export default reducer;
