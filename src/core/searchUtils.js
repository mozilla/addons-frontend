import { oneLine } from 'common-tags';
import defaultConfig from 'config';

import {
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
  CLIENT_APP_ANDROID,
} from 'core/constants';
import log from 'core/logger';

export const operatingSystems = {
  Linux: 'linux',
  'Mac OS': 'mac',
  Windows: 'windows',
};

export const paramsToFilter = {
  app: 'clientApp',
  appversion: 'compatibleWithVersion',
  author: 'author',
  category: 'category',
  exclude_addons: 'exclude_addons',
  featured: 'featured',
  guid: 'guid',
  page: 'page',
  // TODO: Change our filter to `pageSize`, for consistency.
  page_size: 'page_size',
  platform: 'operatingSystem',
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
    userAgentInfo.os.name !== 'iOS'
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
    if (typeof params[key] !== 'undefined' && params[key] !== '') {
      return { ...object, [paramsToFilter[key]]: params[key] };
    }
    return object;
  }, {});
}

export function convertOSToFilterValue(name) {
  if (name in operatingSystems) {
    return operatingSystems[name];
  }

  log.info(
    `operatingSystem "${name}" not recognized so falling back to no OS.`,
  );

  return undefined;
}

export function hasSearchFilters(filters) {
  const filtersSubset = { ...filters };
  delete filtersSubset.clientApp;
  delete filtersSubset.lang;
  delete filtersSubset.page;
  delete filtersSubset.page_size;
  return filtersSubset && !!Object.keys(filtersSubset).length;
}

export const fixFiltersForAndroidThemes = ({ api, filters }) => {
  const newFilters = { ...filters };

  if (!newFilters.clientApp && api.clientApp) {
    log.debug(
      `No clientApp found in filters; using api.clientApp (${api.clientApp})`,
    );
    newFilters.clientApp = api.clientApp;
  }

  if (newFilters.clientApp !== CLIENT_APP_ANDROID) {
    return newFilters;
  }

  // There are no categories containing LWT for Android, so we request ST only
  // for Android, but only when there is a category set.
  // See: https://github.com/mozilla/addons-frontend/issues/7459
  if (
    newFilters.category &&
    newFilters.addonType &&
    newFilters.addonType.includes(ADDON_TYPE_THEME)
  ) {
    newFilters.addonType = ADDON_TYPE_STATIC_THEME;
  }

  return newFilters;
};
