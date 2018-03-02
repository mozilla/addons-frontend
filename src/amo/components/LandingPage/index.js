import makeClassName from 'classnames';
import { oneLine } from 'common-tags';
import * as React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';

import { getLanding } from 'amo/actions/landing';
import { setViewContext } from 'amo/actions/viewContext';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import NotFound from 'amo/components/ErrorPage/NotFound';
import Categories from 'amo/components/Categories';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  INSTALL_SOURCE_FEATURED,
  INSTALL_SOURCE_TOP_RATED,
  INSTALL_SOURCE_TRENDING,
  SEARCH_SORT_TRENDING,
  SEARCH_SORT_TOP_RATED,
} from 'core/constants';
import { withErrorHandler } from 'core/errorHandler';
import log from 'core/logger';
import {
  apiAddonType,
  apiAddonTypeIsValid,
  visibleAddonType as getVisibleAddonType,
} from 'core/utils';
import translate from 'core/i18n/translate';
import Button from 'ui/components/Button';

import './styles.scss';


export class LandingPageBase extends React.Component {
  static propTypes = {
    // This is a bug; addonTypeOfResults is used in
    // `componentWillReceiveProps()`.
    // eslint-disable-next-line react/no-unused-prop-types
    addonTypeOfResults: PropTypes.string.isRequired,
    // This is a bug; context is used in `setViewContextType()`.
    // eslint-disable-next-line react/no-unused-prop-types
    context: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
    errorHandler: PropTypes.object.isRequired,
    featuredAddons: PropTypes.array.isRequired,
    highlyRatedAddons: PropTypes.array.isRequired,
    loading: PropTypes.bool.isRequired,
    trendingAddons: PropTypes.array.isRequired,
    i18n: PropTypes.object.isRequired,
    params: PropTypes.objectOf({
      visibleAddonType: PropTypes.string.isRequired,
    }).isRequired,
    // This is a bug; resultsLoaded is used in `componentWillReceiveProps()`.
    // eslint-disable-next-line react/no-unused-prop-types
    resultsLoaded: PropTypes.bool.isRequired,
  }

  componentWillMount() {
    const { params } = this.props;
    if (!apiAddonTypeIsValid(params.visibleAddonType)) {
      log.warn(oneLine`Skipping componentWillMount() because visibleAddonType
        is invalid: ${params.visibleAddonType}`);
      return;
    }

    this.getLandingDataIfNeeded();
    this.setViewContextType();
  }

  componentWillReceiveProps(nextProps) {
    const { params } = nextProps;

    if (!apiAddonTypeIsValid(params.visibleAddonType)) {
      log.warn(oneLine`Skipping componentWillReceiveProps() because
        visibleAddonType is invalid: ${params.visibleAddonType}`);
      return;
    }

    this.getLandingDataIfNeeded(nextProps);
    this.setViewContextType(nextProps);
  }

  getLandingDataIfNeeded(nextProps = {}) {
    const {
      addonTypeOfResults,
      dispatch,
      errorHandler,
      loading,
      params,
      resultsLoaded,
    } = {
      ...this.props,
      ...nextProps,
    };

    const requestedAddonType = apiAddonType(params.visibleAddonType);

    if (!loading && !errorHandler.hasError() &&
        (!resultsLoaded || addonTypeOfResults !== requestedAddonType)) {
      dispatch(getLanding({
        addonType: requestedAddonType,
        errorHandlerId: errorHandler.id,
      }));
    }
  }

  setViewContextType(nextProps = {}) {
    const { context, params } = { ...this.props, ...nextProps };
    const addonType = apiAddonType(params.visibleAddonType);

    if (context !== addonType) {
      this.props.dispatch(setViewContext(addonType));
    }
  }

