import {
  POPULAR_GET,
  POPULAR_LOADED,
  POPULAR_FAILED,
} from 'core/constants';

const initialState = {
  count: 0,
  filters: {},
  loading: false,
  results: [],
};

export default function popular(state = initialState, action) {
  const { payload } = action;
  switch (action.type) {
    case POPULAR_GET:
      return { ...state, ...payload, count: 0, loading: true, results: [] };
    case POPULAR_LOADED:
      return {
        ...state,
        count: payload.result.count,
        loading: false,
        results: payload.result.results.map((slug) => payload.entities.addons[slug]),
      };
    case POPULAR_FAILED:
      return {
        ...initialState,
      };
    default:
      return state;
  }
}
