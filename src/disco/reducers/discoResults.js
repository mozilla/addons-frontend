import { LOAD_DISCO_RESULTS } from 'disco/constants';

export default function discoResults(state = [], { type, payload }) {
  if (type === LOAD_DISCO_RESULTS) {
    return payload.results;
  }
  return state;
}
