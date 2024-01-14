/* @flow */
import invariant from 'invariant';

import { createInternalAddon } from 'amo/reducers/addons';
import { SET_LANG } from 'amo/reducers/api';
import type { AddonType, PartialExternalAddonType } from 'amo/types/addons';

export const ABORT_FETCH_RECOMMENDATIONS: 'ABORT_FETCH_RECOMMENDATIONS' =
  'ABORT_FETCH_RECOMMENDATIONS';
export const FETCH_RECOMMENDATIONS: 'FETCH_RECOMMENDATIONS' =
  'FETCH_RECOMMENDATIONS';
export const LOAD_RECOMMENDATIONS: 'LOAD_RECOMMENDATIONS' =
  'LOAD_RECOMMENDATIONS';
export const OUTCOME_CURATED: 'curated' = 'curated';
export const OUTCOME_RECOMMENDED: 'recommended' = 'recommended';
export const OUTCOME_RECOMMENDED_FALLBACK: 'recommended_fallback' =
  'recommended_fallback';

export type FallbackReasonType = 'no_results' | 'timeout' | 'invalid_results';
export type OutcomeType =
  | typeof OUTCOME_CURATED
  | typeof OUTCOME_RECOMMENDED
  | typeof OUTCOME_RECOMMENDED_FALLBACK;

export type Recommendations = {|
  addons: Array<AddonType> | null,
  fallbackReason: FallbackReasonType | null,
  loading: boolean,
  outcome: OutcomeType | null,
|};

export type RecommendationsState = {|
  byGuid: {
    [guid: string]: Recommendations,
  },

  lang: string,
|};

export const initialState: RecommendationsState = {
  byGuid: {},
  // We default lang to '' to avoid having to add a lot of invariants to our
  // code, and protect against a lang of '' in selectLocalizedContent.
  lang: '',
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
}: AbortFetchRecommendationsParams): AbortFetchRecommendationsAction => {
  invariant(guid, 'guid is required');
  return {
    type: ABORT_FETCH_RECOMMENDATIONS,
    payload: { guid },
  };
};

type FetchRecommendationsParams = {|
  errorHandlerId: string,
  guid: string,
  recommended?: boolean,
|};

export type FetchRecommendationsAction = {|
  type: typeof FETCH_RECOMMENDATIONS,
  payload: FetchRecommendationsParams,
|};

export const fetchRecommendations = ({
  errorHandlerId,
  guid,
  recommended = true,
}: FetchRecommendationsParams): FetchRecommendationsAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(guid, 'guid is required');

  return {
    type: FETCH_RECOMMENDATIONS,
    payload: { errorHandlerId, guid, recommended },
  };
};

export type LoadRecommendationsParams = {|
  addons: Array<PartialExternalAddonType>,
  fallbackReason?: FallbackReasonType,
  guid: string,
  outcome: OutcomeType,
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
}: LoadRecommendationsParams): LoadRecommendationsAction => {
  invariant(addons, 'addons is required');
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

export const getRecommendationsByGuid = ({
  guid,
  state,
}: GetRecommendationsByGuidParams): Recommendations | null => {
  invariant(guid, 'guid is required');
  invariant(state, 'state is required');

  return state.byGuid[guid] || null;
};

type Action =
  | AbortFetchRecommendationsAction
  | FetchRecommendationsAction
  | LoadRecommendationsAction;

const reducer = (
  // eslint-disable-next-line default-param-last
  state: RecommendationsState = initialState,
  action: Action,
): RecommendationsState => {
  switch (action.type) {
    case SET_LANG:
      return {
        ...state,
        lang: action.payload.lang,
      };
    case ABORT_FETCH_RECOMMENDATIONS:
      return {
        ...state,
        byGuid: {
          ...state.byGuid,
          [action.payload.guid]: {
            addons: null,
            fallbackReason: null,
            loading: false,
            outcome: null,
          },
        },
      };

    case FETCH_RECOMMENDATIONS:
      return {
        ...state,
        byGuid: {
          ...state.byGuid,
          [action.payload.guid]: {
            addons: null,
            fallbackReason: null,
            loading: true,
            outcome: null,
          },
        },
      };

    case LOAD_RECOMMENDATIONS: {
      const { fallbackReason, guid, outcome } = action.payload;

      const addons = action.payload.addons.map((addon) =>
        createInternalAddon(addon, state.lang),
      );

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
