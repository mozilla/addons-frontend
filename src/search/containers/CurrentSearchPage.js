import { connect } from 'react-redux';
import { asyncConnect } from 'redux-async-connect';
import SearchPage from 'search/components/SearchPage';
import { searchStart, searchLoad, searchFail } from 'search/actions';
import { search } from 'core/api';

export function mapStateToProps(state) {
  return state.search;
}

function performSearch({ dispatch, page, query, api }) {
  if (!query) {
    return Promise.resolve();
  }
  dispatch(searchStart(query, page));
  return search({ page, query, api })
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
    return performSearch({ dispatch, page, query, api: state.api });
  }
  return true;
}

const CurrentSearchPage = asyncConnect([{
  deferred: true,
  promise: loadSearchResultsIfNeeded,
}])(connect(mapStateToProps)(SearchPage));

export default CurrentSearchPage;
