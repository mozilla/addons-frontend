/* @flow */
import invariant from 'invariant';

import type { AddonType, ExternalAddonType } from 'core/types/addons';

export const GET_DISCO_RESULTS: 'GET_DISCO_RESULTS' = 'GET_DISCO_RESULTS';
export const LOAD_DISCO_RESULTS: 'LOAD_DISCO_RESULTS' = 'LOAD_DISCO_RESULTS';
export const SET_DISCO_TAARID: 'SET_DISCO_TAARID' = 'SET_DISCO_TAARID';

type ExternalDiscoResultType = {|
  addon: ExternalAddonType,
  description: string | null,
  heading: string,
  is_recommendation: boolean,
|};

export type ExternalDiscoResultsType = {|
  count: number,
  results: Array<ExternalDiscoResultType>,
|};

export type DiscoResultType = {|
  addonId: $PropertyType<AddonType, 'id'>,
  description: string | null,
  heading: string,
  isRecommendation: boolean,
|};

export type DiscoResultsType = Array<DiscoResultType>;

export type DiscoResultsState = {|
  results: DiscoResultsType,
  taarId?: string,
|};

export const initialState: DiscoResultsState = {
  results: [],
  taarId: undefined,
};

type GetDiscoResultsParams = {|
  errorHandlerId: string,
  taarParams: {
    [name: string]: string,
    platform: string,
  },
|};

export type GetDiscoResultsAction = {|
  type: typeof GET_DISCO_RESULTS,
  payload: GetDiscoResultsParams,
|};

export function getDiscoResults({
  errorHandlerId,
  taarParams,
}: GetDiscoResultsParams = {}): GetDiscoResultsAction {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(taarParams.platform, 'taarParams.platform is required');

  return {
    type: GET_DISCO_RESULTS,
    payload: { errorHandlerId, taarParams },
  };
}

type LoadDiscoResultsParams = {|
  results: Array<ExternalDiscoResultType>,
|};

type LoadDiscoResultsAction = {|
  type: typeof LOAD_DISCO_RESULTS,
  payload: LoadDiscoResultsParams,
|};

export function loadDiscoResults({
  results,
}: LoadDiscoResultsParams = {}): LoadDiscoResultsAction {
  invariant(results, 'results are required');

  return {
    type: LOAD_DISCO_RESULTS,
    payload: { results },
  };
}

export const createInternalResult = (
  result: ExternalDiscoResultType,
): DiscoResultType => {
  return {
    addonId: result.addon.id,
    description: result.description || null,
    heading: result.heading,
    isRecommendation: result.is_recommendation,
  };
};

type CreateExternalAddonMapParams = {|
  results: Array<ExternalDiscoResultType>,
|};

export const createExternalAddonMap = ({
  results,
}: CreateExternalAddonMapParams): Array<ExternalAddonType> => {
  return results.map((result) => result.addon);
};

type SetTaarIdAction = {|
  type: typeof SET_DISCO_TAARID,
  payload: { taarId: string },
|};

export const setTaarId = (taarId: string): SetTaarIdAction => {
  if (!taarId) {
    invariant(taarId, 'taarId is required');
  }
  return {
    type: SET_DISCO_TAARID,
    payload: { taarId },
  };
};

type Action = LoadDiscoResultsAction | GetDiscoResultsAction | SetTaarIdAction;

export default function discoResults(
  state: DiscoResultsState = initialState,
  action: Action,
): DiscoResultsState {
  switch (action.type) {
    case SET_DISCO_TAARID: {
      return {
        ...state,
        taarId: action.payload.taarId,
      };
    }
    case LOAD_DISCO_RESULTS: {
      const { results } = action.payload;

      return {
        ...state,
        results: results.map(createInternalResult),
      };
    }
    default:
      return state;
  }
}
