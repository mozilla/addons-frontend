/* @flow */
import invariant from 'invariant';

export const FETCH_GUIDES_ADDONS: 'FETCH_GUIDES_ADDONS' = 'FETCH_GUIDES_ADDONS';
export const UPDATE_GUIDES_ADDONS_LOADED_STATUS: 'UPDATE_GUIDES_ADDONS_LOADED_STATUS' =
  'UPDATE_GUIDES_ADDONS_LOADED_STATUS';

export type GuidesState = {|
  loaded: boolean,
|};

export const initialState: GuidesState = {
  loaded: false,
};

export type updateGuideAddonsLoadedStatusParams = {|
  loaded: boolean,
|};

export type updateGuideAddonsLoadedStatusAction = {|
  type: typeof UPDATE_GUIDES_ADDONS_LOADED_STATUS,
  payload: updateGuideAddonsLoadedStatusParams,
|};

export const updateGuideAddonsLoadedStatus = ({
  loaded,
}: updateGuideAddonsLoadedStatusParams): updateGuideAddonsLoadedStatusAction => {
  return {
    type: UPDATE_GUIDES_ADDONS_LOADED_STATUS,
    payload: { loaded },
  };
};

export type FetchGuidesParams = {|
  errorHandlerId: string,
  guid: string,
|};

export type FetchGuidesAction = {|
  type: typeof FETCH_GUIDES_ADDONS,
  payload: FetchGuidesParams,
|};

export const fetchGuidesAddons = ({
  errorHandlerId,
  guid,
}: FetchGuidesParams): FetchGuidesAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(guid, 'guid is required');

  return {
    type: FETCH_GUIDES_ADDONS,
    payload: { guid, errorHandlerId },
  };
};

const reducer = (
  state: GuidesState = initialState,
  action: updateGuideAddonsLoadedStatusAction,
): GuidesState => {
  switch (action.type) {
    case UPDATE_GUIDES_ADDONS_LOADED_STATUS:
      return {
        ...state,
        loaded: action.payload.loaded,
      };
    default:
      return state;
  }
};

export default reducer;
