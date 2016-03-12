import { SEARCH_REQUEST, SEARCH_SUCCESS } from 'search/actions';

const initialState = {
  query: null,
};

export default function search(state = initialState, action) {
  const { response } = action;
  switch (action.type) {
    case SEARCH_REQUEST:
      return Object.assign({}, {query: 'gyro'});
    case SEARCH_SUCCESS:
      return Object.assign({}, state, {
        results: response.result.results.map((slug) => response.entities.addons[slug]),
      });
    default:
      return state;
  }
}
