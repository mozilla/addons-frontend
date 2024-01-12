import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { setViewContext } from 'amo/actions/viewContext';
import Card from 'amo/components/Card';
import CategoryIcon from 'amo/components/CategoryIcon';
import HeadLinks from 'amo/components/HeadLinks';
import HeadMetaTags from 'amo/components/HeadMetaTags';
import HeroRecommendation from 'amo/components/HeroRecommendation';
import HomepageShelves from 'amo/components/HomepageShelves';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import Link from 'amo/components/Link';
import Page from 'amo/components/Page';
import SecondaryHero from 'amo/components/SecondaryHero';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
  INSTALL_SOURCE_FEATURED,
  MOBILE_HOME_PAGE_RECOMMENDED_EXTENSIONS_COUNT,
  MOBILE_HOME_PAGE_TRENDING_EXTENSIONS_COUNT,
  RECOMMENDED,
  SEARCH_SORT_RANDOM,
  SEARCH_SORT_TRENDING,
  VIEW_CONTEXT_HOME,
} from 'amo/constants';
import { withErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import { fetchHomeData } from 'amo/reducers/home';
import { getCategoryResultsPathname } from 'amo/utils/categories';

import './styles.scss';

export class HomeBase extends React.Component {
  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    errorHandler: PropTypes.object.isRequired,
    homeShelves: PropTypes.object,
    jed: PropTypes.object.isRequired,
    isDesktopSite: PropTypes.bool,
    isLoading: PropTypes.bool,
    resultsLoaded: PropTypes.bool.isRequired,
    shelves: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.loadDataIfNeeded();
  }

  componentDidUpdate() {
    this.loadDataIfNeeded();
  }

  loadDataIfNeeded() {
    const { dispatch, errorHandler, isDesktopSite, isLoading, resultsLoaded } =
      this.props;

    if (errorHandler.hasError()) {
      return;
    }

    dispatch(setViewContext(VIEW_CONTEXT_HOME));

    if (!resultsLoaded && !isLoading) {
      dispatch(
        fetchHomeData({
          errorHandlerId: errorHandler.id,
          isDesktopSite,
        }),
      );
    }
  }

  renderCuratedThemes() {
    const { jed } = this.props;
    const curatedThemes = [
      {
        color: 1,
        slug: 'abstract',
        title: jed.gettext('Abstract'),
      },
      {
        color: 2,
        slug: 'nature',
        title: jed.gettext('Nature'),
      },
      {
        color: 3,
        slug: 'film-and-tv',
        title: jed.gettext('Film & TV'),
      },
      {
        color: 4,
        slug: 'scenery',
        title: jed.gettext('Scenery'),
      },
      {
        color: 5,
        slug: 'music',
        title: jed.gettext('Music'),
      },
      {
        color: 6,
        slug: 'seasonal',
        title: jed.gettext('Seasonal'),
      },
    ];

    return (
      <ul className="Home-SubjectShelf-list">
        {curatedThemes.map(({ color, slug, title }) => (
          <li className="Home-SubjectShelf-list-item" key={slug}>
            <Link
              to={{
                pathname: getCategoryResultsPathname({
                  addonType: ADDON_TYPE_STATIC_THEME,
                  slug,
                }),
              }}
              className="Home-SubjectShelf-link"
            >
              <CategoryIcon name={slug} color={color} />
              <span>{title}</span>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  renderAndroidHeroHeader() {
    const { jed } = this.props;

    return (
      <div className="Home-heroHeader">
        <h2 className="Home-heroHeader-title">
          {jed.gettext('Firefox for Android extensions')}
        </h2>
        <h3 className="Home-heroHeader-subtitle">
          {jed.gettext(
            `Personalize Firefox for Android with powerful extensions.`,
          )}
        </h3>
      </div>
    );
  }

  renderAndroidShelves() {
    const { jed, shelves, resultsLoaded } = this.props;
    const loading = resultsLoaded === false;

    return [
      <LandingAddonsCard
        key="recommended-extensions"
        addonInstallSource={INSTALL_SOURCE_FEATURED}
        addons={shelves.recommendedExtensions}
        className="Home-RecommendedExtensions"
        header={jed.gettext('Recommended extensions')}
        footerText={jed.gettext('See more recommended extensions')}
        footerLink={{
          pathname: '/search/',
          query: {
            addonType: ADDON_TYPE_EXTENSION,
            promoted: RECOMMENDED,
            sort: SEARCH_SORT_RANDOM,
          },
        }}
        loading={loading}
        placeholderCount={MOBILE_HOME_PAGE_RECOMMENDED_EXTENSIONS_COUNT}
      />,
      <LandingAddonsCard
        key="trending-extensions"
        addonInstallSource={INSTALL_SOURCE_FEATURED}
        addons={shelves.trendingExtensions}
        className="Home-TrendingExtensions"
        header={jed.gettext('Explore all Android extensions')}
        footerText={jed.gettext('See more trending extensions')}
        footerLink={{
          pathname: '/search/',
          query: {
            addonType: ADDON_TYPE_EXTENSION,
            sort: SEARCH_SORT_TRENDING,
          },
        }}
        loading={loading}
        placeholderCount={MOBILE_HOME_PAGE_TRENDING_EXTENSIONS_COUNT}
      />,
    ];
  }

  render() {
    const { errorHandler, homeShelves, jed, isDesktopSite, resultsLoaded } =
      this.props;

    const themesHeader = jed.gettext(`Change the way Firefox looks with
      themes.`);

    const loading = resultsLoaded === false;

    return (
      <Page isHomePage showWrongPlatformWarning={!isDesktopSite}>
        <div className="Home">
          <HeadMetaTags
            description={jed.gettext(`Download Firefox extensions and themes.
            They’re like apps for your browser. They can block annoying ads,
            protect passwords, change browser appearance, and more.`)}
            withTwitterMeta
          />

          <HeadLinks />

          <span
            className="visually-hidden do-not-remove"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: '<!-- Godzilla of browsers -->',
            }}
          />

          {!isDesktopSite && errorHandler.hasError() ? (
            <div className="Home-noHeroError">{errorHandler.renderError()}</div>
          ) : null}

          {isDesktopSite ? (
            <HeroRecommendation
              errorHandler={errorHandler}
              shelfData={homeShelves ? homeShelves.primary : undefined}
            />
          ) : null}

          <div className="Home-content">
            {isDesktopSite ? (
              <SecondaryHero
                shelfData={homeShelves ? homeShelves.secondary : undefined}
              />
            ) : null}

            {isDesktopSite ? null : this.renderAndroidHeroHeader()}

            {isDesktopSite ? (
              <HomepageShelves
                loading={loading}
                shelves={homeShelves ? homeShelves.results : []}
              />
            ) : (
              this.renderAndroidShelves()
            )}

            {isDesktopSite ? (
              <Card
                className="Home-SubjectShelf Home-CuratedThemes"
                header={themesHeader}
              >
                <div className="Home-SubjectShelf-text-wrapper">
                  <h2 className="Home-SubjectShelf-subheading">
                    {themesHeader}
                  </h2>
                </div>

                {this.renderCuratedThemes()}
              </Card>
            ) : null}
          </div>
        </div>
      </Page>
    );
  }
}

function mapStateToProps(state) {
  return {
    homeShelves: state.home.homeShelves,
    isDesktopSite: state.api.clientApp === CLIENT_APP_FIREFOX,
    isLoading: state.home.isLoading,
    resultsLoaded: state.home.resultsLoaded,
    shelves: state.home.shelves,
  };
}

export default compose(
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ id: 'Home' }),
)(HomeBase);
