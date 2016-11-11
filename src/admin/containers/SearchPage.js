import { connect } from 'react-redux';
import { asyncConnect } from 'redux-connect';
import { compose } from 'redux';

import AdminSearchPage from 'admin/components/SearchPage';
import { loadSearchResultsIfNeeded, mapStateToProps } from 'core/searchUtils';


export default compose(
  asyncConnect([{
    deferred: true,
    promise: loadSearchResultsIfNeeded,
  }]),
  connect(mapStateToProps)
)(AdminSearchPage);
