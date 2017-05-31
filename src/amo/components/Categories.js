import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { currentViewSet } from 'amo/actions/currentView';
import Link from 'amo/components/Link';
import { categoriesFetch } from 'core/actions/categories';
import { apiAddonType, visibleAddonType } from 'core/utils';
import translate from 'core/i18n/translate';
import LoadingText from 'ui/components/LoadingText';

import './Categories.scss';


export class CategoriesBase extends React.Component {
  static propTypes = {
    addonType: PropTypes.string.isRequired,
    dispatch: PropTypes.func,
    categories: PropTypes.object.isRequired,
    clientApp: PropTypes.string.isRequired,
    error: PropTypes.bool,
    loading: PropTypes.bool.isRequired,
    i18n: PropTypes.object.isRequired,
  }

  componentWillMount() {
    const { addonType, categories, clientApp, dispatch } = this.props;
    if (!Object.values(categories).length) {
      dispatch(categoriesFetch({ addonType, clientApp }));
    }
    dispatch(currentViewSet({ addonType }));
  }

  componentDidUpdate() {
    const { addonType, dispatch } = this.props;

    dispatch(currentViewSet({ addonType }));
  }

  render() {
    const { addonType, error, loading, i18n } = this.props;
    let { categories } = this.props;

    // If we aren't loading then get just the values of the categories object.
    if (!loading) {
      categories = categories ? Object.values(categories) : [];
    } else {
      // If we are loading we just set the length of the categories array to
      // ten (10) because we want ten placeholders.
      categories = Array(10).fill(0);
    }

    if (error) {
      return (
        <div className="Categories">
          <p>{i18n.gettext('Failed to load categories.')}</p>
        </div>
      );
    }

    if (!categories.length) {
      return (
        <div className="Categories">
          <p>{i18n.gettext('No categories found.')}</p>
        </div>
      );
    }

    return (
      <div className="Categories">
        {loading ? (
          <div className="Categories-loadingText visually-hidden">
            {i18n.gettext('Loading categories.')}
          </div>
        ) : null}
        <ul
          className="Categories-list"
          ref={(ref) => { this.categories = ref; }}
        >
          {categories.map((category, index) => (
            <li className="Categories-list-item" key={`category-${index}`}>
              {loading ? (
                <span className="Categories-link">
                  <LoadingText range={25} />
                </span>
              ) : (
                <Link className="Categories-link"
                  to={`/${visibleAddonType(addonType)}/${category.slug}/`}>
                  {category.name}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

export function mapStateToProps(state, ownProps) {
  const addonType = apiAddonType(ownProps.params.visibleAddonType);
  const clientApp = state.api.clientApp;
  const categories = state.categories.categories[clientApp][addonType] ?
    state.categories.categories[clientApp][addonType] : {};

  return {
    addonType,
    categories,
    clientApp,
    error: state.categories.error,
    loading: state.categories.loading,
  };
}

export default compose(
  connect(mapStateToProps),
  translate({ withRef: true }),
)(CategoriesBase);
