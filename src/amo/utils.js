import base62 from 'base62';

import {
  FEATURED_ADDONS_TO_LOAD,
  LANDING_PAGE_ADDON_COUNT,
} from 'amo/constants';
import { getFeatured, loadFeatured } from 'amo/actions/featured';
import { getLanding, loadLanding, failLanding } from 'amo/actions/landing';
import NotAuthorized from 'amo/components/ErrorPage/NotAuthorized';
import NotFound from 'amo/components/ErrorPage/NotFound';
import ServerError from 'amo/components/ErrorPage/ServerError';
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
  try {
    const addonType = apiAddonType(params.visibleAddonType);

    return fetchLandingAddons({ addonType, api: state.api, dispatch });
  } catch (err) {
    return Promise.reject(err);
  }
}

export function getErrorComponent(status) {
  switch (status) {
    case 401:
      return NotAuthorized;
    case 404:
      return NotFound;
    case 500:
    default:
      return ServerError;
  }
}

/*
 * Return a base62 object that encodes/decodes just like how Django does it
 * for cookie timestamps.
 *
 * See:
 * https://github.com/django/django/blob/0b9f366c60134a0ca2873c156b9c80acb7ffd8b5/django/core/signing.py#L180
 */
export function getDjangoBase62() {
  // This is the alphabet used by Django.
  base62.setCharacterSet(
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
  return base62;
}
