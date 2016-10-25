import { DISCO_RESULTS } from 'disco/constants';

export function discoResults(results) {
  return {
    type: DISCO_RESULTS,
    payload: {
      results,
    },
  };
}
