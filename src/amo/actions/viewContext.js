import { VIEW_CONTEXT_SET } from 'core/constants';


export function setViewContext(context) {
  return {
    type: VIEW_CONTEXT_SET,
    payload: { context },
  };
}
