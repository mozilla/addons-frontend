import { CALL_API, Schemas } from 'core/middleware/api';

export const SEARCH_REQUEST = 'SEARCH_REQUEST';
export const SEARCH_SUCCESS = 'SEARCH_SUCCESS';
export const SEARCH_FAILURE = 'SEARCH_FAILURE';

function fetchSearch({ query, page }) {
  return {
    [CALL_API]: {
      types: [SEARCH_REQUEST, SEARCH_SUCCESS, SEARCH_FAILURE],
      endpoint: `addons/search/?q=${query}&page=${page || 1}`,
      schema: Schemas.ADDON_ARRAY,
    },
  };
}

export function loadSearch({ query, page }) {
  return (dispatch) => {
    dispatch(fetchSearch({ query, page }));
  };
}
