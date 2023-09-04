import { oneLine } from 'common-tags';
import defaultConfig from 'config';

import {
  ADDON_TYPE_EXTENSION,
  CLIENT_APP_ANDROID,
  RECOMMENDED,
} from 'amo/constants';
import log from 'amo/logger';
import { USER_AGENT_OS_IOS } from 'amo/reducers/api';
import { isFirefoxForAndroid } from 'amo/utils/compatibility';

// TODO: we need to specify these API params in `paramsToFilter` so that the
// app uses them when making API calls but ideally we'd revisit the filter
// names when we need to use the filters in our code (because `foo__lte` isn't
// a great name).
export function generateThresholdParams(param) {
  return ['__gt', '__lt', '__lte', '__gte', ''].reduce((object, key) => {
    return { ...object, [`${param}${key}`]: `${param}${key}` };
  }, {});
}

export const paramsToFilter = {
  addonInstallSource: 'addonInstallSource',
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
  ...generateThresholdParams('ratings'),
  sort: 'sort',
  tag: 'tag',
  type: 'addonType',
  ...generateThresholdParams('users'),
};

export function addVersionCompatibilityToFilters({
  config = defaultConfig,
  filters,
  api,
} = {}) {
  if (!filters) {
    throw new Error('filters are required');
  }
  if (!api.userAgentInfo) {
    throw new Error('api.userAgentInfo is required');
  }

  const newFilters = { ...filters };
  const userAgentInfo = api.userAgentInfo;

  if (!newFilters.clientApp && api.clientApp) {
    log.debug(
      `No clientApp found in filters; using api.clientApp (${api.clientApp})`,
    );
    newFilters.clientApp = api.clientApp;
  }

  // If the browser is Firefox or Firefox for Android and we're searching for
  // extensions, send the appversion param to get extensions marked as
  // compatible with this version.
  if (
    userAgentInfo.browser.name === 'Firefox' &&
    userAgentInfo.os.name !== USER_AGENT_OS_IOS
  ) {
    const browserVersion = parseInt(userAgentInfo.browser.version, 10);

    newFilters.compatibleWithVersion = userAgentInfo.browser.version;
  }

  if (newFilters.clientApp === CLIENT_APP_ANDROID) {
    // On Android pages, we only want extensions.
    newFilters.addonType = ADDON_TYPE_EXTENSION;

    if (config.get('restrictAndroidToRecommended')) {
      // Legacy Fenix behavior before we started working on general
      // availability: only recommended extensions are displayed.
      log.debug(oneLine`Setting "promoted" to "RECOMMENDED" so only recommended
      extensions are displayed on Android.`);
      newFilters.promoted = RECOMMENDED;
    } else if (!isFirefoxForAndroid(api.userAgentInfo)) {
      // If the browser is not Firefox for Android, we want to filter out
      // extensions to only the limited set, so we force compatibleWithVersion
      // to 117.0. This should be removed after General Avaibility. This should
      // apply even to Firefox Desktop browsing Android pages.
      newFilters.compatibleWithVersion = '117.0'
    }
    // Otherwise we rely on the regular compatibleWithVersion behavior above.
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
