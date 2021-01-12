/* @flow */
import type { ViewContextState } from 'amo/reducers/viewContext';
import { SET_VIEW_CONTEXT } from 'amo/constants';

export function setViewContext(
  context: $PropertyType<ViewContextState, 'context'>,
) {
  if (!context) {
    throw new Error('context parameter is required');
  }
  return {
    type: SET_VIEW_CONTEXT,
    payload: { context },
  };
}
