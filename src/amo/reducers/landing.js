/* @flow */
import invariant from 'invariant';

import { createInternalAddon } from 'amo/reducers/addons';
import { SET_LANG } from 'amo/reducers/api';
import type { AddonType, ExternalAddonType } from 'amo/types/addons';

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
  recommended: ResultSet,
  highlyRated: ResultSet,
  lang: string,
  loading: boolean,
  resultsLoaded: boolean,
  trending: ResultSet,
|};

export const initialState: LandingState = {
  addonType: null,
  category: null,
  recommended: { count: 0, results: [] },
  highlyRated: { count: 0, results: [] },
  // We default lang to '' to avoid having to add a lot of invariants to our
  // code, and protect against a lang of '' in selectLocalizedContent.
  lang: '',
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
  type: typeof GET_LANDING,
  payload: GetLandingParams,
|};

export function getLanding({
  addonType,
  category,
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
    },
  };
}

type LoadLandingParams = {|
  addonType: string,
  recommended: ExternalResultSet,
  highlyRated: ExternalResultSet,
  trending: ExternalResultSet,
|};

type LoadLandingAction = {|
  type: typeof LOAD_LANDING,
  payload: LoadLandingParams,
|};

export function loadLanding({
  addonType,
  recommended,
  highlyRated,
  trending,
}: LoadLandingParams): LoadLandingAction {
  invariant(addonType, 'addonType is required');
  invariant(recommended, 'recommended is required');
  invariant(highlyRated, 'highlyRated is required');
  invariant(trending, 'trending is required');

  return {
    type: LOAD_LANDING,
    payload: { addonType, recommended, highlyRated, trending },
  };
}

type Action = GetLandingAction | LoadLandingAction;

export default function reducer(
  state: LandingState = initialState,
  action: Action,
): LandingState {
  switch (action.type) {
    case SET_LANG:
      return {
        ...state,
        lang: action.payload.lang,
      };
    case GET_LANDING: {
      const { payload } = action;

      return {
        ...initialState,
        addonType: payload.addonType,
        category: payload.category || null,
        lang: state.lang,
        loading: true,
        resultsLoaded: false,
      };
    }
    case LOAD_LANDING: {
      const { payload } = action;

      const newState = { ...state, loading: false, resultsLoaded: true };

      ['recommended', 'highlyRated', 'trending'].forEach((key) => {
        if (payload[key]) {
          newState[key] = {
            count: payload[key].count,
            results: payload[key].results.map((addon) =>
              createInternalAddon(addon, state.lang),
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
