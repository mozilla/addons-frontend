import {
  FEATURED_GET,
  FEATURED_LOADED,
  FEATURED_FAILED,
} from 'core/constants';

const initialState = {
  count: 0,
  loading: false,
  results: [],
};

export default function featured(state = initialState, action) {
  const { payload } = action;
  switch (action.type) {
    case FEATURED_GET:
      return { ...state, ...payload, count: 0, loading: true, results: [] };
    case FEATURED_LOADED:
      return {
        ...state,
        count: payload.result.count,
        loading: false,
        results: payload.result.results.map((slug) => payload.entities.addons[slug]),
        featured: payload.result.featured,
      };
    case FEATURED_FAILED:
      return {
        ...initialState,
      };
    default:
      return state;
  }
}
