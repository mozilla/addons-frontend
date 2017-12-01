/* @flow */
import { createInternalAddon } from 'core/reducers/addons';
import type { AddonType, ExternalAddonType } from 'core/types/addons';

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
export const LOAD_USER_COLLECTIONS: 'LOAD_USER_COLLECTIONS'
  = 'LOAD_USER_COLLECTIONS';

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

type CollectionId = number;

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
      collections: Array<CollectionId> | null,
      loading: boolean,
    |};
  },
};

export const initialState: CollectionsState = {
  byId: {},
  bySlug: {},
  current: { id: null, loading: false },
  userCollections: {},
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
  errorHandlerId,
  userId,
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

type ExternalCollectionAddons = Array<{|
  addon: ExternalAddonType,
  downloads: number,
  notes: string | null,
|}>;

type ExternalCollectionDetail = {|
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

type AbortFetchCurrentCollection = {|
  type: typeof ABORT_FETCH_CURRENT_COLLECTION,
|};

export const abortFetchCurrentCollection = (): AbortFetchCurrentCollection => {
  return { type: ABORT_FETCH_CURRENT_COLLECTION };
};

type CreateInternalCollectionParams = {|
  detail: ExternalCollectionDetail,
  items?: ExternalCollectionAddons,
|};

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

type Action =
  | FetchCurrentCollectionAction
  | LoadCurrentCollectionAction
  | FetchCurrentCollectionPageAction
  | LoadCurrentCollectionPageAction
  | AbortFetchCurrentCollection
  | FetchUserCollectionsAction
  | LoadUserCollectionsAction
  | AbortFetchUserCollectionsAction
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

      return {
        ...state,
        byId: {
          ...state.byId,
          [detail.id]: createInternalCollection({
            detail,
            items: addons.results,
          }),
        },
        bySlug: {
          ...state.bySlug,
          [detail.slug]: detail.id,
        },
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

      const byId = { ...state.byId };
      collections.forEach((collection) => {
        byId[collection.id] = createInternalCollection({
          detail: collection,
        });
      });

      return {
        ...state,
        byId,
        userCollections: {
          ...state.userCollections,
          [userId]: {
            collections: collections.map((collection) => collection.id),
            loading: false,
          },
        },
      };
    }

    default:
      return state;
  }
};

export default reducer;
