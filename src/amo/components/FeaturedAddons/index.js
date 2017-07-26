/* eslint-disable react/no-unused-prop-types */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { getFeatured } from 'amo/actions/featured';
import { setViewContext } from 'amo/actions/viewContext';
import SearchResults from 'amo/components/SearchResults';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import { apiAddonType } from 'core/utils';

import './styles.scss';


export class FeaturedAddonsBase extends React.Component {
  static propTypes = {
    addonType: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
    errorHandler: PropTypes.object.isRequired,
    i18n: PropTypes.object.isRequired,
    loading: PropTypes.bool.isRequired,
    params: PropTypes.object.isRequired,
    results: PropTypes.array,
  }

  componentWillMount() {
    this.props.dispatch(setViewContext(this.requestedAddonType()));
    this.loadDataIfNeeded();
  }

  componentWillReceiveProps(nextProps) {
    this.loadDataIfNeeded(nextProps);
  }

  requestedAddonType() {
    // Returns the addonType from the URL that made the request to
    // render this component.
    return apiAddonType(this.props.params.visibleAddonType);
  }

  headerForAddonType() {
    const { addonType: configuredAddonType, i18n } = this.props;
    const addonType = configuredAddonType || this.requestedAddonType();

    switch (addonType) {
      case ADDON_TYPE_EXTENSION:
        return i18n.gettext('More Featured Extensions');
      case ADDON_TYPE_THEME:
        return i18n.gettext('More Featured Themes');
      default:
        throw new Error(`Invalid addonType: "${addonType}"`);
    }
  }

  loadDataIfNeeded(nextProps = {}) {
    const { addonType: lastAddonType } = this.props;
    const {
      errorHandler, dispatch, loading, results,
    } = { ...this.props, ...nextProps };

    const nextParams = nextProps && nextProps.params ?
      nextProps.params : {};
    // Find out the next requested add-on type, i.e. one passed via
    // URL params.
    const nextAddonType = nextParams.visibleAddonType ?
      apiAddonType(nextParams.visibleAddonType) : this.requestedAddonType();

    if ((!results || nextAddonType !== lastAddonType) && !loading) {
      // Fetch featured add-ons from the API if we don't yet have results
      // or if the add-on type of the component has changed.
      dispatch(getFeatured({
        addonType: nextAddonType,
        errorHandlerId: errorHandler.id,
      }));
    }
  }

  render() {
    const { errorHandler, loading, results } = this.props;

    return (
      <div className="FeaturedAddons">
        {errorHandler.hasError() ? errorHandler.renderError() : null}
        <h2 className="FeaturedAddons-header">
          {this.headerForAddonType()}
        </h2>
        <SearchResults
          count={results && results.length}
          loading={loading}
          results={loading ? null : results}
        />
      </div>
    );
  }
}

export function mapStateToProps(state) {
  return {
    addonType: state.featured.addonType,
    loading: state.featured.loading,
    results: state.featured.results,
  };
}

export default compose(
  withErrorHandler({ name: 'FeaturedAddons' }),
  connect(mapStateToProps),
  translate(),
)(FeaturedAddonsBase);
