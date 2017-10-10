/* @flow */
import { LANDING_PAGE_ADDON_COUNT } from 'amo/constants';
import { createInternalAddon } from 'core/reducers/addons';
import type { CollectionAddonsListResponse } from 'amo/reducers/collections';
import type { AddonType, ExternalAddonType } from 'core/types/addons';

export const FETCH_HOME_ADDONS: 'FETCH_HOME_ADDONS' = 'FETCH_HOME_ADDONS';
export const LOAD_HOME_ADDONS: 'LOAD_HOME_ADDONS' = 'LOAD_HOME_ADDONS';

export type HomeState = {
  featuredCollection: Array<AddonType>,
  featuredThemes: Array<AddonType>,
  trendingExtensions: Array<AddonType>,
  resultsLoaded: boolean,
};

export const initialState: HomeState = {
  featuredCollection: [],
  featuredThemes: [],
  trendingExtensions: [],
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

type ApiAddonsResponse = {|
  result: {|
    count: number,
    results: Array<string>,
  |},
  entities: {|
    addons: ExternalAddonMap,
  |},
|};

type LoadHomeAddonsParams = {|
  featuredCollection: CollectionAddonsListResponse,
  featuredThemes: ApiAddonsResponse,
  trendingExtensions: ApiAddonsResponse,
|};

type LoadHomeAddonsAction = {|
  type: typeof LOAD_HOME_ADDONS,
  payload: LoadHomeAddonsParams,
|};

export const loadHomeAddons = ({
  featuredCollection,
  featuredThemes,
  trendingExtensions,
}: LoadHomeAddonsParams): LoadHomeAddonsAction => {
  if (!featuredCollection) {
    throw new Error('featuredCollection is required');
  }
  if (!featuredThemes) {
    throw new Error('featuredThemes is required');
  }
  if (!trendingExtensions) {
    throw new Error('trendingExtensions is required');
  }

  return {
    type: LOAD_HOME_ADDONS,
    payload: {
      featuredCollection,
      featuredThemes,
      trendingExtensions,
    },
  };
};

type Action =
  | FetchHomeAddonsAction
  | LoadHomeAddonsAction;

const createInternalAddons = (
  response: ApiAddonsResponse
): Array<AddonType> => {
  return response.result.results.map((slug) => (
    createInternalAddon(response.entities.addons[slug])
  ));
};

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
        featuredThemes,
        trendingExtensions,
      } = action.payload;

      return {
        ...state,
        featuredCollection: featuredCollection.results
          .slice(0, LANDING_PAGE_ADDON_COUNT)
          .map((item) => {
            return createInternalAddon(item.addon);
          }),
        featuredThemes: createInternalAddons(featuredThemes),
        trendingExtensions: createInternalAddons(trendingExtensions),
        resultsLoaded: true,
      };
    }

    default:
      return state;
  }
};

export default reducer;
