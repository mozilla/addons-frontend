import { compose } from 'redux';
import { asyncConnect } from 'redux-connect';
import { connect } from 'react-redux';

import Categories from 'amo/components/Categories';
import { loadCategoriesIfNeeded, apiAddonType } from 'core/utils';


export function mapStateToProps(state, ownProps) {
  const addonType = apiAddonType(ownProps.params.visibleAddonType);
  const clientApp = state.api.clientApp;
  const categories = state.categories.categories[clientApp][addonType] ?
    state.categories.categories[clientApp][addonType] : {};

  return {
    addonType,
    categories,
    error: state.categories.error,
    loading: state.categories.loading,
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
