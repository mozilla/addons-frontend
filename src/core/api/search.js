import { oneLine } from 'common-tags';

import { addon, callApi } from 'core/api';
import { ADDON_TYPE_THEME, CLIENT_APP_ANDROID } from 'core/constants';
import log from 'core/logger';
import type { ApiStateType } from 'core/reducers/api';
import { convertFiltersToQueryParams } from 'core/searchUtils';


type SearchParams = {|
  api: ApiStateType,
  auth: boolean,
  // TODO: Make a "searchFilters" type because these are the same args
  // for convertFiltersToQueryParams.
  filters: {|
    addonType?: string,
    clientApp?: string,
    category?: string,
    page?: number,
    page_size?: number,
    query?: string,
    sort?: string,
  |},
|};

export default function search(
  { api, auth = false, filters = {} }: SearchParams
) {
  const _filters = { ...filters };
  if (!_filters.clientApp && api.clientApp) {
    log.debug(
      `No clientApp found in filters; using api.clientApp (${api.clientApp})`);
    _filters.clientApp = api.clientApp;
  }
  // TODO: This loads Firefox personas (lightweight themes) for Android
  // until github.com/mozilla/addons-frontend/issues/1723#issuecomment-278793546
  // and https://github.com/mozilla/addons-server/issues/4766 are addressed.
  // Essentially: right now there are no categories for the combo
  // of "Android" + "Themes" but Firefox lightweight themes will work fine
  // on mobile so we request "Firefox" + "Themes" for Android instead.
  // Obviously we need to fix this on the API end so our requests aren't
  // overridden, but for now this will work.
  if (
    _filters.clientApp === CLIENT_APP_ANDROID &&
    _filters.addonType === ADDON_TYPE_THEME
  ) {
    log.info(oneLine`addonType: ${_filters.addonType}/clientApp:
      ${_filters.clientApp} is not supported. Changing clientApp to "firefox"`);
    _filters.clientApp = 'firefox';
  }
  return callApi({
    endpoint: 'addons/search',
    schema: { results: [addon] },
    params: convertFiltersToQueryParams(_filters),
    state: api,
    auth,
  });
}
