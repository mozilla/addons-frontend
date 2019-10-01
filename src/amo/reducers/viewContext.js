/* @flow */
import config from 'config';
import { LOCATION_CHANGE } from 'connected-react-router';

import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  VIEW_CONTEXT_EXPLORE,
  VIEW_CONTEXT_HOME,
  VIEW_CONTEXT_LANGUAGE_TOOLS,
  SET_VIEW_CONTEXT,
} from 'core/constants';

export type ViewContextType =
  | typeof ADDON_TYPE_EXTENSION
  | typeof ADDON_TYPE_THEME
  | typeof VIEW_CONTEXT_EXPLORE
  | typeof VIEW_CONTEXT_HOME
  | typeof VIEW_CONTEXT_LANGUAGE_TOOLS;

export type ViewContextState = {|
  context: ViewContextType,
|};

export type ViewContextActionType = {|
  type: typeof SET_VIEW_CONTEXT,
  payload: ViewContextState,
|};

export const initialState = { context: VIEW_CONTEXT_EXPLORE };

export default function viewContext(
  state: ViewContextState = initialState,
  action: ViewContextActionType,
  _config: typeof config = config,
) {
  switch (action.type) {
    case SET_VIEW_CONTEXT:
      return { ...state, context: action.payload.context };
    case LOCATION_CHANGE: {
      if (!_config.get('server') && state.context === VIEW_CONTEXT_HOME) {
        return initialState;
      }
      return state;
    }
    default:
      return state;
  }
}
