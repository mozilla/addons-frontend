/* @flow */
import { LANDING_PAGE_ADDON_COUNT } from 'amo/constants';
import { createInternalAddon } from 'core/reducers/addons';
import type { AddonType, ExternalAddonType } from 'core/types/addons';

export const FETCH_HOME_ADDONS: 'FETCH_HOME_ADDONS' = 'FETCH_HOME_ADDONS';
export const LOAD_HOME_ADDONS: 'LOAD_HOME_ADDONS' = 'LOAD_HOME_ADDONS';

export type HomeState = {
  collections: Array<Object>,
  featuredExtensions: Array<AddonType>,
  featuredThemes: Array<AddonType>,
  resultsLoaded: boolean,
};

export const initialState: HomeState = {
  collections: [],
  featuredExtensions: [],
  featuredThemes: [],
  resultsLoaded: false,
};

type FetchHomeAddonsParams = {|
  errorHandlerId: string,
  collectionsToFetch: Array<Object>,
|};

type FetchHomeAddonsAction = {|
  type: typeof FETCH_HOME_ADDONS,
  payload: FetchHomeAddonsParams,
|};

export const fetchHomeAddons = ({
  errorHandlerId,
  collectionsToFetch,
}: FetchHomeAddonsParams): FetchHomeAddonsAction => {
  if (!errorHandlerId) {
    throw new Error('errorHandlerId is required');
  }
  if (!collectionsToFetch) {
    throw new Error('collectionsToFetch is required');
  }

  return {
    type: FETCH_HOME_ADDONS,
    payload: {
      errorHandlerId,
      collectionsToFetch,
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
  collections: Array<Object>,
  featuredExtensions: ApiAddonsResponse,
  featuredThemes: ApiAddonsResponse,
|};

type LoadHomeAddonsAction = {|
  type: typeof LOAD_HOME_ADDONS,
  payload: LoadHomeAddonsParams,
|};

export const loadHomeAddons = ({
  collections,
  featuredExtensions,
  featuredThemes,
}: LoadHomeAddonsParams): LoadHomeAddonsAction => {
  if (!collections) {
    throw new Error('collections is required');
  }
  if (!featuredExtensions) {
    throw new Error('featuredExtensions are required');
  }
  if (!featuredThemes) {
    throw new Error('featuredThemes are required');
  }

  return {
    type: LOAD_HOME_ADDONS,
    payload: {
      collections,
      featuredExtensions,
      featuredThemes,
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
        collections,
        featuredExtensions,
        featuredThemes,
      } = action.payload;

      return {
        ...state,
        collections: collections.map((collection) => {
          return collection.results
            .slice(0, LANDING_PAGE_ADDON_COUNT)
            .map((item) => {
              return createInternalAddon(item.addon);
            });
        }),
        featuredExtensions: createInternalAddons(featuredExtensions),
        featuredThemes: createInternalAddons(featuredThemes),
        resultsLoaded: true,
      };
    }

    default:
      return state;
  }
};

export default reducer;
