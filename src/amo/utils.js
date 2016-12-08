import deepEqual from 'deep-eql';

import { LANDING_PAGE_ADDON_COUNT } from 'amo/constants';
import { featuredGet, featuredLoad, featuredFail } from 'amo/actions/featured';
import {
  highlyRatedStart,
  highlyRatedLoad,
  highlyRatedFail,
} from 'amo/actions/highlyRated';
import { popularStart, popularLoad, popularFail } from 'amo/actions/popular';
import { featured, search } from 'core/api';


export function getFeatured({ addonType, api, dispatch }) {
  dispatch(featuredGet({ addonType }));

  return featured({ addonType, api, page_size: LANDING_PAGE_ADDON_COUNT })
    .then((response) => dispatch(featuredLoad({ addonType, ...response })))
    .catch(() => dispatch(featuredFail({ addonType })));
}

export function getHighlyRated({ api, dispatch, filters }) {
  dispatch(highlyRatedStart({ filters }));

  return search({ api, filters, page: 1 })
    .then((response) => dispatch(highlyRatedLoad({ filters, ...response })))
    .catch(() => dispatch(highlyRatedFail({ filters })));
}

export function getPopular({ api, dispatch, filters }) {
  dispatch(popularStart({ filters }));

  return search({ api, filters, page: 1 })
    .then((response) => dispatch(popularLoad({ filters, ...response })))
    .catch(() => dispatch(popularFail({ filters })));
}

export function isLoaded({ filters, state }) {
  return deepEqual(filters, state.filters) && !state.loading;
}

export function loadFeatured(
  { store: { dispatch, getState }, params }
) {
  const state = getState();
  const addonType = params.addonType.replace(/s$/, '');

  if (!(addonType === state.addonType && !state.loading)) {
    return getFeatured({ addonType, api: state.api, dispatch });
  }

  return true;
}

export function loadHighlyRated(
  { store: { dispatch, getState }, params }
) {
  const state = getState();
  const addonType = params.addonType.replace(/s$/, '');
  const sort = 'rating';
  const filters = { addonType, page_size: LANDING_PAGE_ADDON_COUNT, sort };

  if (!isLoaded({ filters, state })) {
    return getHighlyRated({ api: state.api, dispatch, filters });
  }

  return true;
}

export function loadPopular(
  { store: { dispatch, getState }, params }
) {
  const state = getState();
  const addonType = params.addonType.replace(/s$/, '');
  const sort = 'hotness';
  const filters = { addonType, page_size: LANDING_PAGE_ADDON_COUNT, sort };

  if (!isLoaded({ filters, state })) {
    return getPopular({ api: state.api, dispatch, filters });
  }

  return true;
}
