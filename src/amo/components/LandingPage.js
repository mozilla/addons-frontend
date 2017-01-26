import classNames from 'classnames';
import React, { PropTypes } from 'react';
import { compose } from 'redux';
import { asyncConnect } from 'redux-connect';
import { connect } from 'react-redux';

import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import { loadLandingAddons } from 'amo/utils';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_TOP_RATED,
} from 'core/constants';
import { apiAddonType, visibleAddonType } from 'core/utils';
import translate from 'core/i18n/translate';

import './LandingPage.scss';


export class LandingPageBase extends React.Component {
  static propTypes = {
    addonType: PropTypes.string.isRequired,
    featuredAddons: PropTypes.array,
    highlyRatedAddons: PropTypes.array,
    popularAddons: PropTypes.array,
    i18n: PropTypes.object.isRequired,
  }

  contentForType(addonType) {
    const { i18n } = this.props;

    const contentForTypes = {
      [ADDON_TYPE_EXTENSION]: {
        featuredHeader: i18n.gettext('Featured extensions'),
        featuredFooterLink: {
          pathname: `/${visibleAddonType(ADDON_TYPE_EXTENSION)}/featured/`,
          query: { addonType: ADDON_TYPE_EXTENSION },
        },
        featuredFooterText: i18n.gettext('More featured extensions'),
        popularHeader: i18n.gettext('Most popular extensions'),
        popularFooterLink: {
          pathname: '/search/',
          query: { sort: SEARCH_SORT_POPULAR, type: ADDON_TYPE_EXTENSION },
        },
        popularFooterText: i18n.gettext('More popular extensions'),
        highlyRatedHeader: i18n.gettext('Top rated extensions'),
        highlyRatedFooterLink: {
          pathname: '/search/',
          query: { sort: SEARCH_SORT_TOP_RATED, type: ADDON_TYPE_EXTENSION },
        },
        highlyRatedFooterText: i18n.gettext('More highly rated extensions'),
      },
      [ADDON_TYPE_THEME]: {
        featuredHeader: i18n.gettext('Featured themes'),
        featuredFooterLink: {
          pathname: `/${visibleAddonType(ADDON_TYPE_THEME)}/featured/`,
          query: { addonType: ADDON_TYPE_THEME },
        },
        featuredFooterText: i18n.gettext('More featured themes'),
        popularHeader: i18n.gettext('Most popular themes'),
        popularFooterLink: {
          pathname: '/search/',
          query: { sort: SEARCH_SORT_POPULAR, type: ADDON_TYPE_THEME },
        },
        popularFooterText: i18n.gettext('More popular themes'),
        highlyRatedHeader: i18n.gettext('Top rated themes'),
        highlyRatedFooterLink: {
          pathname: '/search/',
          query: { sort: SEARCH_SORT_TOP_RATED, type: ADDON_TYPE_THEME },
        },
        highlyRatedFooterText: i18n.gettext('More highly rated themes'),
      },
    };

    if (contentForTypes[addonType]) {
      return contentForTypes[addonType];
    }

    throw new Error(`No LandingPage content for addonType: ${addonType}`);
  }

  render() {
    const {
      addonType, featuredAddons, highlyRatedAddons, popularAddons,
    } = this.props;

    const html = this.contentForType(addonType);

    return (
      <div className={classNames('LandingPage', `LandingPage-${addonType}`)}>
        <LandingAddonsCard addons={featuredAddons}
          className="FeaturedAddons" header={html.featuredHeader}
          footerLink={html.featuredFooterLink}
          footerText={html.featuredFooterText} />

        <LandingAddonsCard addons={highlyRatedAddons}
          className="HighlyRatedAddons" header={html.highlyRatedHeader}
          footerLink={html.highlyRatedFooterLink}
          footerText={html.highlyRatedFooterText} />

        <LandingAddonsCard addons={popularAddons}
          className="PopularAddons" header={html.popularHeader}
          footerLink={html.popularFooterLink}
          footerText={html.popularFooterText} />
      </div>
    );
  }
}

export function mapStateToProps(state, ownProps) {
  return {
    addonType: apiAddonType(ownProps.params.visibleAddonType),
    featuredAddons: state.landing.featured.results,
    highlyRatedAddons: state.landing.highlyRated.results,
    popularAddons: state.landing.popular.results,
  };
}

export default compose(
  asyncConnect([
    { deferred: true, promise: loadLandingAddons },
  ]),
  connect(mapStateToProps),
  translate({ withRef: true }),
)(LandingPageBase);
