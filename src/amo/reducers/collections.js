/* @flow */
import { createInternalAddon } from 'core/reducers/addons';
import type { AddonType, ExternalAddonType } from 'core/types/addons';

export const FETCH_COLLECTION: 'FETCH_COLLECTION' = 'FETCH_COLLECTION';
export const LOAD_COLLECTION: 'LOAD_COLLECTION' = 'LOAD_COLLECTION';
export const FETCH_COLLECTION_PAGE: 'FETCH_COLLECTION_PAGE'
  = 'FETCH_COLLECTION_PAGE';
export const LOAD_COLLECTION_PAGE: 'LOAD_COLLECTION_PAGE'
  = 'LOAD_COLLECTION_PAGE';

export type CollectionType = {
  addons: Array<AddonType>,
  authorName: string,
  description: string | null,
  id: number,
  lastUpdatedDate: string,
  name: string,
  numberOfAddons: number,
};

export type CollectionsState = {|
  current: CollectionType | null,
  loading: boolean,
|};

export const initialState: CollectionsState = {
  current: null,
  loading: false,
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

type CollectionAddonsListResponse = {|
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
  authorName: detail.author.name,
  description: detail.description,
  id: detail.id,
  lastUpdatedDate: detail.modified,
  name: detail.name,
  numberOfAddons: detail.addon_count,
});

type Action =
  | FetchCollectionAction
  | LoadCollectionAction
  | FetchCollectionPageAction
  | LoadCollectionPageAction
;

const reducer = (
  state: CollectionsState = initialState,
  action: Action
): CollectionsState => {
  switch (action.type) {
    case FETCH_COLLECTION:
      return {
        current: null,
        loading: true,
      };

    case FETCH_COLLECTION_PAGE:
      return {
        current: {
          ...state.current,
          addons: [],
        },
        loading: true,
      };

    case LOAD_COLLECTION: {
      const { addons, detail } = action.payload;

      return {
        current: createInternalCollection({
          detail,
          items: addons.results,
        }),
        loading: false,
      };
    }

    case LOAD_COLLECTION_PAGE: {
      const { addons } = action.payload;

      return {
        current: {
          ...state.current,
          addons: createInternalAddons(addons.results),
        },
        loading: false,
      };
    }

    default:
      return state;
  }
};

export default reducer;
