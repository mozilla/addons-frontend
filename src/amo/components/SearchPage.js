import React from 'react';
import PropTypes from 'prop-types';

import { setViewContext } from 'amo/actions/viewContext';
import Link from 'amo/components/Link';
import Paginate from 'core/components/Paginate';
import { VIEW_CONTEXT_EXPLORE } from 'core/constants';
import SearchResults from 'amo/components/SearchResults';
import SearchSort from 'amo/components/SearchSort';
import { convertFiltersToQueryParams } from 'core/searchUtils';


export default class SearchPage extends React.Component {
  static propTypes = {
    LinkComponent: PropTypes.node.isRequired,
    count: PropTypes.number,
    dispatch: PropTypes.func.isRequired,
    enableSearchSort: PropTypes.bool,
    filters: PropTypes.object,
    hasSearchParams: PropTypes.bool.isRequired,
    loading: PropTypes.bool.isRequired,
    page: PropTypes.number,
    pathname: PropTypes.string,
    queryParams: PropTypes.object,
    results: PropTypes.array,
  }

  static defaultProps = {
    LinkComponent: Link,
    count: 0,
    enableSearchSort: true,
    filters: {},
    pathname: '/search/',
    results: [],
  }

  componentWillMount() {
    const { dispatch, filters } = this.props;

    const { addonType } = filters;
    if (addonType) {
      dispatch(setViewContext(addonType));
    } else {
      dispatch(setViewContext(VIEW_CONTEXT_EXPLORE));
    }
  }

  render() {
    const {
      LinkComponent, count, enableSearchSort, filters, hasSearchParams,
      loading, page, pathname, results,
    } = this.props;
    const queryParams = this.props.queryParams ||
      convertFiltersToQueryParams(filters);
    const paginator = count > 0 && hasSearchParams ? (
      <Paginate LinkComponent={LinkComponent} count={count} currentPage={page}
        pathname={pathname} queryParams={queryParams} />
    ) : [];
    const searchSort = enableSearchSort && hasSearchParams && results.length ? (
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
