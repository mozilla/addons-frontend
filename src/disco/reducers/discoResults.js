/* @flow */
import invariant from 'invariant';

import type { AddonType, ExternalAddonType } from 'core/types/addons';

export const GET_DISCO_RESULTS: 'GET_DISCO_RESULTS' = 'GET_DISCO_RESULTS';
export const LOAD_DISCO_RESULTS: 'LOAD_DISCO_RESULTS' = 'LOAD_DISCO_RESULTS';

export type ExternalDiscoAddonMap = {
  [guid: $PropertyType<AddonType, 'guid'>]: ExternalAddonType,
};

type ExternalDiscoResultType = {|
  // normalizr injects the add-on's GUID in the `addon` prop.
  addon: $PropertyType<AddonType, 'guid'>,
  description: string | null,
  heading: string,
  is_recommendation: boolean,
|};

export type ExternalDiscoResultsType = {|
  entities: {|
    addons: ExternalDiscoAddonMap,
    discoResults: {| [guid: string]: ExternalDiscoResultType |},
  |},
  result: {|
    count: number,
    results: Array<$PropertyType<AddonType, 'guid'>>,
  |},
|};

type DiscoResultsState = Array<ExternalDiscoResultType>;

export const initialState: DiscoResultsState = [];

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

type LoadDiscoResultsParams = ExternalDiscoResultsType;

type LoadDiscoResultsAction = {|
  type: typeof LOAD_DISCO_RESULTS,
  payload: LoadDiscoResultsParams,
|};

export function loadDiscoResults({
  entities,
  result,
}: LoadDiscoResultsParams = {}): LoadDiscoResultsAction {
  invariant(entities, 'entities are required');
  invariant(result, 'result is required');

  return {
    type: LOAD_DISCO_RESULTS,
    payload: { entities, result },
  };
}

type Action = LoadDiscoResultsAction | GetDiscoResultsAction;

export default function discoResults(
  state: DiscoResultsState = initialState,
  action: Action,
): DiscoResultsState {
  switch (action.type) {
    case LOAD_DISCO_RESULTS: {
      const { entities, result } = action.payload;
      // The API schema that complicates result.results can be found in
      // disco/api.js
      return result.results.map((guid) => entities.discoResults[guid]);
    }
    default:
      return state;
  }
}
