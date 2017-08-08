import { LOAD_DISCO_RESULTS } from 'disco/constants';

export default function discoResults(state = [], { type, payload }) {
  switch (type) {
    case LOAD_DISCO_RESULTS: {
      const { entities, result } = payload;
      // Unwrap the magical discoResults API schema.
      return result.results.map((guid) => entities.discoResults[guid]);
    }
    default:
      return state;
  }
}
