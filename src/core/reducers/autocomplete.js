import { getAddonIconUrl } from 'core/imageUtils';


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

export const createInternalSuggestion = (externalSuggestion) => {
  return {
    iconUrl: getAddonIconUrl(externalSuggestion),
    name: externalSuggestion.name,
    url: externalSuggestion.url,
  };
};

export default function reducer(state = initialState, action = {}) {
  const { payload } = action;

  switch (action.type) {
    case AUTOCOMPLETE_CANCELLED:
      return {
        ...state,
        loading: false,
      };
    case AUTOCOMPLETE_STARTED:
      return {
        ...initialState,
        loading: true,
      };
    case AUTOCOMPLETE_LOADED:
    {
      const suggestions = payload.results
        // TODO: Remove this when `null` names are not returned. See:
        // https://github.com/mozilla/addons-server/issues/6189
        .filter((result) => result.name !== null)
        .map((result) => createInternalSuggestion(result));

      return {
        ...state,
        loading: false,
        suggestions,
      };
    }
    default:
      return state;
  }
}
