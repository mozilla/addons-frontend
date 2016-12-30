import {
  FEATURED_GET,
  FEATURED_LOADED,
} from 'core/constants';


export function getFeatured({ addonType }) {
  if (!addonType) {
    throw new Error('addonType must be set');
  }

  return {
    type: FEATURED_GET,
    payload: { addonType },
  };
}

export function loadFeatured({ addonType, entities, result }) {
  return {
    type: FEATURED_LOADED,
    payload: { addonType, entities, result },
  };
}
