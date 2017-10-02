import {
  SEARCH_STARTED,
  SEARCH_LOADED,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';

export const initialState = {
  count: 0,
  filters: {},
  loading: false,
  results: [],
};

export default function search(state = initialState, action) {
  const { payload } = action;
  switch (action.type) {
    case SEARCH_STARTED:
      return {
        ...state,
        filters: payload.filters,
        results: [],
        loading: true,
      };
    case SEARCH_LOADED:
      return {
        ...state,
        count: payload.result.count,
        loading: false,
        results: payload.result.results.map((slug) => (
          createInternalAddon(payload.entities.addons[slug])
        )),
      };
    default:
      return state;
  }
}
