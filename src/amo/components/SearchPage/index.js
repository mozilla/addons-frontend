import { connect } from 'react-redux';
import { compose } from 'redux';

import Search from 'amo/components/Search';
import { convertQueryParamsToFilters } from 'core/searchUtils';


export function mapStateToProps(state, ownProps) {
  const { location } = ownProps;

  const filters = convertQueryParamsToFilters(location.query);

  return { filters: { ...filters, clientApp: state.api.clientApp } };
}

export default compose(
  connect(mapStateToProps),
)(Search);
