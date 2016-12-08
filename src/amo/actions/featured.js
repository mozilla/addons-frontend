import {
  FEATURED_GET,
  FEATURED_LOADED,
  FEATURED_FAILED,
} from 'core/constants';


export function featuredGet({ addonType }) {
  return {
    type: FEATURED_GET,
    payload: { addonType },
  };
}

export function featuredLoad({ entities, result, addonType }) {
  return {
    type: FEATURED_LOADED,
    payload: { entities, result, addonType },
  };
}

export function featuredFail({ addonType }) {
  return {
    type: FEATURED_FAILED,
    payload: { addonType },
  };
}
