/* @flow */
import invariant from 'invariant';

import { LOAD_ADDON_RESULTS } from 'core/reducers/addons';

export const FETCH_GUIDES_ADDONS: 'FETCH_GUIDES_ADDONS' = 'FETCH_GUIDES_ADDONS';

export type GuidesState = {|
  loading: boolean,
|};

export const initialState: GuidesState = {
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
