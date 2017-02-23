import deepEqual from 'deep-eql';
import React from 'react';
import { connect } from 'react-redux';
import { asyncConnect } from 'redux-connect';
import { compose } from 'redux';

import SearchPage from 'amo/components/SearchPage';
import { loadByCategoryIfNeeded, parsePage } from 'core/searchUtils';
import { apiAddonType } from 'core/utils';


export function CategoryPageBase(props) {
  return <SearchPage enableSearchSort={false} {...props} />;
}

export function mapStateToProps(state, ownProps) {
  const filters = {
    addonType: apiAddonType(ownProps.params.visibleAddonType),
    category: ownProps.params.slug,
    clientApp: ownProps.params.application,
  };
  const pathname = `/${ownProps.params.visibleAddonType}/${filters.category}/`;
  const queryParams = { page: parsePage(ownProps.location.query.page) };

  const filtersMatchState = deepEqual(
    { ...state.search.filters, page: parsePage(state.search.page) },
    { ...filters, page: queryParams.page },
  );
  if (filtersMatchState) {
    return {
      hasSearchParams: true,
      filters,
      pathname,
      queryParams,
      ...state.search,
    };
  }

  return { hasSearchParams: true, pathname, queryParams };
}

export default compose(
  asyncConnect([{
    deferred: true,
    promise: loadByCategoryIfNeeded,
  }]),
  connect(mapStateToProps),
)(CategoryPageBase);
