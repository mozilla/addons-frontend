import { GET_DISCO_RESULTS, LOAD_DISCO_RESULTS } from 'disco/constants';

export function getDiscoResults({ errorHandlerId, taarParams = {} } = {}) {
  if (!errorHandlerId) {
    throw new Error('errorHandlerId is required');
  }
  if (!taarParams.platform) {
    throw new Error('taarParams.platform is required');
  }

  return {
    type: GET_DISCO_RESULTS,
    payload: { errorHandlerId, taarParams },
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
