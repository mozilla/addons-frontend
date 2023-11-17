import { oneLine } from 'common-tags';
import invariant from 'invariant';

import {
  ADDON_TYPE_EXTENSION,
  APPVERSION_FOR_ANDROID,
  CLIENT_APP_ANDROID,
} from 'amo/constants';
import log from 'amo/logger';
import { USER_AGENT_OS_ANDROID, USER_AGENT_OS_IOS } from 'amo/reducers/api';

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
  filters,
  userAgentInfo,
} = {}) {
  invariant(filters, 'filters are required');
  invariant(userAgentInfo, 'userAgentInfo is required');

  const newFilters = { ...filters };

  // If the browser is Firefox or Firefox for Android and we're searching for
  // extensions, send the appversion param to get extensions marked as
  // compatible with this version.
  if (
    userAgentInfo.browser.name === 'Firefox' &&
    userAgentInfo.os.name !== USER_AGENT_OS_IOS
  ) {
    const browserVersion = parseInt(userAgentInfo.browser.version, 10);

    log.debug(oneLine`Setting "compatibleWithVersion" to current application
      version (Firefox ${browserVersion}) so only relevant extensions are
      displayed.`);
    newFilters.compatibleWithVersion = userAgentInfo.browser.version;
  }

  // This adds a filter to return only Android compatible add-ons. We cannot
  // add this fix to `fixFiltersForClientApp()` because we need to override
  // `newFilters.compatibleWithVersion`.
  if (newFilters.clientApp === CLIENT_APP_ANDROID) {
    // On Android, we only have extensions.
    log.debug(oneLine`Setting "addonType" to "extension" for Android.`);
    newFilters.addonType = ADDON_TYPE_EXTENSION;

    // If the browser is not Firefox for Android, we want to filter out
    // extensions to only the limited set, so we force-set the value of
    // `compatibleWithVersion`. This should be removed after General
    // Avaibility.
    //
    // This will apply even to Firefox Desktop browsing Android pages.
    if (
      userAgentInfo.browser.name !== 'Firefox' ||
      userAgentInfo.os.name !== USER_AGENT_OS_ANDROID
    ) {
      log.debug(oneLine`Setting "compatibleWithVersion" to
          "${APPVERSION_FOR_ANDROID}" for Android because the browser is not
          Firefox for Android.`);
      newFilters.compatibleWithVersion = APPVERSION_FOR_ANDROID;
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
