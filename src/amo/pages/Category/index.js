/* eslint-disable react/no-unused-prop-types */
import makeClassName from 'classnames';
import PropTypes from 'prop-types';
import config from 'config';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import Helmet from 'react-helmet';
import { oneLine } from 'common-tags';

import { getLanding } from 'amo/actions/landing';
import { setViewContext } from 'amo/actions/viewContext';
import CategoryHeader from 'amo/components/CategoryHeader';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import NotFound from 'amo/components/ErrorPage/NotFound';
import { getCanonicalURL } from 'amo/utils';
import { categoriesFetch } from 'core/actions/categories';
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
import translate from 'core/i18n/translate';
import log from 'core/logger';
import {
  apiAddonType,
  apiAddonTypeIsValid,
  getAddonTypeFilter,
  isTheme,
} from 'core/utils';

import './styles.scss';

export class CategoryBase extends React.Component {
  static propTypes = {
    _config: PropTypes.object,
    addonTypeOfResults: PropTypes.string,
    categoryOfResults: PropTypes.string,
    categories: PropTypes.object,
    clientApp: PropTypes.string,
    dispatch: PropTypes.func.isRequired,
    errorHandler: PropTypes.object.isRequired,
    featuredAddons: PropTypes.array,
    highlyRatedAddons: PropTypes.array,
    i18n: PropTypes.object.isRequired,
    loading: PropTypes.bool,
    locationPathname: PropTypes.string.isRequired,
    match: PropTypes.shape({
      params: PropTypes.shape({
        slug: PropTypes.string,
        visibleAddonType: PropTypes.string,
      }).isRequired,
    }).isRequired,
    trendingAddons: PropTypes.array,
    resultsLoaded: PropTypes.bool.isRequired,
  };

  static defaultProps = {
    _config: config,
  };

  constructor(props) {
    super(props);

    this.loadDataIfNeeded();
  }

  componentWillReceiveProps(nextProps) {
    this.loadDataIfNeeded(nextProps);
  }

  loadDataIfNeeded(nextProps = {}) {
    const {
      addonTypeOfResults,
      categoryOfResults,
      categories,
      clientApp,
      dispatch,
      errorHandler,
      loading,
      match: { params },
      resultsLoaded,
    } = {
      ...this.props,
      ...nextProps,
    };

    if (errorHandler.hasError()) {
      log.warn('Not loading data because of an error.');
      return;
    }

    if (!apiAddonTypeIsValid(params.visibleAddonType)) {
      log.warn(oneLine`Skipping loadDataIfNeeded() because visibleAddonType
        is invalid: ${params.visibleAddonType}`);
      return;
    }

    if (loading) {
      return;
    }

    const addonType = apiAddonType(params.visibleAddonType);

    if (!categories) {
      dispatch(categoriesFetch({ errorHandlerId: errorHandler.id }));
    } else {
      let category;
      if (categories[clientApp] && categories[clientApp][addonType]) {
        category = categories[clientApp][addonType][params.slug];
      }

      if (!category) {
        log.warn(oneLine`Skipping loadDataIfNeeded() because category is
          invalid: ${params.slug}`);
        return;
      }
    }

    dispatch(setViewContext(addonType));

    if (
      !resultsLoaded ||
      addonTypeOfResults !== addonType ||
      categoryOfResults !== params.slug
    ) {
      dispatch(
        getLanding({
          addonType,
          category: params.slug,
          errorHandlerId: errorHandler.id,
        }),
      );
    }
  }

