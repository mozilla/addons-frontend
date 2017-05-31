/* @flow */
import { CURRENT_VIEW_SET } from 'core/constants';


export type currentViewTypes = {|
  // TODO: Create an addonType Type that is one of type (ADDON_TYPE_EXTENSION,
  // ADDON_TYPE_THEME, etc.)
  addonType: string | null,
  isExploring: boolean | void,
  isHomePage: boolean | void,
|}

export type currentViewActionType = {|
  type: string,
  payload: any,
|}

export const initialState = {
  addonType: null,
  isExploring: false,
  isHomePage: false,
};

export default function currentView(
  state : currentViewTypes = initialState, action : currentViewActionType
) {
  const { payload } = action;
  switch (action.type) {
    case CURRENT_VIEW_SET:
      return {
        addonType: payload.addonType,
        isExploring: payload.isExploring || false,
        isHomePage: payload.isHomePage || false,
      };
    default:
      return state;
  }
}
