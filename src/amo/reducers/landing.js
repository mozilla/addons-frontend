import { LANDING_GET, LANDING_LOADED } from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';

export const initialState = {
  addonType: null,
  category: null,
  featured: { count: 0, results: [] },
  highlyRated: { count: 0, results: [] },
  loading: false,
  trending: { count: 0, results: [] },
  resultsLoaded: false,
};

export default function landing(state = initialState, action) {
  const { payload } = action;
  switch (action.type) {
    case LANDING_GET:
      return {
        ...initialState,
        addonType: payload.addonType,
        category: payload.category,
        loading: true,
        resultsLoaded: false,
      };

    case LANDING_LOADED: {
      const newState = { ...state, loading: false, resultsLoaded: true };

      ['featured', 'highlyRated', 'trending'].forEach((key) => {
        if (payload[key]) {
          newState[key] = {
            count: payload[key].count,
            results: payload[key].results.map((addon) =>
              createInternalAddon(addon),
            ),
          };
        }
      });

      return newState;
    }
    default:
      return state;
  }
}
