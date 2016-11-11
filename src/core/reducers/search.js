import {
  SEARCH_STARTED,
  SEARCH_LOADED,
  SEARCH_FAILED,
} from 'core/constants';

const initialState = {
  count: 0,
  filters: {},
  loading: false,
  page: 1,
  results: [],
};

export default function search(state = initialState, action) {
  const { payload } = action;
  switch (action.type) {
    case SEARCH_STARTED:
      return { ...state, ...payload, count: 0, loading: true, results: [] };
    case SEARCH_LOADED:
      return {
        ...state,
        count: payload.result.count,
        loading: false,
        filters: payload.filters,
        results: payload.result.results.map((slug) => payload.entities.addons[slug]),
      };
    case SEARCH_FAILED:
      return {
        ...initialState,
        page: payload.page,
        filters: payload.filters,
      };
    default:
      return state;
  }
}
