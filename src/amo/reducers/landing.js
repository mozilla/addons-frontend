import {
  LANDING_GET,
  LANDING_LOADED,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';


export const initialState = {
  addonType: null,
  featured: { count: 0, results: [] },
  highlyRated: { count: 0, results: [] },
  loading: false,
  popular: { count: 0, results: [] },
  resultsLoaded: false,
};

export default function landing(state = initialState, action) {
  const { payload } = action;
  switch (action.type) {
    case LANDING_GET:
      return {
        ...initialState,
        addonType: payload.addonType,
        loading: true,
        resultsLoaded: false,
      };
    case LANDING_LOADED: {
      const newState = { ...state, loading: false, resultsLoaded: true };

      ['featured', 'highlyRated', 'popular'].forEach((key) => {
        if (payload[key]) {
          newState[key] = {
            count: payload[key].result.count,
            results: payload[key].result.results.map((slug) => (
              createInternalAddon(payload[key].entities.addons[slug])
            )),
          };
        }
      });

      return newState;
    }
    default:
      return state;
  }
}
