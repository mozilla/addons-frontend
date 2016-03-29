import { connect } from 'react-redux';
import SearchPage from '../components/SearchPage';
import { searchStart, searchLoad } from '../actions';
import { search } from 'core/api';

export function mapStateToProps(state) {
  return state.search;
}

export function mapDispatchToProps(dispatch) {
  return {
    handleSearch: (query, page = 1) => {
      dispatch(searchStart(query, page));
      return search({ page, query })
        .then((response) => dispatch(searchLoad({ page, query, ...response })));
    },
  };
}

const CurrentSearchPage = connect(
  mapStateToProps,
  mapDispatchToProps,
)(SearchPage);

export default CurrentSearchPage;
