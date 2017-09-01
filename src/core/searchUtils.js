export const operatingSystems = {
  Linux: 'linux',
  'Mac OS': 'mac',
  Windows: 'windows',
};

export const paramsToFilter = {
  app: 'clientApp',
  appversion: 'compatibleWithVersion',
  category: 'category',
  page: 'page',
  // TODO: Change our filter to `pageSize`, for consistency.
  page_size: 'page_size',
  platform: 'operatingSystem',
  q: 'query',
  sort: 'sort',
  type: 'addonType',
};

// We use our own keys internally for things like the user's clientApp
// and addonType, but the API and our query params use different keys.
// We also use `q` for `query` in searches (for historic reasons).
// These methods convert the query params found in location.query to
// our filter keys and back again.
export function convertFiltersToQueryParams(filters) {
  return Object.keys(paramsToFilter).reduce((object, key) => {
    if (filters && typeof filters[paramsToFilter[key]] !== 'undefined' &&
      filters[paramsToFilter[key]] !== '') {
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

export function convertOperatingSystemToFilterName(name) {
  if (name in operatingSystems) {
    return operatingSystems[name];
  }

  return '';
}

export function hasSearchFilters(filters) {
  const filtersSubset = { ...filters };
  delete filtersSubset.clientApp;
  delete filtersSubset.lang;
  delete filtersSubset.page;
  delete filtersSubset.page_size;
  return filtersSubset && !!Object.keys(filtersSubset).length;
}
