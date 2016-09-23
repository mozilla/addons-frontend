import { connect } from 'react-redux';
import { asyncConnect } from 'redux-connect';

import { search } from 'core/api';
import { searchStart, searchLoad, searchFail } from 'core/actions/search';

export function mapStateToProps(state, ownProps) {
  const { location } = ownProps;
  const lang = state.api.lang;
  if (location.query.q === state.search.query) {
    return { lang, ...state.search };
  }
  return { lang };
}

function performSearch({ dispatch, page, query, api, auth = false }) {
  if (!query) {
    return Promise.resolve();
  }
  dispatch(searchStart(query, page));
  return search({ page, query, api, auth })
    .then((response) => dispatch(searchLoad({ page, query, ...response })))
    .catch(() => dispatch(searchFail({ page, query })));
}

export function isLoaded({ page, query, state }) {
  return state.query === query && state.page === page && !state.loading;
}

export function parsePage(page) {
  const parsed = parseInt(page, 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

export function loadSearchResultsIfNeeded({ store: { dispatch, getState }, location }) {
  const query = location.query.q;
  const page = parsePage(location.query.page);
  const state = getState();
  if (!isLoaded({ state: state.search, query, page })) {
    return performSearch({ dispatch, page, query, api: state.api, auth: state.auth });
  }
  return true;
}

export default function createSearchPage(SearchPageComponent) {
  return asyncConnect([{
    deferred: true,
    promise: loadSearchResultsIfNeeded,
  }])(connect(mapStateToProps)(SearchPageComponent));
}
