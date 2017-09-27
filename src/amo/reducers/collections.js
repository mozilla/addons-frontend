/* @flow */
import { createInternalAddon } from 'core/reducers/addons';
import type { AddonType, ExternalAddonType } from 'core/types/addons';

export const FETCH_COLLECTION = 'FETCH_COLLECTION';
export const LOAD_COLLECTION = 'LOAD_COLLECTION';

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

export const fetchCollection = ({
  errorHandlerId,
  page,
  slug,
  user,
}: FetchCollectionParams = {}) => {
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

type CollectionAddonsResults = Array<{|
  addon: ExternalAddonType,
  downloads: number,
  notes: string | null,
|}>;

// The API returns more attributes than what is listed below.
type CollectionDetail = {
  addon_count: number,
  author: {
    name: string,
  },
  description: string | null,
  id: number,
  modified: string,
  name: string,
};

type LoadCollectionParams = {|
  addons: {
    results: CollectionAddonsResults,
  },
  detail: CollectionDetail,
  slug: string,
  user: number | string,
|};

export const loadCollection = ({
  addons,
  detail,
}: LoadCollectionParams = {}) => {
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

type CreateInternalCollectionParams = {|
  detail: CollectionDetail,
  items: CollectionAddonsResults,
|};

export const createInternalCollection = ({
  detail,
  items,
}: CreateInternalCollectionParams): CollectionType => ({
  addons: items.map((item) => {
    // This allows to have a consistent way to manipulate addons in the app.
    return createInternalAddon(item.addon);
  }),
  authorName: detail.author.name,
  description: detail.description,
  id: detail.id,
  lastUpdatedDate: detail.modified,
  name: detail.name,
  numberOfAddons: detail.addon_count,
});

const reducer = (
  state: CollectionsState = initialState,
  action: Object
): CollectionsState => {
  switch (action.type) {
    case FETCH_COLLECTION:
      return {
        // Current collection can be null if state is the initial state,
        // otherwise we have already loaded a collection. We cannot load
        // another collection from the collection view, so we can keep the
        // detail of the current collection and only use "loading indicator"
        // for the add-ons.
        current: state.current === null ? null : {
          ...state.current,
          // We reset the set of addons because they depend on pagination.
          // Other information still hold though.
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

    default:
      return state;
  }
};

export default reducer;
