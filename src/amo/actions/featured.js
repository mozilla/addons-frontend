import { FEATURED_GET, FEATURED_LOADED } from 'core/constants';

export function getFeatured({ addonType, errorHandlerId }) {
  if (!addonType) {
    throw new Error('addonType must be set');
  }
  if (!errorHandlerId) {
    throw new Error('errorHandlerId must be set');
  }

  return {
    type: FEATURED_GET,
    payload: { addonType, errorHandlerId },
  };
}

export function loadFeatured({ addonType, entities, result }) {
  return {
    type: FEATURED_LOADED,
    payload: { addonType, entities, result },
  };
}
