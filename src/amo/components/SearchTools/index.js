/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Search from 'amo/components/Search';
import { ADDON_TYPE_OPENSEARCH, SEARCH_SORT_RELEVANCE } from 'core/constants';
import { convertFiltersToQueryParams } from 'core/searchUtils';
import type { SearchFilters } from 'amo/components/AutoSearchInput';

type Props = {|
  filters: SearchFilters,
|};

export class SearchToolsBase extends React.Component<Props> {
  render() {
    const { filters } = this.props;

    return (
      <Search
        enableSearchFilters
        filters={filters}
        paginationQueryParams={convertFiltersToQueryParams(filters)}
      />
    );
  }
}

export function mapStateToProps() {
  const filters = {
    addonType: ADDON_TYPE_OPENSEARCH,
    sort: SEARCH_SORT_RELEVANCE,
  };

  return { filters };
}

const SearchTools: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
)(SearchToolsBase);

export default SearchTools;
