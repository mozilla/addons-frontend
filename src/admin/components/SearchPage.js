import React, { PropTypes } from 'react';

import Paginate from 'core/components/Paginate';
import { convertFiltersToQueryParams } from 'core/searchUtils';
import { gettext as _ } from 'core/utils';
import SearchResults from 'core/components/Search/SearchResults';

import SearchForm from './SearchForm';
import AdminSearchResult from './SearchResult';


export default class AdminSearchPage extends React.Component {
  static propTypes = {
    count: PropTypes.number,
    hasSearchParams: PropTypes.bool.isRequired,
    filters: PropTypes.object,
    loading: PropTypes.bool.isRequired,
    page: PropTypes.number,
    results: PropTypes.arrayOf(PropTypes.object),
  }

  static defaultProps = {
    filters: {},
    hasSearchParams: false,
  }

  render() {
    const {
      count, filters, hasSearchParams, loading, page, results,
    } = this.props;
    const pathname = '/search/';
    const paginator = hasSearchParams && count > 0 ?
      (<Paginate count={count} currentPage={page}
        pathname={pathname}
        queryParams={convertFiltersToQueryParams(filters)} />) : [];
    return (
      <div className="search-page">
        <h1>{_('Add-on Search')}</h1>
        <SearchForm pathname={pathname} query={filters.query} />
        {paginator}
        <SearchResults ResultComponent={AdminSearchResult} count={count}
          filters={filters} hasSearchParams={hasSearchParams} loading={loading}
          results={results} />
      </div>
    );
  }
}
