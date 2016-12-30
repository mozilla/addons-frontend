import {
  FEATURED_ADDONS_TO_LOAD,
  LANDING_PAGE_ADDON_COUNT,
} from 'amo/constants';
import { getFeatured, loadFeatured } from 'amo/actions/featured';
import { getLanding, loadLanding, failLanding } from 'amo/actions/landing';
import { featured as featuredAPI, search } from 'core/api';
import { SEARCH_SORT_POPULAR, SEARCH_SORT_TOP_RATED } from 'core/constants';
import { apiAddonType } from 'core/utils';


export function loadFeaturedAddons({ store: { dispatch, getState }, params }) {
  const state = getState();
  const addonType = apiAddonType(params.visibleAddonType);

  dispatch(getFeatured({ addonType }));

  const filters = { addonType, page_size: FEATURED_ADDONS_TO_LOAD };

  return featuredAPI({ api: state.api, filters })
    .then((response) => dispatch(
      loadFeatured({
        addonType,
        entities: response.entities,
        result: response.result,
      })
    ));
}

export function fetchLandingAddons({ addonType, api, dispatch }) {
  dispatch(getLanding({ addonType }));

  const filters = { addonType, page_size: LANDING_PAGE_ADDON_COUNT };
  const landingRequests = [
    featuredAPI({ api, filters }),
    search({
      api, filters: { ...filters, sort: SEARCH_SORT_TOP_RATED }, page: 1,
    }),
    search({
      api, filters: { ...filters, sort: SEARCH_SORT_POPULAR }, page: 1,
    }),
  ];

  return Promise.all(landingRequests)
    .then(([featured, highlyRated, popular]) => dispatch(
      loadLanding({ addonType, featured, highlyRated, popular })
    ))
    .catch(() => dispatch(failLanding({ addonType })));
}

export function loadLandingAddons({ store: { dispatch, getState }, params }) {
  const state = getState();
  const addonType = apiAddonType(params.visibleAddonType);

  return fetchLandingAddons({ addonType, api: state.api, dispatch });
}
