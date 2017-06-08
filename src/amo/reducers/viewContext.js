/* @flow */
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  VIEW_CONTEXT_EXPLORE,
  VIEW_CONTEXT_HOMEPAGE,
  VIEW_CONTEXT_SET,
} from 'core/constants';


export type ViewContextType = {|
  context: ADDON_TYPE_EXTENSION | ADDON_TYPE_THEME | VIEW_CONTEXT_EXPLORE |
    VIEW_CONTEXT_HOMEPAGE,
|}

export type ViewContextActionType = {|
  type: string,
  payload: ViewContextType,
|}

export const initialState = { context: VIEW_CONTEXT_EXPLORE };

export default function viewContext(
  state : ViewContextType = initialState, action : ViewContextActionType
) {
  const { payload } = action;
  switch (action.type) {
    case VIEW_CONTEXT_SET:
      return { ...state, context: payload.context };
    default:
      return state;
  }
}
