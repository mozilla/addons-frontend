import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import SearchForm from 'search/components/SearchForm';
import SearchResults from 'search/components/SearchResults';
import { loadSearch } from 'search/actions';
import { gettext as _ } from 'core/utils';

import 'search/css/SearchPage.scss';

function loadData(props) {
  props.loadSearch(props.query);
}

class SearchPage extends React.Component {
  static propTypes = {
    loadSearch: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
    results: PropTypes.arrayOf(PropTypes.shape({
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })),
    query: PropTypes.string,
  }

  // componentWillMount() {
  //   loadData(this.props);
  // }

  render() {
    const { loading, results, query } = this.props;

    return (
      <div className="search-page">
        <h1>{_('Add-on Search')}</h1>
        <SearchForm onSearch={this.props.loadSearch} query={query} />
        <SearchResults results={results} query={query} loading={loading} />
      </div>
    );
  }
}
export function mapStateToProps(state, context) {
  const query = context.location.query.q;
  return Object.assign({}, state.search, { query });
}

function handleSearch(query) {
  return (dispatch) => {
    context.history.push({
      pathname: '/search',
      query: {q: query},
    });
    dispatch(loadSearch({ query }));
  };
}

const CurrentSearchPage = connect(mapStateToProps, {
  loadSearch,
})(SearchPage);

export default CurrentSearchPage;
