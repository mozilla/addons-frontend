import { GET_DISCO_RESULTS, DISCO_RESULTS } from 'disco/constants';

export function discoResults(results) {
  return {
    type: DISCO_RESULTS,
    payload: {
      results,
    },
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
