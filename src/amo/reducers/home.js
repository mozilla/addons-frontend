/* @flow */
import { LANDING_PAGE_ADDON_COUNT } from 'amo/constants';
import { createInternalAddon } from 'core/reducers/addons';
import type { CollectionAddonsListResponse } from 'amo/reducers/collections';
import type { AddonType, ExternalAddonType } from 'core/types/addons';

export const FETCH_HOME_ADDONS: 'FETCH_HOME_ADDONS' = 'FETCH_HOME_ADDONS';
export const LOAD_HOME_ADDONS: 'LOAD_HOME_ADDONS' = 'LOAD_HOME_ADDONS';

export type HomeState = {
  firstCollection: Array<AddonType>,
  secondCollection: Array<AddonType>,
  featuredExtensions: Array<AddonType>,
  popularExtensions: Array<AddonType>,
  resultsLoaded: boolean,
  topRatedThemes: Array<AddonType>,
};

export const initialState: HomeState = {
  firstCollection: [],
  secondCollection: [],
  featuredExtensions: [],
  popularExtensions: [],
  resultsLoaded: false,
  topRatedThemes: [],
};

type FetchHomeAddonsParams = {|
  errorHandlerId: string,
  firstCollectionSlug: string,
  firstCollectionUser: string,
  secondCollectionSlug: string,
  secondCollectionUser: string,
|};

type FetchHomeAddonsAction = {|
  type: typeof FETCH_HOME_ADDONS,
  payload: FetchHomeAddonsParams,
|};

export const fetchHomeAddons = ({
  errorHandlerId,
  firstCollectionSlug,
  firstCollectionUser,
  secondCollectionSlug,
  secondCollectionUser,
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
  if (!secondCollectionSlug) {
    throw new Error('secondCollectionSlug is required');
  }
  if (!secondCollectionUser) {
    throw new Error('secondCollectionUser is required');
  }

  return {
    type: FETCH_HOME_ADDONS,
    payload: {
      errorHandlerId,
      firstCollectionSlug,
      firstCollectionUser,
      secondCollectionSlug,
      secondCollectionUser,
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
  secondCollection: CollectionAddonsListResponse,
  featuredExtensions: ApiAddonsResponse,
  popularExtensions: ApiAddonsResponse,
  topRatedThemes: ApiAddonsResponse,
|};

type LoadHomeAddonsAction = {|
  type: typeof LOAD_HOME_ADDONS,
  payload: LoadHomeAddonsParams,
|};

export const loadHomeAddons = ({
  firstCollection,
  secondCollection,
  featuredExtensions,
  popularExtensions,
  topRatedThemes,
}: LoadHomeAddonsParams): LoadHomeAddonsAction => {
  if (!firstCollection) {
    throw new Error('firstCollection is required');
  }
  if (!secondCollection) {
    throw new Error('secondCollection is required');
  }
  if (!featuredExtensions) {
    throw new Error('featuredExtensions are required');
  }
  if (!popularExtensions) {
    throw new Error('popularExtensions are required');
  }
  if (!topRatedThemes) {
    throw new Error('topRatedThemes are required');
  }

  return {
    type: LOAD_HOME_ADDONS,
    payload: {
      firstCollection,
      secondCollection,
      featuredExtensions,
      popularExtensions,
      topRatedThemes,
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
        secondCollection,
        featuredExtensions,
        popularExtensions,
        topRatedThemes,
      } = action.payload;

      return {
        ...state,
        firstCollection: firstCollection.results
          .slice(0, LANDING_PAGE_ADDON_COUNT)
          .map((item) => {
            return createInternalAddon(item.addon);
          }),
        secondCollection: secondCollection.results
          .slice(0, LANDING_PAGE_ADDON_COUNT)
          .map((item) => {
            return createInternalAddon(item.addon);
          }),
        featuredExtensions: createInternalAddons(featuredExtensions),
        popularExtensions: createInternalAddons(popularExtensions),
        resultsLoaded: true,
        topRatedThemes: createInternalAddons(topRatedThemes),
      };
    }

    default:
      return state;
  }
};

export default reducer;
