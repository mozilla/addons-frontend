/* @flow */
import { oneLine } from 'common-tags';

import { addon, callApi } from 'core/api';
import {
  ADDON_TYPE_THEME,
  CLIENT_APP_ANDROID,
} from 'core/constants';
import log from 'core/logger';
import type { ApiStateType } from 'core/reducers/api';
import {
  addVersionCompatibilityToFilters,
  convertFiltersToQueryParams,
} from 'core/searchUtils';


export type SearchParams = {|
  api: ApiStateType,
  auth: boolean,
  // TODO: Make a "searchFilters" type because these are the same args
  // for convertFiltersToQueryParams.
  filters: {|
    addonType?: string,
    author?: string,
    clientApp?: string,
    category?: string,
    compatibleWithVersion?: number|string,
    operatingSystem?: string,
    page?: number,
    page_size?: number,
    query?: string,
    sort?: string,
  |},
|};

export function search(
  { api, auth = false, filters = {} }: SearchParams
) {
  let newFilters = { ...filters };
  if (!newFilters.clientApp && api.clientApp) {
    log.debug(
      `No clientApp found in filters; using api.clientApp (${api.clientApp})`);
    newFilters.clientApp = api.clientApp;
  }

  // TODO: This loads Firefox personas (lightweight themes) for Android
  // until
  // https:// github.com/mozilla/addons-frontend/issues/1723#issuecomment-278793546
  // and https://github.com/mozilla/addons-server/issues/4766 are addressed.
  // Essentially: right now there are no categories for the combo
  // of "Android" + "Themes" but Firefox lightweight themes will work fine
  // on mobile so we request "Firefox" + "Themes" for Android instead.
  // Obviously we need to fix this on the API end so our requests aren't
  // overridden, but for now this will work.
  if (
    newFilters.clientApp === CLIENT_APP_ANDROID &&
    newFilters.addonType === ADDON_TYPE_THEME
  ) {
    log.info(oneLine`addonType: ${newFilters.addonType}/clientApp:
      ${newFilters.clientApp} is not supported. Changing clientApp to
      "firefox"`);
    newFilters.clientApp = 'firefox';
  }

  newFilters = addVersionCompatibilityToFilters({
    filters: newFilters,
    userAgentInfo: api.userAgentInfo,
  });

  return callApi({
    endpoint: 'addons/search',
    schema: { results: [addon] },
    params: convertFiltersToQueryParams(newFilters),
    state: api,
    auth,
  });
}
