import { LOAD_DISCO_RESULTS } from 'disco/constants';

export default function discoResults(state = [], { payload, type }) {
  switch (type) {
    case LOAD_DISCO_RESULTS: {
      const { entities, result } = payload;
      // The API schema that complicates result.results can be found
      // in disco/api.js
      return result.results.map((guid) => entities.discoResults[guid]);
    }
    default:
      return state;
  }
}
