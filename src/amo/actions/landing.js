import { LANDING_GET, LANDING_LOADED } from 'core/constants';

export function getLanding({ addonType, errorHandlerId }) {
  if (!addonType) {
    throw new Error('addonType must be set');
  }
  if (!errorHandlerId) {
    throw new Error('errorHandlerId must be set');
  }

  return {
    type: LANDING_GET,
    payload: { addonType, errorHandlerId },
  };
}

export function loadLanding({ addonType, featured, highlyRated, popular }) {
  if (!addonType) {
    throw new Error('addonType parameter cannot be empty');
  }
  if (!featured) {
    throw new Error('featured parameter cannot be empty');
  }
  if (!highlyRated) {
    throw new Error('highlyRated parameter cannot be empty');
  }
  if (!popular) {
    throw new Error('popular parameter cannot be empty');
  }
  return {
    type: LANDING_LOADED,
    payload: { addonType, featured, highlyRated, popular },
  };
}
