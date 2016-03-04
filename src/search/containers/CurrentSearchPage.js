import { connect } from 'react-redux';
import SearchPage from '../components/SearchPage';
import { setQuery } from '../actions';
import { getMatchingAddons } from 'search/reducers/search';

export function mapStateToProps(state) {
  return {
    results: getMatchingAddons(state.addons, state.search.query),
    query: state.search.query,
  };
}

export function mapDispatchToProps(dispatch) {
  return {
    handleSearch: (query) => dispatch(setQuery(query)),
  };
}

const CurrentSearchPage = connect(
  mapStateToProps,
  mapDispatchToProps,
)(SearchPage);

export default CurrentSearchPage;
