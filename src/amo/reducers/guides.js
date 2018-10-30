/* @flow */
import invariant from 'invariant';

export const FETCH_GUIDES_ADDONS: 'FETCH_GUIDES_ADDONS' = 'FETCH_GUIDES_ADDONS';
export const UPDATE_GUIDES_ADDONS_LOADED_STATUS: 'UPDATE_GUIDES_ADDONS_LOADED_STATUS' =
  'UPDATE_GUIDES_ADDONS_LOADED_STATUS';

export type GuidesState = {|
  loading: boolean,
|};

export const initialState: GuidesState = {
  loading: false,
};

export type updateGuideAddonsLoadedStatusParams = {|
  loading: boolean,
|};

export type updateGuideAddonsLoadedStatusAction = {|
  type: typeof UPDATE_GUIDES_ADDONS_LOADED_STATUS,
  payload: updateGuideAddonsLoadedStatusParams,
|};

export const updateGuideAddonsLoadedStatus = ({
  loading,
}: updateGuideAddonsLoadedStatusParams): updateGuideAddonsLoadedStatusAction => {
  return {
    type: UPDATE_GUIDES_ADDONS_LOADED_STATUS,
    payload: { loading },
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

type ActionType = updateGuideAddonsLoadedStatusAction | FetchGuidesAction;

const reducer = (
  state: GuidesState = initialState,
  action: ActionType,
): GuidesState => {
  switch (action.type) {
    case FETCH_GUIDES_ADDONS:
      return {
        ...state,
        loading: true,
      };
    case UPDATE_GUIDES_ADDONS_LOADED_STATUS:
      return {
        ...state,
        loading: action.payload.loading,
      };
    default:
      return state;
  }
};

export default reducer;
