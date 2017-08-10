/* @flow */
/* global $PropertyType */
import type { ViewContextType } from 'amo/reducers/viewContext';
import { SET_VIEW_CONTEXT } from 'core/constants';


export function setViewContext(
  context: $PropertyType<ViewContextType, 'context'>
) {
  return {
    type: SET_VIEW_CONTEXT,
    payload: { context },
  };
}
