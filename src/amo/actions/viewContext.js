/* @flow */
import type { ViewContextType } from 'amo/reducers/viewContext';
import { SET_VIEW_CONTEXT } from 'core/constants';

export function setViewContext(
  context: $PropertyType<ViewContextType, 'context'>,
) {
  if (!context) {
    throw new Error('context parameter is required');
  }
  return {
    type: SET_VIEW_CONTEXT,
    payload: { context },
  };
}
