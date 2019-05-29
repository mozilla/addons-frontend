/* @flow */
import invariant from 'invariant';

import { createInternalAddon } from 'core/reducers/addons';
import type { AddonType, ExternalAddonType } from 'core/types/addons';

export const GET_LANDING: 'GET_LANDING' = 'GET_LANDING';
export const LOAD_LANDING: 'LOAD_LANDING' = 'LOAD_LANDING';

type ResultSet = {|
  count: number,
  results: Array<AddonType>,
|};

type ExternalResultSet = {|
  count: number,
  pageSize: string,
  results: Array<ExternalAddonType>,
|};

export type LandingState = {|
  addonType: string | null,
  category: string | null,
  featured: ResultSet,
  highlyRated: ResultSet,
  loading: boolean,
  resultsLoaded: boolean,
  trending: ResultSet,
|};

export const initialState: LandingState = {
  addonType: null,
  category: null,
  featured: { count: 0, results: [] },
  highlyRated: { count: 0, results: [] },
  loading: false,
  trending: { count: 0, results: [] },
  resultsLoaded: false,
};

type GetLandingParams = {|
  addonType: string,
  category?: string | null,
  enableFeatureRecommendedBadges?: boolean,
  errorHandlerId: string,
|};

export type GetLandingAction = {|
  type: typeof GET_LANDING,
  payload: GetLandingParams,
|};

export function getLanding({
  addonType,
  category,
  enableFeatureRecommendedBadges,
  errorHandlerId,
}: GetLandingParams): GetLandingAction {
  invariant(addonType, 'addonType is required');
  invariant(errorHandlerId, 'errorHandlerId is required');

  return {
    type: GET_LANDING,
    payload: {
      addonType,
      category: category || null,
      errorHandlerId,
      enableFeatureRecommendedBadges,
    },
  };
}

type LoadLandingParams = {|
  addonType: string,
  featured: ExternalResultSet,
  highlyRated: ExternalResultSet,
  trending: ExternalResultSet,
|};

type LoadLandingAction = {|
  type: typeof LOAD_LANDING,
  payload: LoadLandingParams,
|};

export function loadLanding({
  addonType,
  featured,
  highlyRated,
  trending,
}: LoadLandingParams): LoadLandingAction {
  invariant(addonType, 'addonType is required');
  invariant(featured, 'featured is required');
  invariant(highlyRated, 'highlyRated is required');
  invariant(trending, 'trending is required');

  return {
    type: LOAD_LANDING,
    payload: { addonType, featured, highlyRated, trending },
  };
}

type Action = GetLandingAction | LoadLandingAction;

export default function reducer(
  state: LandingState = initialState,
  action: Action,
): LandingState {
  switch (action.type) {
    case GET_LANDING: {
      const { payload } = action;

      return {
        ...initialState,
        addonType: payload.addonType,
        category: payload.category,
        loading: true,
        resultsLoaded: false,
      };
    }
    case LOAD_LANDING: {
      const { payload } = action;

      const newState = { ...state, loading: false, resultsLoaded: true };

      ['featured', 'highlyRated', 'trending'].forEach((key) => {
        if (payload[key]) {
          newState[key] = {
            count: payload[key].count,
            results: payload[key].results.map((addon) =>
              createInternalAddon(addon),
            ),
          };
        }
      });

      return newState;
    }
    default:
      return state;
  }
}
