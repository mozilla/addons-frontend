import deepEqual from 'deep-eql';

import { search } from 'core/api';
import { searchStart, searchLoad, searchFail } from 'core/actions/search';


export const paramsToFilter = {
  app: 'clientApp',
  category: 'category',
  q: 'query',
  type: 'addonType',
};

// We use our own keys internally for things like the user's clientApp
// and addonType, but the API and our query params use different keys.
// We also use `q` for `query` in searches (for historic reasons).
// These methods convert the query params found in location.query to
// our filter keys and back again.
export function convertFiltersToQueryParams(filters) {
  return Object.keys(paramsToFilter).reduce((object, key) => {
    if (typeof filters[paramsToFilter[key]] !== 'undefined' &&
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

export function parsePage(page) {
  const parsed = parseInt(page, 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

export function mapStateToProps(state, ownProps) {
  const { location } = ownProps;

  const filters = convertQueryParamsToFilters({
    ...location.query,
    clientApp: state.api.clientApp,
  });

  // We don't count ALL filters here (eg clientApp) because it's not enough
  // to search on and it's in every request on AMO. If admin search wanted
  // to be able to search on only clientApp this would need changing or
  // would need to be overridden.
  const hasSearchParams = Object.values(location.query).some((param) => (
    typeof param !== 'undefined' && param.length
  ));

  return { ...state.search, filters, hasSearchParams };
}

export function performSearch(
  { api, auth = false, dispatch, filters, page, results }
) {
  if (!filters || !Object.values(filters).length) {
    return Promise.resolve();
  }

  dispatch(searchStart({ filters, page, results }));
  return search({ page, api, auth, filters })
    .then((response) => dispatch(searchLoad({ page, filters, ...response })))
    .catch(() => dispatch(searchFail({ page, filters })));
}

export function isLoaded({ page, state, filters }) {
  return deepEqual(
    { ...filters, page }, { ...state.filters, page: state.page }
  ) && !state.loading;
}

export function loadSearchResultsIfNeeded(
  { store: { dispatch, getState }, location }
) {
  const page = parsePage(location.query.page);
  const state = getState();
  const filters = convertQueryParamsToFilters({
    ...location.query,
    clientApp: state.api.clientApp,
  });

  if (!isLoaded({ state: state.search, page, filters })) {
    return performSearch({
      api: state.api,
      auth: state.auth,
      dispatch,
      filters,
      page,
      results: state.search.results,
    });
  }
  return true;
}

export function loadByCategoryIfNeeded(
  { store: { dispatch, getState }, location, params }
) {
  const state = getState();
  const filters = {
    addonType: params.addonType,
    category: params.slug,
    clientApp: params.application,
  };
  const page = parsePage(location.query.page);

  if (!isLoaded({ state: state.search, page, filters })) {
    return performSearch({
      api: state.api,
      auth: state.auth,
      dispatch,
      filters,
      page,
    });
  }
  return true;
}
