import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';

import { getLanding } from 'amo/reducers/landing';
import { setViewContext } from 'amo/actions/viewContext';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import Categories from 'amo/components/Categories';
import HeadLinks from 'amo/components/HeadLinks';
import HeadMetaTags from 'amo/components/HeadMetaTags';
import Page from 'amo/components/Page';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  INSTALL_SOURCE_FEATURED,
  INSTALL_SOURCE_TOP_RATED,
  INSTALL_SOURCE_TRENDING,
  RECOMMENDED,
  SEARCH_SORT_RANDOM,
  SEARCH_SORT_TOP_RATED,
  SEARCH_SORT_TRENDING,
} from 'amo/constants';
import { withErrorHandler } from 'amo/errorHandler';
import {
  apiAddonType,
  apiAddonTypeIsValid,
  visibleAddonType as getVisibleAddonType,
} from 'amo/utils';
import translate from 'amo/i18n/translate';
import Button from 'amo/components/Button';

import './styles.scss';

export class LandingPageBase extends React.Component {
  static propTypes = {
    addonTypeOfResults: PropTypes.string,
    // This is a bug; context is used in `setViewContextType()`.
    // eslint-disable-next-line react/no-unused-prop-types
    context: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
    errorHandler: PropTypes.object.isRequired,
    recommendedAddons: PropTypes.array.isRequired,
    highlyRatedAddons: PropTypes.array.isRequired,
    loading: PropTypes.bool.isRequired,
    trendingAddons: PropTypes.array.isRequired,
    jed: PropTypes.object.isRequired,
    match: PropTypes.shape({
      params: PropTypes.shape({
        visibleAddonType: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
    resultsLoaded: PropTypes.bool.isRequired,
  };

  constructor(props) {
    super(props);

    this.getLandingDataIfNeeded();
    this.setViewContextType();
  }

  componentDidUpdate() {
    const { params } = this.props.match;

    invariant(
      apiAddonTypeIsValid(params.visibleAddonType),
      'LandingPage should not be accessible with an invalid addonType',
    );

    this.getLandingDataIfNeeded();
    this.setViewContextType();
  }

  getLandingDataIfNeeded() {
    const {
      addonTypeOfResults,
      dispatch,
      errorHandler,
      loading,
      match: { params },
      resultsLoaded,
    } = this.props;

    const requestedAddonType = apiAddonType(params.visibleAddonType);

    if (
      !loading &&
      !errorHandler.hasError() &&
      (!resultsLoaded || addonTypeOfResults !== requestedAddonType)
    ) {
      dispatch(
        getLanding({
          addonType: requestedAddonType,
          errorHandlerId: errorHandler.id,
        }),
      );
    }
  }

  setViewContextType() {
    const {
      context,
      match: { params },
    } = this.props;
    const addonType = apiAddonType(params.visibleAddonType);

    if (context !== addonType) {
      this.props.dispatch(setViewContext(addonType));
    }
  }

  contentForType = (visibleAddonType) => {
    const { jed } = this.props;
    const addonType = apiAddonType(visibleAddonType);

    const contentForTypes = {
      [ADDON_TYPE_EXTENSION]: {
        recommendedHeader: jed.gettext('Recommended extensions'),
        recommendedFooterLink: {
          pathname: '/search/',
          query: {
            addonType: ADDON_TYPE_EXTENSION,
            promoted: RECOMMENDED,
            sort: SEARCH_SORT_RANDOM,
          },
        },
        recommendedFooterText: jed.gettext('See more recommended extensions'),
        trendingHeader: jed.gettext('Trending extensions'),
        trendingFooterLink: {
          pathname: '/search/',
          query: {
            addonType: ADDON_TYPE_EXTENSION,
            promoted: RECOMMENDED,
            sort: SEARCH_SORT_TRENDING,
          },
        },
        trendingFooterText: jed.gettext('See more trending extensions'),
        highlyRatedHeader: jed.gettext('Top rated extensions'),
        highlyRatedFooterLink: {
          pathname: '/search/',
          query: {
            addonType: ADDON_TYPE_EXTENSION,
            promoted: RECOMMENDED,
            sort: SEARCH_SORT_TOP_RATED,
          },
        },
        highlyRatedFooterText: jed.gettext('See more top rated extensions'),
      },
      [ADDON_TYPE_STATIC_THEME]: {
        recommendedHeader: jed.gettext('Recommended themes'),
        recommendedFooterLink: {
          pathname: '/search/',
          query: {
            addonType: ADDON_TYPE_STATIC_THEME,
            promoted: RECOMMENDED,
            sort: SEARCH_SORT_RANDOM,
          },
        },
        recommendedFooterText: jed.gettext('See more recommended themes'),
        trendingHeader: jed.gettext('Trending themes'),
        trendingFooterLink: {
          pathname: '/search/',
          query: {
            addonType: ADDON_TYPE_STATIC_THEME,
            sort: SEARCH_SORT_TRENDING,
          },
        },
        trendingFooterText: jed.gettext('See more trending themes'),
        highlyRatedHeader: jed.gettext('Top rated themes'),
        highlyRatedFooterLink: {
          pathname: '/search/',
          query: {
            addonType: ADDON_TYPE_STATIC_THEME,
            sort: SEARCH_SORT_TOP_RATED,
          },
        },
        highlyRatedFooterText: jed.gettext('See more top rated themes'),
      },
    };

    return { addonType, html: contentForTypes[addonType] };
  };

  renderIfNotEmpty(addons, component) {
    if (addons.length === 0 && !this.props.loading) {
      return null;
    }

    return component;
  }

  getPageDescription() {
    const {
      jed,
      match: { params },
    } = this.props;

    const addonType = apiAddonType(params.visibleAddonType);

    if (addonType === ADDON_TYPE_STATIC_THEME) {
      return jed.gettext(`Download themes to change how Firefox looks. Tailor
        your experience to your tastes. Cute critters, evil robots, beautiful
        landscapes—thousands of options.`);
    }

    return jed.gettext(`Download Firefox Extensions to add features that
      customize browsing. Protect passwords, find deals, enhance video, and
      block annoying ads with browser apps.`);
  }

  render() {
    const {
      errorHandler,
      recommendedAddons,
      highlyRatedAddons,
      jed,
      loading,
      trendingAddons,
    } = this.props;

    const { visibleAddonType } = this.props.match.params;
    const { addonType, html } = this.contentForType(visibleAddonType);
    const headingText = {
      [ADDON_TYPE_STATIC_THEME]: jed.gettext('Themes'),
      [ADDON_TYPE_EXTENSION]: jed.gettext('Extensions'),
    };
    const contentText = {
      [ADDON_TYPE_STATIC_THEME]: jed.gettext(`Change your browser's appearance.
        Choose from thousands of themes to give Firefox the look you want.`),
      [ADDON_TYPE_EXTENSION]: jed.gettext(`Explore powerful tools and features
        to customize Firefox and make the browser all your own.`),
    };

    const isAddonTheme = ADDON_TYPE_STATIC_THEME === addonType;
    const title = headingText[addonType];

    return (
      <Page>
        <div
          className={makeClassName('LandingPage', `LandingPage--${addonType}`, {
            'LandingPage--theme': isAddonTheme,
          })}
        >
          <Helmet>
            <title>{title}</title>
          </Helmet>

          <HeadMetaTags description={this.getPageDescription()} title={title} />

          <HeadLinks />

          {errorHandler.renderErrorIfPresent()}

          <div className="LandingPage-header">
            <h1 className="LandingPage-addonType-name">
              {headingText[addonType]}
            </h1>
            <p className="LandingPage-heading-content">
              {contentText[addonType]}
            </p>
          </div>

          <Categories addonType={addonType} />

          <Button
            buttonType="light"
            className="LandingPage-button"
            to={`/${getVisibleAddonType(addonType)}/categories/`}
          >
            {jed.gettext('Explore all categories')}
          </Button>

          {this.renderIfNotEmpty(
            recommendedAddons,
            <LandingAddonsCard
              addonInstallSource={INSTALL_SOURCE_FEATURED}
              addons={recommendedAddons}
              className="RecommendedAddons"
              footerText={html.recommendedFooterText}
              footerLink={html.recommendedFooterLink}
              header={html.recommendedHeader}
              isTheme={isAddonTheme}
              loading={loading}
            />,
          )}
          {this.renderIfNotEmpty(
            highlyRatedAddons,
            <LandingAddonsCard
              addonInstallSource={INSTALL_SOURCE_TOP_RATED}
              addons={highlyRatedAddons}
              className="HighlyRatedAddons"
              footerLink={html.highlyRatedFooterLink}
              footerText={html.highlyRatedFooterText}
              header={html.highlyRatedHeader}
              isTheme={isAddonTheme}
              loading={loading}
            />,
          )}
          {this.renderIfNotEmpty(
            trendingAddons,
            <LandingAddonsCard
              addonInstallSource={INSTALL_SOURCE_TRENDING}
              addons={trendingAddons}
              className="TrendingAddons"
              footerLink={html.trendingFooterLink}
              footerText={html.trendingFooterText}
              header={html.trendingHeader}
              isTheme={isAddonTheme}
              loading={loading}
            />,
          )}
        </div>
      </Page>
    );
  }
}

function mapStateToProps(state) {
  const { landing, viewContext } = state;

  return {
    addonTypeOfResults: landing.addonType,
    context: viewContext.context,
    recommendedAddons: landing.recommended.results,
    highlyRatedAddons: landing.highlyRated.results,
    loading: landing.loading,
    trendingAddons: landing.trending.results,
    resultsLoaded: landing.resultsLoaded && landing.category === null,
  };
}

export default compose(
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ id: 'LandingPage' }),
)(LandingPageBase);
