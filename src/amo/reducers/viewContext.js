/* @flow */
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  VIEW_CONTEXT_EXPLORE,
  VIEW_CONTEXT_HOME,
  VIEW_CONTEXT_LANGUAGE_TOOLS,
  SET_VIEW_CONTEXT,
} from 'core/constants';


export type ViewContextType = {|
  context: ADDON_TYPE_EXTENSION | ADDON_TYPE_THEME | VIEW_CONTEXT_EXPLORE |
    VIEW_CONTEXT_HOME | VIEW_CONTEXT_LANGUAGE_TOOLS,
|}

export type ViewContextActionType = {|
  type: string,
  payload: ViewContextType,
|}

export const initialState = { context: VIEW_CONTEXT_EXPLORE };

export default function viewContext(
  state : ViewContextType = initialState, action : ViewContextActionType
) {
  switch (action.type) {
    case SET_VIEW_CONTEXT:
      return { ...state, context: action.payload.context };
    default:
      return state;
  }
}
