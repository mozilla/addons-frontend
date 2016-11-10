import {
  SEARCH_STARTED,
  SEARCH_LOADED,
  SEARCH_FAILED,
  SET_QUERY,
} from 'core/constants';


const initialState = {
  category: undefined,
  count: 0,
  loading: false,
  page: 1,
  query: undefined,
  results: [],
};

export default function search(state = initialState, action) {
  const { payload } = action;

  switch (action.type) {
    case SET_QUERY:
      return { ...state, ...payload };
    case SEARCH_STARTED:
      return { ...state, ...payload, count: 0, loading: true, results: [] };
    case SEARCH_LOADED:
      return {
        ...state,
        ...payload,
        count: payload.result.count,
        loading: false,
        results: payload.result.results.map((slug) => (
          payload.entities.addons[slug]
        )),
      };
    case SEARCH_FAILED:
      return { ...initialState, ...payload, page: payload.page };
    default:
      return state;
  }
}
