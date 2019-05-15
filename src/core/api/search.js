/* @flow */
import { callApi } from 'core/api';
import {
  addVersionCompatibilityToFilters,
  convertFiltersToQueryParams,
  fixFiltersForAndroidThemes,
} from 'core/searchUtils';
import type { ApiState } from 'core/reducers/api';

// See: https://addons-server.readthedocs.io/en/latest/topics/api/addons.html#search
export type SearchFilters = {|
  addonType?: string,
  author?: string,
  category?: string,
  clientApp?: string,
  compatibleWithVersion?: number | string,
  exclude_addons?: string,
  featured?: boolean,
  guid?: string,
  operatingSystem?: string,
  page?: string,
  page_size?: string,
  query?: string,
  recommended?: boolean,
  sort?: string,
|};

export type SearchParams = {|
  api: ApiState,
  auth?: boolean,
  filters: SearchFilters,
|};

export function search({ api, auth = false, filters = {} }: SearchParams) {
  const newFilters = addVersionCompatibilityToFilters({
    filters: fixFiltersForAndroidThemes({ api, filters }),
    userAgentInfo: api.userAgentInfo,
  });

  return callApi({
    endpoint: 'addons/search',
    params: convertFiltersToQueryParams(newFilters),
    apiState: api,
    auth,
  });
}
