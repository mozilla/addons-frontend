import { LANDING_PAGE_ADDON_COUNT } from 'amo/constants';
import { getLanding, loadLanding, failLanding } from 'amo/actions/landing';
import { featured as featuredAPI, search } from 'core/api';


export function fetchLandingAddons({ addonType, api, dispatch }) {
  dispatch(getLanding({ addonType }));

  const filters = { addonType, page_size: LANDING_PAGE_ADDON_COUNT };
  const landingRequests = [
    featuredAPI({ api, filters }),
    search({ api, filters: { ...filters, sort: 'rating' }, page: 1 }),
    search({ api, filters: { ...filters, sort: 'hotness' }, page: 1 }),
  ];

  return Promise.all(landingRequests)
    .then(([featured, highlyRated, popular]) => dispatch(
      loadLanding({ addonType, featured, highlyRated, popular })
    ))
    .catch(() => dispatch(failLanding({ addonType })));
}

export function loadLandingAddons({ store: { dispatch, getState }, params }) {
  const state = getState();
  const addonType = params.pluralAddonType.replace(/s$/, '');

  return fetchLandingAddons({ addonType, api: state.api, dispatch });
}
