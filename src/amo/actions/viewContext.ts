import { $PropertyType } from 'utility-types';

import type { ViewContextState } from 'amo/reducers/viewContext';
import { SET_VIEW_CONTEXT } from 'amo/constants';

type ContextType = $PropertyType<ViewContextState, 'context'>;
export type SetViewContextAction = {
  type: typeof SET_VIEW_CONTEXT;
  payload: {
    context: ContextType;
  };
};
export const setViewContext = (context: ContextType): SetViewContextAction => {
  if (!context) {
    throw new Error('context parameter is required');
  }

  return {
    type: SET_VIEW_CONTEXT,
    payload: {
      context,
    },
  };
};