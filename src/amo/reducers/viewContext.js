/* @flow */
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  VIEW_CONTEXT_HOME,
  VIEW_CONTEXT_LANGUAGE_TOOLS,
  SET_VIEW_CONTEXT,
} from 'amo/constants';

export type ViewContextType =
  | typeof ADDON_TYPE_EXTENSION
  | typeof ADDON_TYPE_STATIC_THEME
  | typeof VIEW_CONTEXT_HOME
  | typeof VIEW_CONTEXT_LANGUAGE_TOOLS;

export type ViewContextState = {|
  context: ViewContextType,
|};

export type ViewContextActionType = {|
  type: typeof SET_VIEW_CONTEXT,
  payload: ViewContextState,
|};

export const initialState = { context: VIEW_CONTEXT_HOME };

export default function viewContext(
  state: ViewContextState = initialState,
  // $FlowIgnore
  action: ViewContextActionType = {},
): ViewContextState {
  switch (action.type) {
    case SET_VIEW_CONTEXT:
      return { ...state, context: action.payload.context };

    default:
      return state;
  }
}
