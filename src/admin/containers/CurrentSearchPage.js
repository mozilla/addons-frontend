import { connect } from 'react-redux';
import { asyncConnect } from 'redux-async-connect';

import { search } from 'core/api';
import SearchPage from 'admin/components/SearchPage';
import { adminSearchStart, adminSearchLoad,
         adminSearchFail } from 'admin/actions';

export function mapStateToProps(state) {
  return state.search;
}

function performSearch({ dispatch, page, query, api }) {
  if (!query) {
    return Promise.resolve();
  }
  dispatch(adminSearchStart(query, page));
  return search({ page, query, api })
    .then((response) => dispatch(adminSearchLoad({ page, query, ...response })))
    .catch(() => dispatch(adminSearchFail({ page, query })));
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
  if (!isLoaded({ state: state.admin, query, page })) {
    return performSearch({ dispatch, page, query, api: state.api });
  }
  return true;
}

const CurrentSearchPage = asyncConnect([{
  deferred: true,
  promise: loadSearchResultsIfNeeded,
}])(connect(mapStateToProps)(SearchPage));

export default CurrentSearchPage;
