import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import SearchForm from 'search/components/SearchForm';
import SearchResults from 'search/components/SearchResults';
import { loadSearch } from 'search/actions';
import { gettext as _ } from 'core/utils';

import 'search/css/SearchPage.scss';

function loadData(props) {
  const { query } = props;
  props.loadSearch({ query });
}

class SearchPage extends React.Component {
  static propTypes = {
    loadSearch: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
    results: PropTypes.arrayOf(PropTypes.shape({
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })),
    query: PropTypes.string,
  }

  componentWillMount() {
    loadData(this.props);
  }

  loadSearch = ({ query }) => {
    this.props.history.push({
      pathname: '/search',
      query: {q: query},
    });
    this.props.loadSearch({ query });
  }

  render() {
    const { results, query } = this.props;

    return (
      <div className="search-page">
        <h1>{_('Add-on Search')}</h1>
        <SearchForm onSearch={this.loadSearch} query={query} />
        <SearchResults results={results} query={query} />
      </div>
    );
  }
}
export function mapStateToProps(state, context) {
  const query = context.location.query.q;
  return { query, results: state.search.results };
}

const CurrentSearchPage = connect(mapStateToProps, {
  loadSearch,
})(SearchPage);

export default CurrentSearchPage;
