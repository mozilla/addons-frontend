import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { asyncConnect } from 'redux-connect';
import { compose } from 'redux';

import SearchResults from 'amo/components/SearchResults';
import { loadFeaturedAddons } from 'amo/utils';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import translate from 'core/i18n/translate';

import './FeaturedAddons.scss';


export class FeaturedAddonsBase extends React.Component {
  static propTypes = {
    addonType: PropTypes.string.isRequired,
    hasSearchParams: PropTypes.bool.isRequired,
    i18n: PropTypes.object.isRequired,
    loading: PropTypes.bool.isRequired,
    results: PropTypes.array,
  }

  static defaultProps = {
    hasSearchParams: true,
  }

  headerForAddonType() {
    const { addonType, i18n } = this.props;

    switch (addonType) {
      case ADDON_TYPE_EXTENSION:
        return i18n.gettext('More Featured Extensions');
      case ADDON_TYPE_THEME:
        return i18n.gettext('More Featured Themes');
      default:
        throw new Error(`Invalid addonType: "${addonType}"`);
    }
  }

  render() {
    const { addonType, hasSearchParams, loading, results } = this.props;

    return (
      <div className="FeaturedAddons">
        <h2 className="FeaturedAddons-header">
          {this.headerForAddonType(addonType)}
        </h2>
        <SearchResults count={results.length} hasSearchParams={hasSearchParams}
          loading={loading} results={results} />
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
  asyncConnect([
    { deferred: true, promise: loadFeaturedAddons },
  ]),
  connect(mapStateToProps),
  translate(),
)(FeaturedAddonsBase);
