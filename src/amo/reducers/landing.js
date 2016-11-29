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
};

export default function landing(state = initialState, action) {
  const { payload } = action;
  switch (action.type) {
    case LANDING_GET:
      return { ...state, addonType: payload.addonType, loading: true };
    case LANDING_LOADED: {
      const newState = { ...state, loading: false };

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
    case LANDING_FAILED:
      return { ...state, loading: false };
    default:
      return state;
  }
}
