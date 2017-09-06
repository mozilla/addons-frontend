import { GET_DISCO_RESULTS, LOAD_DISCO_RESULTS } from 'disco/constants';

export function getDiscoResults({ errorHandlerId } = {}) {
  if (!errorHandlerId) {
    throw new Error('errorHandlerId is required');
  }
  return {
    type: GET_DISCO_RESULTS,
    payload: { errorHandlerId },
  };
}

export function loadDiscoResults({ entities, result } = {}) {
  if (!entities) {
    throw new Error('entities parameter is required');
  }
  if (!result) {
    throw new Error('result parameter is required');
  }
  // TODO: change payload to entities.discoResults so it can throw an
  // error if discoResults is missing?
  return {
    type: LOAD_DISCO_RESULTS,
    payload: { entities, result },
  };
}
