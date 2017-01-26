import { FEATURED_GET, FEATURED_LOADED } from 'core/constants';


export const initialState = {
  addonType: null,
  loading: false,
  results: [],
};

export default function featured(state = initialState, action) {
  const { payload } = action;
  switch (action.type) {
    case FEATURED_GET:
      return { ...state, addonType: payload.addonType, loading: true };
    case FEATURED_LOADED:
      return {
        ...state,
        addonType: payload.addonType,
        loading: false,
        results: payload.result.results.map((slug) => (
          payload.entities.addons[slug]
        )),
      };
    default:
      return state;
  }
}
