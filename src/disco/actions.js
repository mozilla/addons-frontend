export function discoResults(results) {
  return {
    type: 'DISCO_RESULTS',
    payload: {
      results,
    },
  };
}
