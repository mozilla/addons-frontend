/* @flow */
import { LANDING_PAGE_ADDON_COUNT } from 'amo/constants';
import { createInternalAddon } from 'core/reducers/addons';
import type { CollectionAddonsListResponse } from 'amo/reducers/collections';
import type { AddonType, ExternalAddonType } from 'core/types/addons';

export const FETCH_HOME_ADDONS: 'FETCH_HOME_ADDONS' = 'FETCH_HOME_ADDONS';
export const LOAD_HOME_ADDONS: 'LOAD_HOME_ADDONS' = 'LOAD_HOME_ADDONS';

export type HomeState = {
  firstCollection: Array<AddonType>,
  featuredExtensions: Array<AddonType>,
  featuredThemes: Array<AddonType>,
  popularExtensions: Array<AddonType>,
  resultsLoaded: boolean,
  topRatedExtensions: Array<AddonType>,
};

export const initialState: HomeState = {
  firstCollection: [],
  featuredExtensions: [],
  featuredThemes: [],
  popularExtensions: [],
  resultsLoaded: false,
  topRatedExtensions: [],
};

type FetchHomeAddonsParams = {|
  errorHandlerId: string,
  firstCollectionSlug: string,
  firstCollectionUser: string,
|};

type FetchHomeAddonsAction = {|
  type: typeof FETCH_HOME_ADDONS,
  payload: FetchHomeAddonsParams,
|};

export const fetchHomeAddons = ({
  errorHandlerId,
  firstCollectionSlug,
  firstCollectionUser,
}: FetchHomeAddonsParams): FetchHomeAddonsAction => {
  if (!errorHandlerId) {
    throw new Error('errorHandlerId is required');
  }
  if (!firstCollectionSlug) {
    throw new Error('firstCollectionSlug is required');
  }
  if (!firstCollectionUser) {
    throw new Error('firstCollectionUser is required');
  }

  return {
    type: FETCH_HOME_ADDONS,
    payload: {
      errorHandlerId,
      firstCollectionSlug,
      firstCollectionUser,
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
  firstCollection: CollectionAddonsListResponse,
  featuredExtensions: ApiAddonsResponse,
  featuredThemes: ApiAddonsResponse,
  popularExtensions: ApiAddonsResponse,
  topRatedExtensions: ApiAddonsResponse,
|};

type LoadHomeAddonsAction = {|
  type: typeof LOAD_HOME_ADDONS,
  payload: LoadHomeAddonsParams,
|};

export const loadHomeAddons = ({
  firstCollection,
  featuredExtensions,
  featuredThemes,
  popularExtensions,
  topRatedExtensions,
}: LoadHomeAddonsParams): LoadHomeAddonsAction => {
  if (!firstCollection) {
    throw new Error('firstCollection is required');
  }
  if (!featuredExtensions) {
    throw new Error('featuredExtensions are required');
  }
  if (!featuredThemes) {
    throw new Error('featuredThemes are required');
  }
  if (!popularExtensions) {
    throw new Error('popularExtensions are required');
  }
  if (!topRatedExtensions) {
    throw new Error('topRatedExtensions are required');
  }

  return {
    type: LOAD_HOME_ADDONS,
    payload: {
      firstCollection,
      featuredExtensions,
      featuredThemes,
      popularExtensions,
      topRatedExtensions,
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
        firstCollection,
        featuredExtensions,
        featuredThemes,
        popularExtensions,
        topRatedExtensions,
      } = action.payload;

      return {
        ...state,
        firstCollection: firstCollection.results
          .slice(0, LANDING_PAGE_ADDON_COUNT)
          .map((item) => {
            return createInternalAddon(item.addon);
          }),
        featuredExtensions: createInternalAddons(featuredExtensions),
        featuredThemes: createInternalAddons(featuredThemes),
        popularExtensions: createInternalAddons(popularExtensions),
        resultsLoaded: true,
        topRatedExtensions: createInternalAddons(topRatedExtensions),
      };
    }

    default:
      return state;
  }
};

export default reducer;
