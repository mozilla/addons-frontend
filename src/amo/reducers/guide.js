/* @flow */
import invariant from 'invariant';

import { createPlatformFiles } from 'core/reducers/addons';
export const FETCH_GUIDE_ADDONS: 'FETCH_GUIDE_ADDONS' = 'FETCH_GUIDE_ADDONS';
export const LOAD_GUIDE_ADDONS: 'LOAD_GUIDE_ADDONS' = 'LOAD_GUIDE_ADDONS';
import type { AddonType } from 'core/types/addons';

export type GuideType = {|
  addons: Array<AddonType>,
|};
export type FetchGuideParams = {|
  errorHandlerId: string,
  guid: string,
|};
export type FetchGuideAction = {|
  type: typeof FETCH_GUIDE_ADDONS,
  payload: FetchGuideParams,
|};
export type LoadGuideAction = {|
  type: typeof LOAD_GUIDE_ADDONS,
  payload: GuideType,
|};
export const initialState: GuideType = {
  addons: [],
};
export const loadGuideAddons = ({ addons }: GuideType): LoadGuideAction => {
  invariant(addons, 'addons is required');

  const mappedResults =
    addons &&
    addons.map((addon) => {
      return {
        ...addon,
        platformFiles: createPlatformFiles(addon.current_version),
      };
    });

  return {
    type: LOAD_GUIDE_ADDONS,
    payload: { addons: mappedResults },
  };
};
export const fetchGuideAddons = ({
  errorHandlerId,
  guid,
}: FetchGuideParams): FetchGuideAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(guid, 'guid is required');

  return {
    type: FETCH_GUIDE_ADDONS,
    payload: { guid, errorHandlerId },
  };
};
const reducer = (
  state: GuideType = initialState,
  action: LoadGuideAction,
): GuideType => {
  switch (action.type) {
    case LOAD_GUIDE_ADDONS:
      return {
        ...state,
        addons: action.payload.addons,
      };
    default:
      return state;
  }
};

export default reducer;
