/* @flow */
import type { ViewContextType } from 'amo/reducers/viewContext';
import { SET_VIEW_CONTEXT } from 'core/constants';


export function setViewContext(context : ViewContextType) {
  return {
    type: SET_VIEW_CONTEXT,
    payload: { context },
  };
}
