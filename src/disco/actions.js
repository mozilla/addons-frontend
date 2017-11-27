import { GET_DISCO_RESULTS, LOAD_DISCO_RESULTS } from 'disco/constants';

export function getDiscoResults({
  errorHandlerId, platform, telemetryClientId = undefined,
} = {}) {
  if (!errorHandlerId) {
    throw new Error('errorHandlerId is required');
  }
  if (!platform) {
    throw new Error('platform is required');
  }

  return {
    type: GET_DISCO_RESULTS,
    payload: { errorHandlerId, platform, telemetryClientId },
  };
}

export function loadDiscoResults({ entities, result } = {}) {
  if (!entities) {
    throw new Error('entities parameter is required');
  }
  if (!result) {
    throw new Error('result parameter is required');
  }
  return {
    type: LOAD_DISCO_RESULTS,
    payload: { entities, result },
  };
}
