import classNames from 'classnames';
import React, { PropTypes } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import NotFound from 'amo/components/ErrorPage/NotFound';
import { loadLandingAddons } from 'amo/utils';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_TOP_RATED,
} from 'core/constants';
import { AddonTypeNotFound } from 'core/errors';
import log from 'core/logger';
import {
  apiAddonType as getApiAddonType,
  safeAsyncConnect,
  visibleAddonType as getVisibleAddonType,
} from 'core/utils';
import translate from 'core/i18n/translate';
import Icon from 'ui/components/Icon/index';
import Link from './Link';

import './LandingPage.scss';


export class LandingPageBase extends React.Component {
  static propTypes = {
    apiAddonType: PropTypes.func.isRequired,
    featuredAddons: PropTypes.array,
    highlyRatedAddons: PropTypes.array,
    popularAddons: PropTypes.array,
    i18n: PropTypes.object.isRequired,
    params: PropTypes.objectOf({
      visibleAddonType: PropTypes.string.isRequired,
    }).isRequired,
  }

  static defaultProps = {
    apiAddonType: getApiAddonType,
  }

  contentForType(visibleAddonType) {
    const { apiAddonType, i18n } = this.props;
    const addonType = apiAddonType(visibleAddonType);

    const contentForTypes = {
      [ADDON_TYPE_EXTENSION]: {
        featuredHeader: i18n.gettext('Featured extensions'),
        featuredFooterLink: {
          pathname: `/${getVisibleAddonType(ADDON_TYPE_EXTENSION)}/featured/`,
        },
        featuredFooterText: i18n.gettext('More featured extensions'),
        popularHeader: i18n.gettext('Most popular extensions'),
        popularFooterLink: {
          pathname: '/search/',
          query: { addonType: ADDON_TYPE_EXTENSION, sort: SEARCH_SORT_POPULAR },
        },
        popularFooterText: i18n.gettext('More popular extensions'),
        highlyRatedHeader: i18n.gettext('Top rated extensions'),
        highlyRatedFooterLink: {
          pathname: '/search/',
          query: {
            addonType: ADDON_TYPE_EXTENSION,
            sort: SEARCH_SORT_TOP_RATED,
          },
        },
        highlyRatedFooterText: i18n.gettext('More highly rated extensions'),
      },
      [ADDON_TYPE_THEME]: {
        featuredHeader: i18n.gettext('Featured themes'),
        featuredFooterLink: {
          pathname: `/${getVisibleAddonType(ADDON_TYPE_THEME)}/featured/`,
        },
        featuredFooterText: i18n.gettext('More featured themes'),
        popularHeader: i18n.gettext('Most popular themes'),
        popularFooterLink: {
          pathname: '/search/',
          query: { addonType: ADDON_TYPE_THEME, sort: SEARCH_SORT_POPULAR },
        },
        popularFooterText: i18n.gettext('More popular themes'),
        highlyRatedHeader: i18n.gettext('Top rated themes'),
        highlyRatedFooterLink: {
          pathname: '/search/',
          query: { addonType: ADDON_TYPE_THEME, sort: SEARCH_SORT_TOP_RATED },
        },
        highlyRatedFooterText: i18n.gettext('More highly rated themes'),
      },
    };

    return { addonType, html: contentForTypes[addonType] };
  }

  render() {
    const { featuredAddons, highlyRatedAddons, popularAddons } = this.props;
    const { visibleAddonType } = this.props.params;
    const { i18n } = this.props;

    let content;
    try {
      content = this.contentForType(visibleAddonType);
    } catch (err) {
      if (err instanceof AddonTypeNotFound) {
        log.info('Rendering <NotFound /> for error:', err);
        return <NotFound />;
      }

      throw err;
    }

    const { addonType, html } = content;
    const themeText = i18n.gettext('Change your browser’s appearance. Choose from thousands of themes to give Firefox the look you want.');
    const extensionsText = i18n.gettext('Install powerful tools that make browsing faster and safer, add-ons make your browser yours.');

    return (
      <div className={classNames('LandingPage', `LandingPage-${addonType}`)}>

        <div className="LandingPage-Header">
          <Icon name={classNames(`${addonType}`)} />
          <div className="LandingPage-Header-Text">
            <h1 className="LandingPage-Heading">
              {addonType === 'persona' ? i18n.gettext('Themes') : i18n.gettext('Extensions')}
            </h1>
            <p className="LandingPage-Heading-Content">
              {addonType === 'persona' ? i18n.gettext(themeText) : i18n.gettext(extensionsText)}
            </p>
          </div>
        </div>

        <Link className="Browse-Button" appearance="light"
          to="">
          <Icon name="browse" />
          <span className="Browse-Button-Text">
            {i18n.gettext('Browse by category')}
          </span>
        </Link>

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

export function mapStateToProps(state) {
  return {
    featuredAddons: state.landing.featured.results,
    highlyRatedAddons: state.landing.highlyRated.results,
    popularAddons: state.landing.popular.results,
  };
}

export default compose(
  safeAsyncConnect([{ promise: loadLandingAddons }]),
  connect(mapStateToProps),
  translate({ withRef: true }),
)(LandingPageBase);
