const initialState = {
  query: null,
  loading: false,
  results: [],
};

export default function search(state = initialState, action) {
  const { payload } = action;
  switch (action.type) {
    case 'SET_QUERY':
      return Object.assign({}, state, {query: payload.query});
    case 'SEARCH_STARTED':
      return Object.assign({}, state, {query: payload.query, loading: true, results: []});
    case 'SEARCH_LOADED':
      return Object.assign({}, state, {
        query: payload.query,
        loading: false,
        results: payload.result.results.map((slug) => payload.entities.addons[slug]),
      });
    default:
      return state;
  }
}
