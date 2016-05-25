export default function discoResults(state = [], { type, payload }) {
  if (type === 'DISCO_RESULTS') {
    return payload.results;
  }
  return state;
}
