/* @flow */
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Search from 'amo/components/Search';
import {
  convertFiltersToQueryParams,
  convertQueryParamsToFilters,
} from 'core/searchUtils';


type PropTypes = {|
  filters: Object,
  pathname: string,
|};

export const SearchPageBase = ({ filters, pathname, ...props }: PropTypes) => {
  const paginationQueryParams = convertFiltersToQueryParams({
    addonType: filters.addonType,
    featured: filters.featured,
    operatingSystem: filters.operatingSystem,
    page: filters.page,
    query: filters.query,
    sort: filters.sort,
  });

  return (
    <Search
      {...props}
      enableSearchFilters
      filters={filters}
      paginationQueryParams={paginationQueryParams}
      pathname={pathname}
    />
  );
};

export function mapStateToProps(state: any, ownProps: any) {
  const { location } = ownProps;

  const filtersFromLocation = convertQueryParamsToFilters(location.query);

  // We don't allow `clientApp` or `lang` as a filter from location because
  // they can lead to weird, unintuitive URLs where the queryParams override
  // the `clientApp` and `lang` set elsewhere in the URL.
  // Removing them from the filters (essentially ignoring them) means URLs
  // like: `/en-US/firefox/search/?q=test&app=android&lang=fr` don't search
  // for French Android add-ons.
  // Maybe in the future this could redirect instead of ignoring bogus
  // `location.query` data.
  const filters = { ...filtersFromLocation };
  delete filters.clientApp;
  delete filters.lang;

  return { filters };
}

export default compose(
  connect(mapStateToProps),
)(SearchPageBase);
