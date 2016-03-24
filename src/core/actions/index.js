import { CALL_API, Schemas } from 'core/middleware/api';

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
