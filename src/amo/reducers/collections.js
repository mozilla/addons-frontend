/* @flow */
import { createInternalAddon } from 'core/reducers/addons';
import type { AddonType, ExternalAddonType } from 'core/types/addons';

export const FETCH_COLLECTION: 'FETCH_COLLECTION' = 'FETCH_COLLECTION';
export const LOAD_COLLECTION: 'LOAD_COLLECTION' = 'LOAD_COLLECTION';
export const FETCH_COLLECTION_PAGE: 'FETCH_COLLECTION_PAGE'
  = 'FETCH_COLLECTION_PAGE';
export const LOAD_COLLECTION_PAGE: 'LOAD_COLLECTION_PAGE'
  = 'LOAD_COLLECTION_PAGE';
export const ABORT_FETCH_COLLECTION: 'ABORT_FETCH_COLLECTION' = 'ABORT_FETCH_COLLECTION';

export type CollectionType = {
  addons: Array<AddonType>,
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
  current: {|
    id: CollectionId | null,
    loading: boolean,
  |},
};

export const initialState: CollectionsState = {
  byId: {},
  bySlug: {},
  current: { id: null, loading: false },
};

type FetchCollectionParams = {|
  errorHandlerId: string,
  page?: number,
  slug: string,
  user: number | string,
|};

type FetchCollectionAction = {|
  type: typeof FETCH_COLLECTION,
  payload: FetchCollectionParams,
|};

export const fetchCollection = ({
  errorHandlerId,
  page,
  slug,
  user,
}: FetchCollectionParams = {}): FetchCollectionAction => {
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
    type: FETCH_COLLECTION,
    payload: { errorHandlerId, page, slug, user },
  };
};

type FetchCollectionPageParams = {|
  ...FetchCollectionParams,
  page: number,
|};

type FetchCollectionPageAction = {|
  type: typeof FETCH_COLLECTION_PAGE,
  payload: FetchCollectionPageParams,
|};

export const fetchCollectionPage = ({
  errorHandlerId,
  page,
  slug,
  user,
}: FetchCollectionPageParams = {}): FetchCollectionPageAction => {
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
    type: FETCH_COLLECTION_PAGE,
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

type LoadCollectionParams = {|
  addons: CollectionAddonsListResponse,
  detail: ExternalCollectionDetail,
|};

type LoadCollectionAction = {|
  type: typeof LOAD_COLLECTION,
  payload: LoadCollectionParams,
|};

export const loadCollection = ({
  addons,
  detail,
}: LoadCollectionParams = {}): LoadCollectionAction => {
  if (!addons) {
    throw new Error('addons are required');
  }
  if (!detail) {
    throw new Error('detail is required');
  }

  return {
    type: LOAD_COLLECTION,
    payload: { addons, detail },
  };
};

type LoadCollectionPageParams = {|
  addons: CollectionAddonsListResponse,
|};

type LoadCollectionPageAction = {|
  type: typeof LOAD_COLLECTION_PAGE,
  payload: LoadCollectionPageParams,
|};

export const loadCollectionPage = ({
  addons,
}: LoadCollectionPageParams = {}): LoadCollectionPageAction => {
  if (!addons) {
    throw new Error('addons are required');
  }

  return {
    type: LOAD_COLLECTION_PAGE,
    payload: { addons },
  };
};

type AbortFetchCollection = {|
  type: typeof ABORT_FETCH_COLLECTION,
|};

export const abortFetchCollection = (): AbortFetchCollection => {
  return { type: ABORT_FETCH_COLLECTION };
};

type CreateInternalCollectionParams = {|
  detail: ExternalCollectionDetail,
  items: ExternalCollectionAddons,
|};

export const createInternalAddons = (
  items: ExternalCollectionAddons
): Array<AddonType> => {
  return items.map((item) => {
    // This allows to have a consistent way to manipulate addons in the app.
    return createInternalAddon(item.addon);
  });
};

export const createInternalCollection = ({
  detail,
  items,
}: CreateInternalCollectionParams): CollectionType => ({
  addons: createInternalAddons(items),
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
  | FetchCollectionAction
  | LoadCollectionAction
  | FetchCollectionPageAction
  | LoadCollectionPageAction
  | AbortFetchCollection
;

const reducer = (
  state: CollectionsState = initialState,
  action: Action
): CollectionsState => {
  switch (action.type) {
    case FETCH_COLLECTION:
      return {
        ...state,
        current: {
          id: null,
          loading: true,
        },
      };

    case FETCH_COLLECTION_PAGE: {
      const current = {
        id: state.current.id,
        loading: true,
      };

      let currentCollection;
      if (state.current.id) {
        currentCollection = state.byId[state.current.id];
      }
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

    case LOAD_COLLECTION: {
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

    case LOAD_COLLECTION_PAGE: {
      const { addons } = action.payload;

      let currentCollection;
      if (state.current.id) {
        currentCollection = state.byId[state.current.id];
      }
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

    case ABORT_FETCH_COLLECTION:
      return {
        ...state,
        current: {
          id: null,
          loading: false,
        },
      };

    default:
      return state;
  }
};

export default reducer;
