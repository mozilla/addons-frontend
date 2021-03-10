import { oneLine } from 'common-tags';
import defaultConfig from 'config';

import {
  ADDON_TYPE_EXTENSION,
  CLIENT_APP_ANDROID,
  RECOMMENDED,
} from 'amo/constants';
import log from 'amo/logger';
import { USER_AGENT_OS_IOS } from 'amo/reducers/api';

export const paramsToFilter = {
  app: 'clientApp',
  appversion: 'compatibleWithVersion',
  author: 'author',
  category: 'category',
  exclude_addons: 'exclude_addons',
  guid: 'guid',
  page: 'page',
  // TODO: Change our filter to `pageSize`, for consistency.
  page_size: 'page_size',
  promoted: 'promoted',
  q: 'query',
  sort: 'sort',
  tag: 'tag',
  type: 'addonType',
};

export function addVersionCompatibilityToFilters({
  config = defaultConfig,
  filters,
  userAgentInfo,
} = {}) {
  if (!filters) {
    throw new Error('filters are required');
  }
  if (!userAgentInfo) {
    throw new Error('userAgentInfo is required');
  }

  const newFilters = { ...filters };

  // If the browser is Firefox or Firefox for Android and we're searching for
  // extensions, send the appversion param to get extensions marked as
  // compatible with this version.
  if (
    userAgentInfo.browser.name === 'Firefox' &&
    userAgentInfo.os.name !== USER_AGENT_OS_IOS
  ) {
    const browserVersion = parseInt(userAgentInfo.browser.version, 10);

    // We are only setting the `compatibleWithVersion` filter for browsers
    // with a version of at least 57, at least for now. Find the explanation
    // here: https://github.com/mozilla/addons-frontend/pull/2969#issuecomment-323551742
    if (browserVersion >= 57) {
      if (config.get('restrictSearchResultsToAppVersion')) {
        log.debug(oneLine`Setting "compatibleWithVersion" to current application
        version (Firefox ${browserVersion}) so only relevant extensions are
        displayed.`);
        newFilters.compatibleWithVersion = userAgentInfo.browser.version;
      } else {
        log.warn(oneLine`restrictSearchResultsToAppVersion config set;
          not setting "compatibleWithVersion" to current application version,
          even though it's above 57.`);
      }
    }
  }

  return newFilters;
}

// We use our own keys internally for things like the user's clientApp
// and addonType, but the API and our query params use different keys.
// We also use `q` for `query` in searches (for historic reasons).
// These methods convert the query params found in location.query to
// our filter keys and back again.
export function convertFiltersToQueryParams(filters) {
  return Object.keys(paramsToFilter).reduce((object, key) => {
    if (
      filters &&
      typeof filters[paramsToFilter[key]] !== 'undefined' &&
      filters[paramsToFilter[key]] !== ''
    ) {
      return { ...object, [key]: filters[paramsToFilter[key]] };
    }
    return object;
  }, {});
}

export function convertQueryParamsToFilters(params) {
  return Object.keys(paramsToFilter).reduce((object, key) => {
    let paramValue = params[key];

    // The param value could be an array if the param appeared on the URL
    // multiple times. In that case just use the first instance.
    if (Array.isArray(params[key])) {
      log.info(`${key} param was provided multiple times: ${paramValue}`);
      paramValue = params[key][0];
    }

    if (typeof paramValue !== 'undefined' && paramValue !== '') {
      return { ...object, [paramsToFilter[key]]: paramValue };
    }
    return object;
  }, {});
}

export const fixFiltersForClientApp = ({ api, filters }) => {
  const newFilters = { ...filters };

  if (!newFilters.clientApp && api.clientApp) {
    log.debug(
      `No clientApp found in filters; using api.clientApp (${api.clientApp})`,
    );
    newFilters.clientApp = api.clientApp;
  }

  // This adds a filter to return only Android compatible add-ons (which
  // currently) means they are Recommended. It also only includes extensions,
  // as only those are available on Android.
  if (newFilters.clientApp === CLIENT_APP_ANDROID) {
    newFilters.promoted = RECOMMENDED;
    newFilters.addonType = ADDON_TYPE_EXTENSION;
  }

  return newFilters;
};

// We don't allow `clientApp` or `lang` as a filter from location because
// they can lead to weird, unintuitive URLs where the queryParams override
// the `clientApp` and `lang` set elsewhere in the URL.
// Removing them from the filters (essentially ignoring them) means URLs
// like: `/en-US/firefox/search/?q=test&app=android&lang=fr` don't search
// for French Android add-ons.
// Maybe in the future this could redirect instead of ignoring bogus
// `location.query` data.
export const fixFiltersFromLocation = (filters) => {
  const fixedFilters = { ...filters };
  delete fixedFilters.clientApp;
  delete fixedFilters.lang;
  return fixedFilters;
};
