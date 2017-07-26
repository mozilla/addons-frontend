import { connect } from 'react-redux';
import { compose } from 'redux';

import { CategoriesBase } from 'amo/components/Categories';
import { apiAddonType } from 'core/utils';
import translate from 'core/i18n/translate';

import './styles.scss';


export function mapStateToProps(state, ownProps) {
  const addonType = apiAddonType(ownProps.params.visibleAddonType);
  const clientApp = state.api.clientApp;
  const categories = state.categories.categories[clientApp];

  return {
    addonType,
    categories,
    className: 'CategoriesPage',
    clientApp,
    error: state.categories.error,
    loading: state.categories.loading,
  };
}

export default compose(
  connect(mapStateToProps),
  translate({ withRef: true }),
)(CategoriesBase);
