/* eslint-disable react/no-unused-prop-types */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { getFeatured } from 'amo/actions/featured';
import SearchResults from 'amo/components/SearchResults';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import translate from 'core/i18n/translate';
import { apiAddonType } from 'core/utils';

import './styles.scss';


export class FeaturedAddonsBase extends React.Component {
  static propTypes = {
    addonType: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
    hasSearchParams: PropTypes.bool,
    i18n: PropTypes.object.isRequired,
    loading: PropTypes.bool.isRequired,
    params: PropTypes.object.isRequired,
    results: PropTypes.array,
  }

  static defaultProps = {
    hasSearchParams: true,
  }

  constructor(props) {
    super(props);
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
    const { dispatch, loading, results } = { ...this.props, ...nextProps };

    const nextParams = nextProps && nextProps.params ?
      nextProps.params : {};
    const nextAddonType = nextParams.visibleAddonType ?
      apiAddonType(nextParams.visibleAddonType) : this.requestedAddonType();

    if ((!results || nextAddonType !== lastAddonType) && !loading) {
      dispatch(getFeatured({ addonType: nextAddonType }));
    }
  }

  render() {
    const { hasSearchParams, loading, results } = this.props;

    return (
      <div className="FeaturedAddons">
        <h2 className="FeaturedAddons-header">
          {this.headerForAddonType()}
        </h2>
        <SearchResults
          count={results && results.length}
          hasSearchParams={hasSearchParams}
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
  connect(mapStateToProps),
  translate(),
)(FeaturedAddonsBase);