  contentForType = (visibleAddonType) => {
    const { i18n } = this.props;
    const addonType = apiAddonType(visibleAddonType);

    const contentForTypes = {
      [ADDON_TYPE_EXTENSION]: {
        featuredHeader: i18n.gettext('Featured extensions'),
        featuredFooterLink: {
          pathname: '/search/',
          query: {
            addonType: ADDON_TYPE_EXTENSION,
            featured: true,
          },
        },
        featuredFooterText: i18n.gettext('See more featured extensions'),
        trendingHeader: i18n.gettext('Trending extensions'),
        trendingFooterLink: {
          pathname: '/search/',
          query: { addonType: ADDON_TYPE_EXTENSION, sort: SEARCH_SORT_TRENDING },
        },
        trendingFooterText: i18n.gettext('See more trending extensions'),
        highlyRatedHeader: i18n.gettext('Top rated extensions'),
        highlyRatedFooterLink: {
          pathname: '/search/',
          query: {
            addonType: ADDON_TYPE_EXTENSION,
            sort: SEARCH_SORT_TOP_RATED,
          },
        },
        highlyRatedFooterText: i18n.gettext('See more top rated extensions'),
      },
      [ADDON_TYPE_THEME]: {
        featuredHeader: i18n.gettext('Featured themes'),
        featuredFooterLink: {
          pathname: '/search/',
          query: {
            addonType: ADDON_TYPE_THEME,
            featured: true,
          },
        },
        featuredFooterText: i18n.gettext('See more featured themes'),
        trendingHeader: i18n.gettext('Trending themes'),
        trendingFooterLink: {
          pathname: '/search/',
          query: { addonType: ADDON_TYPE_THEME, sort: SEARCH_SORT_TRENDING },
        },
        trendingFooterText: i18n.gettext('See more trending themes'),
        highlyRatedHeader: i18n.gettext('Top rated themes'),
        highlyRatedFooterLink: {
          pathname: '/search/',
          query: { addonType: ADDON_TYPE_THEME, sort: SEARCH_SORT_TOP_RATED },
        },
        highlyRatedFooterText: i18n.gettext('See more top rated themes'),
      },
    };

    return { addonType, html: contentForTypes[addonType] };
  }

  renderIfNotEmpty(addons, component) {
    if (addons.length === 0 && !this.props.loading) {
      return null;
    }

    return component;
  }

  render() {
    const {
      errorHandler,
      featuredAddons,
      highlyRatedAddons,
      loading,
      trendingAddons,
      i18n,
    } = this.props;
    const { visibleAddonType } = this.props.params;

    if (!apiAddonTypeIsValid(visibleAddonType)) {
      log.warn(oneLine`Rendering 404 because visibleAddonType
        is invalid: ${visibleAddonType}`);
      return <NotFound />;
    }

    const { addonType, html } = this.contentForType(visibleAddonType);
    const headingText = {
      [ADDON_TYPE_THEME]: i18n.gettext('Themes'),
      [ADDON_TYPE_EXTENSION]: i18n.gettext('Extensions'),
    };
    const contentText = {
      [ADDON_TYPE_THEME]: i18n.gettext(`Change your browser's appearance.
        Choose from thousands of themes to give Firefox the look you want.`),
      [ADDON_TYPE_EXTENSION]: i18n.gettext(`Explore powerful tools and features
        to customize Firefox and make the browser all your own.`),
    };

    return (
      <div className={makeClassName('LandingPage', `LandingPage--${addonType}`)}>
        <Helmet>
          <title>{headingText[addonType]}</title>
        </Helmet>

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
          {i18n.gettext('Explore all categories')}
        </Button>

        {this.renderIfNotEmpty(
          featuredAddons,
          <LandingAddonsCard
            addonInstallSource={INSTALL_SOURCE_FEATURED}
            addons={featuredAddons}
            className="FeaturedAddons"
            footerText={html.featuredFooterText}
            footerLink={html.featuredFooterLink}
            header={html.featuredHeader}
            loading={loading}
          />
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
            loading={loading}
          />
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
            loading={loading}
          />
        )}
      </div>
    );
  }
}

export function mapStateToProps(state) {
  const { landing, viewContext } = state;

  return {
    addonTypeOfResults: landing.addonType,
    context: viewContext.context,
    featuredAddons: landing.featured.results,
    highlyRatedAddons: landing.highlyRated.results,
    loading: landing.loading,
    trendingAddons: landing.trending.results,
    resultsLoaded: landing.resultsLoaded && landing.category === null,
  };
}

export default compose(
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ name: 'LandingPage' }),
)(LandingPageBase);
