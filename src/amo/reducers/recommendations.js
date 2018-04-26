/* @flow */
import invariant from 'invariant';

import { createInternalAddon } from 'core/reducers/addons';
import type { ExternalAddonType } from 'core/types/addons';

export const ABORT_FETCH_RECOMMENDATIONS: 'ABORT_FETCH_RECOMMENDATIONS'
  = 'ABORT_FETCH_RECOMMENDATIONS';
export const FETCH_RECOMMENDATIONS: 'FETCH_RECOMMENDATIONS'
  = 'FETCH_RECOMMENDATIONS';
export const LOAD_RECOMMENDATIONS: 'LOAD_RECOMMENDATIONS'
  = 'LOAD_RECOMMENDATIONS';

export type Recommendations = {|
  addons: Array<ExternalAddonType>,
  fallbackReason: string,
  loading: boolean,
  outcome: string,
|};

export type RecommendationsState = {
  byGuid: {
    [guid: string]: Recommendations,
  },
};

export const initialState: RecommendationsState = {
  byGuid: {},
};

export type AbortFetchRecommendationsParams = {|
  guid: string,
|};

type AbortFetchRecommendationsAction = {|
  type: typeof ABORT_FETCH_RECOMMENDATIONS,
  payload: AbortFetchRecommendationsParams,
|};

export const abortFetchRecommendations = ({
  guid,
}: AbortFetchRecommendationsParams = {}): AbortFetchRecommendationsAction => {
  return {
    type: ABORT_FETCH_RECOMMENDATIONS,
    payload: { guid },
  };
};

type FetchRecommendationsParams = {|
  errorHandlerId: string,
  guid: string,
  recommended: boolean,
|};

export type FetchRecommendationsAction = {|
  type: typeof FETCH_RECOMMENDATIONS,
  payload: FetchRecommendationsParams,
|};

export const fetchRecommendations = ({
  errorHandlerId,
  guid,
  recommended,
}: FetchRecommendationsParams = {}): FetchRecommendationsAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(guid, 'guid is required');
  invariant(typeof recommended === 'boolean', 'recommended is required');

  return {
    type: FETCH_RECOMMENDATIONS,
    payload: { errorHandlerId, guid, recommended },
  };
};

export type LoadRecommendationsParams = {|
  addons: Array<ExternalAddonType>,
  fallbackReason: string,
  guid: string,
  outcome: string,
|};

type LoadRecommendationsAction = {|
  type: typeof LOAD_RECOMMENDATIONS,
  payload: LoadRecommendationsParams,
|};

export const loadRecommendations = ({
  addons,
  fallbackReason,
  guid,
  outcome,
}: LoadRecommendationsParams = {}): LoadRecommendationsAction => {
  invariant(addons, 'addons is required');
  invariant(fallbackReason, 'fallbackReason is required');
  invariant(guid, 'guid is required');
  invariant(outcome, 'outcome is required');

  return {
    type: LOAD_RECOMMENDATIONS,
    payload: { addons, guid, outcome, fallbackReason },
  };
};

type GetRecommendationsByGuidParams = {|
  guid: string,
  state: RecommendationsState,
|};

export const getRecommendationsByGuid = (
  { guid, state }: GetRecommendationsByGuidParams
): Recommendations | null => {
  invariant(guid, 'guid is required');

  return state.byGuid[guid] || null;
};

type Action =
  | AbortFetchRecommendationsAction
  | FetchRecommendationsAction
  | LoadRecommendationsAction
  ;

const reducer = (
  state: RecommendationsState = initialState,
  action: Action
): RecommendationsState => {
  switch (action.type) {
    case ABORT_FETCH_RECOMMENDATIONS:
      return {
        ...state,
        byGuid: {
          ...state.byGuid,
          [action.payload.guid]: {
            loading: false,
          },
        },
      };

    case FETCH_RECOMMENDATIONS:
      return {
        ...state,
        byGuid: {
          ...state.byGuid,
          [action.payload.guid]: {
            loading: true,
          },
        },
      };

    case LOAD_RECOMMENDATIONS: {
      const { fallbackReason, guid, outcome } = action.payload;

      const addons = action.payload.addons
        .map((addon) => createInternalAddon(addon));

      return {
        ...state,
        byGuid: {
          ...state.byGuid,
          [guid]: {
            addons,
            fallbackReason,
            loading: false,
            outcome,
          },
        },
      };
    }

    default:
      return state;
  }
};

export default reducer;
