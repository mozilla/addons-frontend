import { LOAD_DISCO_RESULTS } from 'disco/constants';

export default function discoResults(state = [], { type, payload }) {
  switch (type) {
    case LOAD_DISCO_RESULTS:
      // TODO: Actually reduce it as needed.
      // result.results.map((r) => entities.discoResults[r])
      return payload.results;
    default:
      return state;
  }
}
