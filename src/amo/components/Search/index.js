import deepEqual from 'deep-eql';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { setViewContext } from 'amo/actions/viewContext';
import Link from 'amo/components/Link';
import SearchContextCard from 'amo/components/SearchContextCard';
import SearchResults from 'amo/components/SearchResults';
import SearchSort from 'amo/components/SearchSort';
import { searchStart } from 'core/actions/search';
import Paginate from 'core/components/Paginate';
import Card from 'ui/components/Card';
import translate from 'core/i18n/translate';
import { VIEW_CONTEXT_EXPLORE } from 'core/constants';
import { withErrorHandler } from 'core/errorHandler';
import {
  convertFiltersToQueryParams,
  hasSearchFilters,
} from 'core/searchUtils';
import { parsePage } from 'core/utils';

import './styles.scss';


export class SearchBase extends React.Component {
  static propTypes = {
    LinkComponent: PropTypes.node.isRequired,
    count: PropTypes.number,
    dispatch: PropTypes.func.isRequired,
    enableSearchSort: PropTypes.bool,
    errorHandler: PropTypes.object.isRequired,
    filters: PropTypes.object,
    filtersUsedForResults: PropTypes.object,
    loading: PropTypes.bool.isRequired,
    paginationQueryParams: PropTypes.object,
    pathname: PropTypes.string,
    results: PropTypes.array,
    i18n: PropTypes.object.isRequired,
  }

  static defaultProps = {
    LinkComponent: Link,
    count: 0,
    enableSearchSort: true,
    filters: {},
    filtersUsedForResults: {},
    paginationQueryParams: null,
    pathname: '/search/',
    results: [],
  }

  componentWillMount() {
    this.dispatchSearch({
      newFilters: this.props.filters,
      oldFilters: this.props.filtersUsedForResults,
    });
  }

  componentWillReceiveProps({ filters }) {
    this.dispatchSearch({
      newFilters: filters,
      oldFilters: this.props.filters,
    });
  }

  dispatchSearch({ newFilters = {}, oldFilters = {} } = {}) {
    const { dispatch, errorHandler } = this.props;

    if (hasSearchFilters(newFilters) && !deepEqual(oldFilters, newFilters)) {
      dispatch(searchStart({
        errorHandlerId: errorHandler.id,
        filters: newFilters,
      }));

      const { addonType } = newFilters;
      if (addonType) {
        dispatch(setViewContext(addonType));
      } else {
        dispatch(setViewContext(VIEW_CONTEXT_EXPLORE));
      }
    }
  }

  render() {
    const {
      LinkComponent,
      count,
      enableSearchSort,
      errorHandler,
      filters,
      loading,
      paginationQueryParams,
      pathname,
      i18n,
      results,
    } = this.props;

    const page = parsePage(filters.page);

    // We allow specific paginationQueryParams instead of always using
    // convertFiltersToQueryParams(filters) so certain search filters
    // aren't repeated if they are elsewhere in the URL. This is useful
    // for pages like the category page which contain `addonType` and
    // `category` in their URLs
    // (eg: `/extensions/categories/feed-news-blogging/`) so they don't
    // need them in the queryParams.
    //
    // If paginator params aren't specified, we fallback to filters.
    const queryParams = paginationQueryParams ||
      convertFiltersToQueryParams(filters);

    const paginator = count > 0 ? (
      <Paginate
        LinkComponent={LinkComponent}
        count={count}
        currentPage={page}
        pathname={pathname}
        queryParams={queryParams}
      />
    ) : null;
    const searchSort = enableSearchSort && count > 0 ? (
      <SearchSort filters={filters} pathname={pathname} />
    ) : null;

    if (!queryParams.q) {
      return (
        <div className="Search">
          <Card className="SearchContextCard">
            <h1 className="SearchContextCard-header">{i18n.gettext('Enter a search term and try again.')}</h1>
          </Card>
        </div>
      );
    }

    return (
      <div className="Search">
        {errorHandler.renderErrorIfPresent()}
        <SearchContextCard />

        {searchSort}

        <SearchResults
          count={count}
          filters={filters}
          loading={loading}
          pathname={pathname}
          results={results}
        />

        {paginator}
      </div>
    );
  }
}

export function mapStateToProps(state) {
  return {
    count: state.search.count,
    filtersUsedForResults: state.search.filters,
    loading: state.search.loading,
    results: state.search.results,
  };
}

export default compose(
  translate({ withRef: true }),
  withErrorHandler({ name: 'Search' }),
  connect(mapStateToProps),
)(SearchBase);
