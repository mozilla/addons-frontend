import React, { PropTypes } from 'react';

import Link from 'amo/components/Link';
import Paginate from 'core/components/Paginate';
import SearchResults from 'amo/components/SearchResults';
import SearchSort from 'amo/components/SearchSort';
import { convertFiltersToQueryParams } from 'core/searchUtils';

import SearchResult from './SearchResult';

import './SearchPage.scss';


export default class SearchPage extends React.Component {
  static propTypes = {
    count: PropTypes.number,
    filters: PropTypes.object,
    hasSearchParams: PropTypes.bool.isRequired,
    loading: PropTypes.bool.isRequired,
    page: PropTypes.number,
    pathname: PropTypes.string,
    queryParams: PropTypes.object,
    results: PropTypes.array,
  }

  static defaultProps = {
    filters: {},
    pathname: '/search/',
    results: [],
  }

  render() {
    const {
      count, filters, hasSearchParams, loading, page, pathname, results,
    } = this.props;
    const queryParams = this.props.queryParams ||
      convertFiltersToQueryParams(filters);
    const paginator = count > 0 && hasSearchParams ? (
      <Paginate LinkComponent={LinkComponent} count={count} currentPage={page}
        pathname={pathname} queryParams={queryParams} showPages={0} />
    ) : [];
    const searchSort = hasSearchParams && results.length ? (
      <SearchSort filters={filters} pathname={pathname} />
    ) : null;

    return (
      <div className="SearchPage">
        {searchSort}
        <SearchResults count={count} hasSearchParams={hasSearchParams}
          filters={filters} loading={loading} pathname={pathname}
          results={results} />
        {paginator}
      </div>
    );
  }
}
