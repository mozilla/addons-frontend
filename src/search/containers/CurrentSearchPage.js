import { connect } from 'react-redux';
import SearchPage from '../components/SearchPage';
import { searchStart, searchLoad } from '../actions';
import { search } from 'core/api';

export function mapStateToProps(state) {
  return state.search;
}

export function mapDispatchToProps(dispatch) {
  return {
    handleSearch: (query) => {
      dispatch(searchStart(query));
      return search({ query })
        .then((response) => dispatch(searchLoad({ query, ...response })));
    },
  };
}

const CurrentSearchPage = connect(
  mapStateToProps,
  mapDispatchToProps,
)(SearchPage);

export default CurrentSearchPage;
