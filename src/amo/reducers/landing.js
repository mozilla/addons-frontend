/* @flow */
import invariant from 'invariant';

import { createInternalAddon } from 'core/reducers/addons';
import type { AddonType, ExternalAddonType } from 'core/types/addons';

export const LANDING_GET: 'LANDING_GET' = 'LANDING_GET';
export const LANDING_LOADED: 'LANDING_LOADED' = 'LANDING_LOADED';

type ResultSet = {|
  count: number,
  results: Array<AddonType>,
|};

type ExternalResultSet = {|
  count: number,
  pageSize: number,
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
  errorHandlerId: string,
|};

export type GetLandingAction = {|
  type: typeof LANDING_GET,
  payload: GetLandingParams,
|};

export function getLanding({
  addonType,
  errorHandlerId,
  category,
}: GetLandingParams): GetLandingAction {
  invariant(addonType, 'addonType is required');
  invariant(errorHandlerId, 'errorHandlerId is required');

  return {
    type: LANDING_GET,
    payload: { addonType, errorHandlerId, category: category || null },
  };
}

type LoadLandingParams = {|
  addonType: string,
  featured: ExternalResultSet,
  highlyRated: ExternalResultSet,
  trending: ExternalResultSet,
|};

type LoadLandingAction = {|
  type: typeof LANDING_LOADED,
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
    type: LANDING_LOADED,
    payload: { addonType, featured, highlyRated, trending },
  };
}

type Action = GetLandingAction | LoadLandingAction;

export default function reducer(
  state: LandingState = initialState,
  action: Action,
): LandingState {
  switch (action.type) {
    case LANDING_GET: {
      const { payload } = action;

      return {
        ...initialState,
        addonType: payload.addonType,
        category: payload.category,
        loading: true,
        resultsLoaded: false,
      };
    }
    case LANDING_LOADED: {
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
