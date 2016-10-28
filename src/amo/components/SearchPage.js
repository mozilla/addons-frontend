import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import Paginate from 'core/components/Paginate';
import SearchResults from 'core/components/Search/SearchResults';

import SearchResult from './SearchResult';


export class SearchPageBase extends React.Component {
  static propTypes = {
    count: PropTypes.number,
    loading: PropTypes.bool.isRequired,
    page: PropTypes.number,
    results: PropTypes.array,
    query: PropTypes.string,
  }

  render() {
    const { count, loading, page, query, results } = this.props;
    const paginator = query && count > 0 ?
      <Paginate LinkComponent={Link} count={count} currentPage={page}
        pathname="/search/" query={{ q: query }} showPages={0} /> : [];

    return (
      <div className="search-page">
        <SearchResults results={results} query={query} loading={loading}
          count={count} ResultComponent={SearchResult} />
        {paginator}
      </div>
    );
  }
}

export function mapStateToProps(state) {
  return { clientApp: state.api.clientApp, lang: state.api.lang };
}

export default compose(
  connect(mapStateToProps),
)(SearchPageBase);
