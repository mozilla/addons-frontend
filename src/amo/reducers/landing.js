import {
  LANDING_GET,
  LANDING_LOADED,
  LANDING_FAILED,
} from 'core/constants';


export const initialState = {
  addonType: null,
  featured: { count: 0, results: [] },
  highlyRated: { count: 0, results: [] },
  loading: false,
  popular: { count: 0, results: [] },
  // TODO: hmm, I think we also need to know the addonType
  resultsLoaded: false,
};

export default function landing(state = initialState, action) {
  const { payload } = action;
  switch (action.type) {
    case LANDING_GET:
      return {
        ...state,
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
              payload[key].entities.addons[slug]
            )),
          };
        }
      });

      return newState;
    }
    // TODO: remove this when we have an error handler
    case LANDING_FAILED:
      return { ...state, loading: false };
    default:
      return state;
  }
}
