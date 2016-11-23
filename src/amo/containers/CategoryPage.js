import { connect } from 'react-redux';
import { asyncConnect } from 'redux-connect';
import { compose } from 'redux';

import SearchPage from 'amo/components/SearchPage';
import {
  filtersMatch,
  loadByCategoryIfNeeded,
  parsePage,
} from 'core/searchUtils';


export function mapStateToProps(state, ownProps) {
  const filters = {
    addonType: ownProps.params.addonType,
    category: ownProps.params.slug,
    clientApp: ownProps.params.application,
  };
  const pathname = `/${filters.addonType}s/${filters.category}/`;
  const queryParams = { page: parsePage(ownProps.location.query.page) };

  if (filtersMatch(state.search.filters, filters)) {
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
)(SearchPage);
