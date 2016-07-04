import React, { PropTypes } from 'react';

import Paginate from 'core/components/Paginate';
import SearchForm from './SearchForm';
import SearchResults from './SearchResults';
import { gettext as _ } from 'core/utils';

export default class SearchPage extends React.Component {
  static propTypes = {
    count: PropTypes.number,
    loading: PropTypes.bool.isRequired,
    page: PropTypes.number,
    results: PropTypes.arrayOf(PropTypes.shape({
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })),
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
        <SearchResults results={results} query={query} loading={loading} count={count} />
      </div>
    );
  }
}
