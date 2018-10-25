/* @flow */
import invariant from 'invariant';

import { createPlatformFiles } from 'core/reducers/addons';
import type { AddonType } from 'core/types/addons';

export const FETCH_GUIDES_ADDONS: 'FETCH_GUIDES_ADDONS' = 'FETCH_GUIDES_ADDONS';
export const LOAD_GUIDES_ADDONS: 'LOAD_GUIDES_ADDONS' = 'LOAD_GUIDES_ADDONS';

export type FetchGuidesParams = {|
  errorHandlerId: string,
  guid: string,
|};

export type FetchGuidesAction = {|
  type: typeof FETCH_GUIDES_ADDONS,
  payload: FetchGuidesParams,
|};

export type GuidesState = {|
  addons: Array<AddonType> | null,
|};

export type LoadGuidesAction = {|
  type: typeof LOAD_GUIDES_ADDONS,
  payload: GuidesState,
|};

export const initialState: GuidesState = {
  addons: null,
};
export const loadGuidesAddons = ({ addons }: GuidesState): LoadGuidesAction => {
  invariant(addons, 'addons are required');

  const mappedResults =
    addons &&
    addons.map((addon) => {
      return {
        ...addon,
        platformFiles: createPlatformFiles(addon.current_version),
      };
    });

  return {
    type: LOAD_GUIDES_ADDONS,
    payload: { addons: mappedResults },
  };
};
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
  action: LoadGuidesAction,
): GuidesState => {
  switch (action.type) {
    case LOAD_GUIDES_ADDONS:
      return {
        ...state,
        addons: action.payload.addons,
      };
    default:
      return state;
  }
};

export default reducer;
