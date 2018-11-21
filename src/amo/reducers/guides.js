/* @flow */
import invariant from 'invariant';

import { LOAD_ADDON_RESULTS } from 'core/reducers/addons';

export const FETCH_GUIDES_ADDONS: 'FETCH_GUIDES_ADDONS' = 'FETCH_GUIDES_ADDONS';

export type GuidesState = {|
  guids: Array<string>,
  loading: boolean,
|};

export const initialState: GuidesState = {
  guids: [],
  loading: false,
};

export type FetchGuidesParams = {|
  errorHandlerId: string,
  guids: Array<string>,
|};

export type FetchGuidesAction = {|
  type: typeof FETCH_GUIDES_ADDONS,
  payload: FetchGuidesParams,
|};

export const fetchGuidesAddons = ({
  errorHandlerId,
  guids,
}: FetchGuidesParams): FetchGuidesAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(guids, 'guids is required');

  return {
    type: FETCH_GUIDES_ADDONS,
    payload: { guids, errorHandlerId },
  };
};

const reducer = (
  state: GuidesState = initialState,
  action: FetchGuidesAction,
): GuidesState => {
  switch (action.type) {
    case FETCH_GUIDES_ADDONS:
      return {
        ...state,
        guids: action.payload.guids,
        loading: true,
      };
    case LOAD_ADDON_RESULTS:
      return {
        ...state,
        loading: false,
      };
    default:
      return state;
  }
};

export default reducer;
