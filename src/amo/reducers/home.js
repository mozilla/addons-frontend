/* @flow */
import { LANDING_PAGE_ADDON_COUNT } from 'amo/constants';
import { createInternalAddon } from 'core/reducers/addons';
import type { CollectionAddonsListResponse } from 'amo/reducers/collections';
import type { AddonType, ExternalAddonType } from 'core/types/addons';

export const FETCH_HOME_ADDONS: 'FETCH_HOME_ADDONS' = 'FETCH_HOME_ADDONS';
export const LOAD_HOME_ADDONS: 'LOAD_HOME_ADDONS' = 'LOAD_HOME_ADDONS';

export type HomeState = {
  featuredCollection: Array<AddonType>,
  popularExtensions: Array<AddonType>,
  resultsLoaded: boolean,
};

export const initialState: HomeState = {
  featuredCollection: [],
  popularExtensions: [],
  resultsLoaded: false,
};

type FetchHomeAddonsParams = {|
  errorHandlerId: string,
  featuredCollectionSlug: string,
  featuredCollectionUser: string,
|};

type FetchHomeAddonsAction = {|
  type: typeof FETCH_HOME_ADDONS,
  payload: FetchHomeAddonsParams,
|};

export const fetchHomeAddons = ({
  errorHandlerId,
  featuredCollectionSlug,
  featuredCollectionUser,
}: FetchHomeAddonsParams): FetchHomeAddonsAction => {
  if (!errorHandlerId) {
    throw new Error('errorHandlerId is required');
  }
  if (!featuredCollectionSlug) {
    throw new Error('featuredCollectionSlug is required');
  }
  if (!featuredCollectionUser) {
    throw new Error('featuredCollectionUser is required');
  }

  return {
    type: FETCH_HOME_ADDONS,
    payload: {
      errorHandlerId,
      featuredCollectionSlug,
      featuredCollectionUser,
    },
  };
};

type ExternalAddonMap = {
  [addonSlug: string]: ExternalAddonType,
};

type LoadHomeAddonsParams = {|
  featuredCollection: CollectionAddonsListResponse,
  popularExtensions: {|
    result: {|
      count: number,
      results: Array<string>,
    |},
    entities: {|
      addons: ExternalAddonMap,
    |},
  |},
|};

type LoadHomeAddonsAction = {|
  type: typeof LOAD_HOME_ADDONS,
  payload: LoadHomeAddonsParams,
|};

export const loadHomeAddons = ({
  featuredCollection,
  popularExtensions,
}: LoadHomeAddonsParams): LoadHomeAddonsAction => {
  if (!featuredCollection) {
    throw new Error('featuredCollection is required');
  }
  if (!popularExtensions) {
    throw new Error('popularExtensions is required');
  }

  return {
    type: LOAD_HOME_ADDONS,
    payload: {
      featuredCollection,
      popularExtensions,
    },
  };
};

type Action =
  | FetchHomeAddonsAction
  | LoadHomeAddonsAction;

const reducer = (
  state: HomeState = initialState,
  action: Action
): HomeState => {
  switch (action.type) {
    case FETCH_HOME_ADDONS:
      return {
        ...state,
        resultsLoaded: false,
      };

    case LOAD_HOME_ADDONS: {
      const {
        featuredCollection,
        popularExtensions,
      } = action.payload;

      return {
        ...state,
        featuredCollection: featuredCollection.results
          .slice(0, LANDING_PAGE_ADDON_COUNT)
          .map((item) => {
            return createInternalAddon(item.addon);
          }),
        popularExtensions: popularExtensions.result.results.map((slug) => (
          createInternalAddon(popularExtensions.entities.addons[slug])
        )),
        resultsLoaded: true,
      };
    }

    default:
      return state;
  }
};

export default reducer;
