/* @flow */
import invariant from 'invariant';

import {
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
} from 'amo/constants';
import { createInternalAddon } from 'core/reducers/addons';
import type { AddonType, ExternalAddonType } from 'core/types/addons';
import { isTheme } from 'core/utils';

export const FETCH_HOME_ADDONS: 'FETCH_HOME_ADDONS' = 'FETCH_HOME_ADDONS';
export const LOAD_HOME_ADDONS: 'LOAD_HOME_ADDONS' = 'LOAD_HOME_ADDONS';

export type HomeState = {
  collections: Array<Object | null>,
  featuredExtensions: Array<AddonType>,
  resultsLoaded: boolean,
  featuredThemes: Array<AddonType>,
  popularExtensions: Array<AddonType>,
};

export const initialState: HomeState = {
  collections: [],
  featuredExtensions: [],
  resultsLoaded: false,
  featuredThemes: [],
  popularExtensions: [],
};

type FetchHomeAddonsParams = {|
  collectionsToFetch: Array<Object>,
  errorHandlerId: string,
  includeFeaturedThemes: boolean,
|};

export type FetchHomeAddonsAction = {|
  type: typeof FETCH_HOME_ADDONS,
  payload: FetchHomeAddonsParams,
|};

export const fetchHomeAddons = ({
  collectionsToFetch,
  errorHandlerId,
  includeFeaturedThemes,
}: FetchHomeAddonsParams): FetchHomeAddonsAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(collectionsToFetch, 'collectionsToFetch is required');

  return {
    type: FETCH_HOME_ADDONS,
    payload: {
      collectionsToFetch,
      errorHandlerId,
      includeFeaturedThemes,
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
  collections: Array<Object | null>,
  featuredExtensions: ApiAddonsResponse,
  featuredThemes?: ApiAddonsResponse,
  popularExtensions: ApiAddonsResponse,
|};

type LoadHomeAddonsAction = {|
  type: typeof LOAD_HOME_ADDONS,
  payload: LoadHomeAddonsParams,
|};

export const loadHomeAddons = ({
  collections,
  featuredExtensions,
  featuredThemes,
  popularExtensions,
}: LoadHomeAddonsParams): LoadHomeAddonsAction => {
  invariant(collections, 'collections is required');
  invariant(featuredExtensions, 'featuredExtensions is required');
  invariant(popularExtensions, 'popularExtensions is required');

  return {
    type: LOAD_HOME_ADDONS,
    payload: {
      collections,
      featuredExtensions,
      featuredThemes,
      popularExtensions,
    },
  };
};

type Action = FetchHomeAddonsAction | LoadHomeAddonsAction;

const createInternalAddons = (
  response: ApiAddonsResponse,
): Array<AddonType> => {
  const { result, entities } = response;
  return result.results.map((slug) =>
    createInternalAddon(entities.addons[slug]),
  );
};

const reducer = (
  state: HomeState = initialState,
  action: Action,
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
        popularExtensions,
      } = action.payload;

      return {
        ...state,
        collections: collections.map((collection) => {
          if (collection && collection.results && collection.results.length) {
            const sliceEnd = isTheme(collection.results[0].addon.type)
              ? LANDING_PAGE_THEME_COUNT
              : LANDING_PAGE_EXTENSION_COUNT;
            return collection.results.slice(0, sliceEnd).map((item) => {
              return createInternalAddon(item.addon);
            });
          }
          return null;
        }),
        featuredExtensions: createInternalAddons(featuredExtensions),
        featuredThemes: featuredThemes
          ? createInternalAddons(featuredThemes)
          : [],
        resultsLoaded: true,
        popularExtensions: createInternalAddons(popularExtensions),
      };
    }

    default:
      return state;
  }
};

export default reducer;
