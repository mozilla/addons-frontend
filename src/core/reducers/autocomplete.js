export const AUTOCOMPLETE_LOADED = 'AUTOCOMPLETE_LOADED';
export const AUTOCOMPLETE_STARTED = 'AUTOCOMPLETE_STARTED';
export const AUTOCOMPLETE_CANCELLED = 'AUTOCOMPLETE_CANCELLED';

const initialState = {
  loading: false,
  suggestions: [],
};

export function autocompleteStart({ errorHandlerId, filters }) {
  if (!errorHandlerId) {
    throw new Error('errorHandlerId is required');
  }

  if (!filters) {
    throw new Error('filters are required');
  }

  return {
    type: AUTOCOMPLETE_STARTED,
    payload: { errorHandlerId, filters },
  };
}

export function autocompleteCancel() {
  return { type: AUTOCOMPLETE_CANCELLED };
}

export function autocompleteLoad({ results }) {
  if (!results) {
    throw new Error('results are required');
  }

  return {
    type: AUTOCOMPLETE_LOADED,
    payload: { results },
  };
}

export default function reducer(state = initialState, action = {}) {
  const { payload } = action;

  switch (action.type) {
    case AUTOCOMPLETE_CANCELLED:
      return initialState;
    case AUTOCOMPLETE_STARTED:
      return {
        ...initialState,
        loading: true,
      };
    case AUTOCOMPLETE_LOADED:
      return {
        ...state,
        loading: false,
        suggestions: payload.results
        // TODO: Remove this when `null` names are not returned. See:
        // https://github.com/mozilla/addons-server/issues/6189
          .filter((result) => result.name !== null)
          .map((result) => result.name),
      };
    default:
      return state;
  }
}
