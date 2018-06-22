import { SEARCH_STARTED, SEARCH_LOADED } from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';

const SEARCH_ABORTED = 'SEARCH_ABORTED';
const SEARCH_RESET = 'SEARCH_RESET';

export const initialState = {
  count: 0,
  filters: {},
  loading: false,
  results: [],
};

export const abortSearch = () => {
  return { type: SEARCH_ABORTED };
};

export const resetSearch = () => {
  return { type: SEARCH_RESET };
};

export default function search(state = initialState, action) {
  const { payload } = action;
  switch (action.type) {
    case SEARCH_STARTED:
      return {
        ...state,
        count: 0,
        filters: payload.filters,
        results: [],
        loading: true,
      };
    case SEARCH_LOADED:
      return {
        ...state,
        count: payload.result.count,
        loading: false,
        results: payload.result.results.map((slug) =>
          createInternalAddon(payload.entities.addons[slug]),
        ),
      };
    case SEARCH_ABORTED:
      return {
        ...state,
        count: 0,
        results: [],
        loading: false,
      };
    case SEARCH_RESET:
      return initialState;
    default:
      return state;
  }
}
