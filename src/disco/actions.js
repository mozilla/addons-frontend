import { GET_DISCO_RESULTS, LOAD_DISCO_RESULTS } from 'disco/constants';

export function loadDiscoResults({ entities, result }) {
  // TODO: throw errors for missing params.
  return {
    type: LOAD_DISCO_RESULTS,
    payload: { entities, result },
  };
}

export function getDiscoResults({ errorHandlerId } = {}) {
  if (!errorHandlerId) {
    throw new Error('errorHandlerId is required');
  }
  return {
    type: GET_DISCO_RESULTS,
    payload: { errorHandlerId },
  };
}
