/* @flow */
import invariant from 'invariant';

import {
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
} from 'amo/constants';
import { SET_CLIENT_APP } from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import { isTheme } from 'core/utils';
import type { AddonType, ExternalAddonType } from 'core/types/addons';
import type { SetClientAppAction } from 'core/actions';

export const FETCH_HOME_ADDONS: 'FETCH_HOME_ADDONS' = 'FETCH_HOME_ADDONS';
export const LOAD_HOME_ADDONS: 'LOAD_HOME_ADDONS' = 'LOAD_HOME_ADDONS';

export type HomeState = {
  collections: Array<Object | null>,
  resultsLoaded: boolean,
  shelves: { [shelfName: string]: Array<AddonType> | null },
};

export const initialState: HomeState = {
  collections: [],
  resultsLoaded: false,
  shelves: {},
};

type FetchHomeAddonsParams = {|
  collectionsToFetch: Array<Object>,
  enableFeatureRecommendedBadges: boolean,
  errorHandlerId: string,
  includeRecommendedThemes: boolean,
  includeTrendingExtensions: boolean,
|};

export type FetchHomeAddonsAction = {|
  type: typeof FETCH_HOME_ADDONS,
  payload: FetchHomeAddonsParams,
|};

export const fetchHomeAddons = ({
  collectionsToFetch,
  enableFeatureRecommendedBadges,
  errorHandlerId,
  includeRecommendedThemes,
  includeTrendingExtensions,
}: FetchHomeAddonsParams): FetchHomeAddonsAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(collectionsToFetch, 'collectionsToFetch is required');

  return {
    type: FETCH_HOME_ADDONS,
    payload: {
      collectionsToFetch,
      enableFeatureRecommendedBadges,
      errorHandlerId,
      includeRecommendedThemes,
      includeTrendingExtensions,
    },
  };
};

type ApiAddonsResponse = {|
  count: number,
  results: Array<ExternalAddonType>,
|};

type LoadHomeAddonsParams = {|
  collections: Array<Object | null>,
  shelves: { [shelfName: string]: ApiAddonsResponse },
|};

type LoadHomeAddonsAction = {|
  type: typeof LOAD_HOME_ADDONS,
  payload: LoadHomeAddonsParams,
|};

export const loadHomeAddons = ({
  collections,
  shelves,
}: LoadHomeAddonsParams): LoadHomeAddonsAction => {
  invariant(collections, 'collections is required');
  invariant(shelves, 'shelves is required');

  return {
    type: LOAD_HOME_ADDONS,
    payload: {
      collections,
      shelves,
    },
  };
};

type Action = FetchHomeAddonsAction | LoadHomeAddonsAction | SetClientAppAction;

const createInternalAddons = (
  response: ApiAddonsResponse,
): Array<AddonType> => {
  return response.results.map((addon) => createInternalAddon(addon));
};

const reducer = (
  state: HomeState = initialState,
  action: Action,
): HomeState => {
  switch (action.type) {
    case SET_CLIENT_APP:
      return initialState;

    case FETCH_HOME_ADDONS:
      return {
        ...state,
        resultsLoaded: false,
      };

    case LOAD_HOME_ADDONS: {
      const { collections, shelves } = action.payload;

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
        resultsLoaded: true,
        shelves: Object.keys(shelves).reduce((shelvesToLoad, shelfName) => {
          const response = shelves[shelfName];

          return {
            ...shelvesToLoad,
            [shelfName]: response ? createInternalAddons(response) : null,
          };
        }, {}),
      };
    }

    default:
      return state;
  }
};

export default reducer;
