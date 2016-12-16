import {
  LANDING_GET,
  LANDING_LOADED,
  LANDING_FAILED,
} from 'core/constants';


export function getLanding({ addonType }) {
  if (!addonType) {
    throw new Error('addonType must be set');
  }

  return {
    type: LANDING_GET,
    payload: { addonType },
  };
}

export function loadLanding({ addonType, featured, highlyRated, popular }) {
  return {
    type: LANDING_LOADED,
    payload: { addonType, featured, highlyRated, popular },
  };
}

export function failLanding({ addonType }) {
  return {
    type: LANDING_FAILED,
    payload: { addonType },
  };
}
