import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { loadSearch } from 'search/actions';

import SearchForm from '../components/SearchForm';
import SearchResults from '../components/SearchResults';
import { gettext as _ } from 'core/utils';

import 'search/css/SearchPage.scss';

function loadData(props) {
}

class SearchPage extends React.Component {
  static propTypes = {
    handleSearch: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
    results: PropTypes.arrayOf(PropTypes.shape({
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })),
    query: PropTypes.string,
  }

  render() {
    const { handleSearch, loading, results, query } = this.props;

    return (
      <div className="search-page">
        <h1>{_('Add-on Search')}</h1>
        <SearchForm onSearch={handleSearch} query={query} />
        <SearchResults results={results} query={query} loading={loading} />
      </div>
    );
  }
}
export function mapStateToProps(state, context) {
  const query = context.location.query.q;
  return Object.assign({}, state.search, { query });
}

export function mapDispatchToProps(dispatch, context) {
  return {
    handleSearch: (query) => {
      context.history.push({
        pathname: '/search',
        query: {q: query},
      });
      dispatch(loadSearch({ query }));
    },
  };
}

const CurrentSearchPage = connect(
  mapStateToProps,
  mapDispatchToProps,
)(SearchPage);

export default CurrentSearchPage;
