import { connect } from 'react-redux';
import { compose } from 'redux';

import AdminSearchPage from 'admin/components/SearchPage';
import { loadSearchResultsIfNeeded, mapStateToProps } from 'core/searchUtils';
import { safeAsyncConnect } from 'core/utils';


export default compose(
  safeAsyncConnect([{ promise: loadSearchResultsIfNeeded }]),
  connect(mapStateToProps)
)(AdminSearchPage);
