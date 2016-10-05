import { compose } from 'redux';
import { asyncConnect } from 'redux-connect';
import { connect } from 'react-redux';

import Categories from 'amo/components/Categories';
import { loadCategoriesIfNeeded } from 'core/utils';


export function mapStateToProps(state, ownProps) {
  return {
    addonType: ownProps.params.addonType.replace(/s$/, ''),
    clientApp: state.api.clientApp,
    ...state.categories,
  };
}

export default compose(
  asyncConnect([{
    deferred: true,
    key: 'CategoriesPage',
    promise: loadCategoriesIfNeeded,
  }]),
  connect(mapStateToProps),
)(Categories);
