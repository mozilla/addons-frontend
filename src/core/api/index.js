import { CALL_API, Schemas } from 'core/middleware/api';

import config from 'config';

const API_HOST = config.get('apiHost');
const API_BASE = `${API_HOST}/api/v3`;

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

export const ADDON_REQUEST = 'ADDON_REQUEST';
export const ADDON_SUCCESS = 'ADDON_SUCCESS';
export const ADDON_FAILURE = 'ADDON_FAILURE';

function fetchAddon(slug) {
  return {
    [CALL_API]: {
      types: [ADDON_REQUEST, ADDON_SUCCESS, ADDON_FAILURE],
      endpoint: `addons/addon/${slug}/`,
      schema: Schemas.ADDON,
    },
  };
}

export function loadAddon(slug) {
  return (dispatch) => {
    dispatch(fetchAddon(slug));
  };
}
