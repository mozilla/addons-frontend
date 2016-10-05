import { connect } from 'react-redux';
import { asyncConnect } from 'redux-connect';
import { compose } from 'redux';

import { search } from 'core/api';
import { searchStart, searchLoad, searchFail } from 'core/actions/search';


export function mapStateToProps(state, ownProps) {
  const { location } = ownProps;

  const queryStringMap = {
    category: 'category',
    q: 'query',
    type: 'addonType',
  };
  const hasSearchParams = Object.keys(queryStringMap).some((queryKey) => {
    return location.query[queryKey] !== undefined &&
      location.query[queryKey].length;
  });
  const searchParamsMatch = Object.keys(queryStringMap).some((queryKey) => {
    return location.query[queryKey] !== undefined &&
      location.query[queryKey] === state.search[queryStringMap[queryKey]];
  });

  if (searchParamsMatch) {
    return { hasSearchParams, ...state.search };
  }

  return { hasSearchParams };
}

function performSearch({
  addonType, api, auth = false, category, dispatch, page, query,
}) {
  dispatch(searchStart({ addonType, category, page, query }));
  return search({ addonType, api, auth, category, page, query })
    .then((response) => {
      return dispatch(searchLoad({
        addonType,
        category,
        page,
        query,
        ...response,
      }));
    })
    .catch(() => {
      return dispatch(searchFail({ addonType, category, page, query }));
    });
}

export function isLoaded({ addonType, category, page, query, state }) {
  return state.addonType === addonType && state.category === category &&
    state.page === page && state.query === query && !state.loading;
}

export function parsePage(page) {
  const parsed = parseInt(page, 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

export function loadSearchResultsIfNeeded({
  location, store: { dispatch, getState },
}) {
  const addonType = location.query.type;
  const category = location.query.category;
  const query = location.query.q;
  const page = parsePage(location.query.page);
  const state = getState();
  const loaded = isLoaded({
    addonType,
    category,
    page,
    query,
    state: state.search,
  });

  if (!loaded) {
    return performSearch({
      addonType,
      api: state.api,
      auth: state.auth,
      category,
      dispatch,
      page,
      query,
    });
  }

  return true;
}

export default function createSearchPage(SearchPageComponent) {
  return compose(
    asyncConnect([{
      deferred: true,
      promise: loadSearchResultsIfNeeded,
    }]),
    connect(mapStateToProps)
  )(SearchPageComponent);
}
