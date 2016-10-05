import React, { PropTypes } from 'react';

import Paginate from 'core/components/Paginate';
import { gettext as _ } from 'core/utils';
import SearchResults from 'core/components/Search/SearchResults';

import SearchForm from './SearchForm';
import AdminSearchResult from './SearchResult';


export default class AdminSearchPage extends React.Component {
  static propTypes = {
    count: PropTypes.number,
    loading: PropTypes.bool.isRequired,
    page: PropTypes.number,
    results: PropTypes.arrayOf(PropTypes.object),
    query: PropTypes.string,
  }

  render() {
    const { count, loading, page, query, results } = this.props;
    const pathname = '/search/';
    const paginator = query && count > 0 ?
      <Paginate count={count} pathname={pathname} query={{ q: query }} currentPage={page} /> : [];
    return (
      <div className="search-page">
        <h1>{_('Add-on Search')}</h1>
        <SearchForm pathname={pathname} query={query} />
        {paginator}
        <SearchResults results={results} query={query} loading={loading}
          count={count} ResultComponent={AdminSearchResult} />
      </div>
    );
  }
}