  contentForType = (addonType) => {
    const {
      i18n,
      match: { params },
    } = this.props;

    const themeFilter = getAddonTypeFilter(ADDON_TYPE_THEME, {
      _config: this.props._config,
    });

    const contentForTypes = {
      [ADDON_TYPE_EXTENSION]: {
        title: i18n.gettext('Extensions'),
        featuredHeader: i18n.gettext('Featured extensions'),
        featuredFooterLink: {
          pathname: '/search/',
          query: {
            addonType: ADDON_TYPE_EXTENSION,
            category: params.slug,
            featured: true,
          },
        },
        featuredFooterText: i18n.gettext('See more featured extensions'),
        trendingHeader: i18n.gettext('Trending extensions'),
        trendingFooterLink: {
          pathname: '/search/',
          query: {
            addonType: ADDON_TYPE_EXTENSION,
            category: params.slug,
            sort: SEARCH_SORT_TRENDING,
          },
        },
        trendingFooterText: i18n.gettext('See more trending extensions'),
        highlyRatedHeader: i18n.gettext('Top rated extensions'),
        highlyRatedFooterLink: {
          pathname: '/search/',
          query: {
            addonType: ADDON_TYPE_EXTENSION,
            category: params.slug,
            sort: SEARCH_SORT_TOP_RATED,
          },
        },
        highlyRatedFooterText: i18n.gettext('See more top rated extensions'),
      },
      [ADDON_TYPE_THEME]: {
        title: i18n.gettext('Themes'),
        featuredHeader: i18n.gettext('Featured themes'),
        featuredFooterLink: {
          pathname: '/search/',
          query: {
            addonType: themeFilter,
            category: params.slug,
            featured: true,
          },
        },
        featuredFooterText: i18n.gettext('See more featured themes'),
        trendingHeader: i18n.gettext('Trending themes'),
        trendingFooterLink: {
          pathname: '/search/',
          query: {
            addonType: themeFilter,
            category: params.slug,
            sort: SEARCH_SORT_TRENDING,
          },
        },
        trendingFooterText: i18n.gettext('See more trending themes'),
        highlyRatedHeader: i18n.gettext('Top rated themes'),
        highlyRatedFooterLink: {
          pathname: '/search/',
          query: {
            addonType: themeFilter,
            category: params.slug,
            sort: SEARCH_SORT_TOP_RATED,
          },
        },
        highlyRatedFooterText: i18n.gettext('See more top rated themes'),
      },
    };

    return { html: contentForTypes[addonType] };
  };

  renderIfNotEmpty(addons, component) {
    if (addons.length === 0 && !this.props.loading) {
      return null;
    }

    return component;
  }

  render() {
    const {
      _config,
      categories,
      clientApp,
      errorHandler,
      featuredAddons,
      highlyRatedAddons,
      loading,
      locationPathname,
      match: { params },
      trendingAddons,
    } = this.props;

    let addonType;
    try {
      addonType = apiAddonType(params.visibleAddonType);
    } catch (error) {
      log.info(`addonType ${params.visibleAddonType} threw an error: ${error}`);
      return <NotFound />;
    }

    let category;
    if (categories) {
      if (categories[clientApp] && categories[clientApp][addonType]) {
        category = categories[clientApp][addonType][params.slug];
      }

      if (!errorHandler.hasError() && !category) {
        return <NotFound />;
      }
    }

    const { html } = this.contentForType(addonType);

    const isAddonTheme = isTheme(addonType);

    return (
      <div
        className={makeClassName('Category', {
          'Category--theme': isAddonTheme,
        })}
      >
        {category && (
          <Helmet>
            <title>{`${category.name} – ${html.title}`}</title>
            <link
              rel="canonical"
              href={getCanonicalURL({ locationPathname, _config })}
            />
          </Helmet>
        )}

        {errorHandler.renderErrorIfPresent()}

        <CategoryHeader category={category} />

        {this.renderIfNotEmpty(
          featuredAddons,
          <LandingAddonsCard
            addonInstallSource={INSTALL_SOURCE_FEATURED}
            addons={featuredAddons}
            className="FeaturedAddons"
            footerText={html.featuredFooterText}
            footerLink={html.featuredFooterLink}
            header={html.featuredHeader}
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
    );
  }
}

function mapStateToProps(state) {
  return {
    addonTypeOfResults: state.landing.addonType,
    categories: state.categories.categories,
    categoryOfResults: state.landing.category,
    clientApp: state.api.clientApp,
    featuredAddons: state.landing.featured.results,
    highlyRatedAddons: state.landing.highlyRated.results,
    loading: state.categories.loading || state.landing.loading,
    locationPathname: state.router.location.pathname,
    resultsLoaded: state.landing.resultsLoaded,
    trendingAddons: state.landing.trending.results,
  };
}

export default compose(
  withErrorHandler({ name: 'Category' }),
  connect(mapStateToProps),
  translate(),
)(CategoryBase);
