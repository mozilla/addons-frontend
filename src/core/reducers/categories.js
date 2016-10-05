import {
  CATEGORIES_GET,
  CATEGORIES_LOAD,
  CATEGORIES_FAILED,
} from 'core/constants';


const initialState = {
  categories: [],
  error: false,
  loading: false,
};

export default function categories(state = initialState, action) {
  const { payload } = action;

  switch (action.type) {
    case CATEGORIES_GET:
      return { ...state, ...payload, loading: true, categories: [] };
    case CATEGORIES_LOAD:
      return {
        ...state,
        ...payload,
        loading: false,
        categories: payload.results,
      };
    case CATEGORIES_FAILED:
      return { ...initialState, ...payload, error: true };
    default:
      return state;
  }
}
