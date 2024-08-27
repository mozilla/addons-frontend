/* @flow */
import { oneLine } from 'common-tags';

import { SEARCH_SORT_RANDOM } from 'amo/constants';
import { callApi } from 'amo/api';
import {
  addVersionCompatibilityToFilters,
  convertFiltersToQueryParams,
  fixFiltersForClientApp,
} from 'amo/searchUtils';
import log from 'amo/logger';
import type { ApiState } from 'amo/reducers/api';
import type { ExternalAddonType } from 'amo/types/addons';
import type { PaginatedApiResponse } from 'amo/types/api';

// See: https://addons-server.readthedocs.io/en/latest/topics/api/addons.html#search
export type SearchFilters = {|
  addonType?: string,
  author?: string,
  category?: string,
  clientApp?: string,
  color?: string,
  compatibleWithVersion?: number | string,
  exclude_addons?: string,
  guid?: string,
  page?: string,
  page_size?: string,
  promoted?: string,
  query?: string,
  sort?: string,
  tag?: string,
|};

export type SearchParams = {|
  _fixFiltersForClientApp?: typeof fixFiltersForClientApp,
  api: ApiState,
  auth?: boolean,
  filters: SearchFilters,
|};

export function search({
  _fixFiltersForClientApp = fixFiltersForClientApp,
  api,
  auth = false,
  filters = {},
}: SearchParams): Promise<PaginatedApiResponse<ExternalAddonType>> {
  const newFilters = addVersionCompatibilityToFilters({
    filters: _fixFiltersForClientApp({ api, filters }),
    userAgentInfo: api.userAgentInfo,
  });

  // The API says: 'The "sort" parameter "random" can only be specified when
  // the "featured" or "promoted" parameter is also present, and the "q"
  // parameter absent.'
  // Let's make sure we don't send invalid filters.
  // Note that we no longer make use of the "featured" filter.
  if (newFilters.sort && newFilters.sort === SEARCH_SORT_RANDOM) {
    if (!newFilters.promoted || newFilters.q) {
      delete newFilters.sort;

      log.warn(oneLine`search api filter "sort=random" has been removed before
        calling the api to avoid an incompatibility error.`);
    }
  }

  return callApi({
    endpoint: 'addons/search',
    params: convertFiltersToQueryParams(newFilters),
    apiState: api,
    auth,
  });
}
