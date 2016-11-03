import {
  HIGHLY_RATED_GET,
  HIGHLY_RATED_LOADED,
  HIGHLY_RATED_FAILED,
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
    case HIGHLY_RATED_GET:
      return { ...state, ...payload, count: 0, loading: true, results: [] };
    case HIGHLY_RATED_LOADED:
      return {
        ...state,
        count: payload.result.count,
        loading: false,
        results: payload.result.results.map((slug) => payload.entities.addons[slug]),
      };
    case HIGHLY_RATED_FAILED:
      return {
        ...initialState,
      };
    default:
      return state;
  }
}
