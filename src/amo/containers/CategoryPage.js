import { connect } from 'react-redux';
import { asyncConnect } from 'redux-connect';
import { compose } from 'redux';

import SearchPage from 'amo/components/SearchPage';
import { loadSearchResultsIfNeeded, mapStateToProps } from 'core/searchUtils';
import { loadCategoriesIfNeeded } from 'core/utils';


export default compose(
  asyncConnect([
    {
      deferred: true,
      promise: loadSearchResultsIfNeeded,
    },
    {
      deferred: true,
      promise: loadCategoriesIfNeeded,
    },
  ]),
  connect(mapStateToProps)
)(SearchPage);
