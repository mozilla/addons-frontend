import { compose } from 'redux';
import { connect } from 'react-redux';

import Categories from 'amo/components/Categories';
import {
  loadCategoriesIfNeeded, apiAddonType, safeAsyncConnect,
} from 'core/utils';


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
  safeAsyncConnect([{
    key: 'CategoriesPage',
    promise: loadCategoriesIfNeeded,
  }]),
  connect(mapStateToProps),
)(Categories);
