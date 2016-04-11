import { connect } from 'react-redux';
import { asyncConnect } from 'redux-async-connect';
import SearchPage from '../components/SearchPage';
import { searchStart, searchLoad, searchFail } from '../actions';
import { search } from 'core/api';

export function mapStateToProps(state) {
  return state.search;
}

function performSearch({dispatch, page, query}) {
  dispatch(searchStart(query, page));
  return search({ page, query })
    .then((response) => dispatch(searchLoad({ page, query, ...response })))
    .catch(() => dispatch(searchFail({ page, query })));
}

export function isLoaded({page, query, state}) {
  return state.query === query && state.page === page && !state.loading;
}

export function parsePage(page) {
  const parsed = parseInt(page, 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

export function loadSearchResultsIfNeeded({store: {dispatch, getState}, location}) {
  const query = location.query.q;
  const page = parsePage(location.query.page);
  if (!isLoaded({state: getState().search, query, page})) {
    return performSearch({dispatch, page, query});
  }
  return true;
}

const CurrentSearchPage = asyncConnect([{
  deferred: true,
  promise: loadSearchResultsIfNeeded,
}])(connect(mapStateToProps)(SearchPage));

export default CurrentSearchPage;
