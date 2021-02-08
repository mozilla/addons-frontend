import * as React from 'react';
import config from 'config';
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
import Link from 'amo/components/Link';
import LoadingText from 'amo/components/LoadingText';
import Page from 'amo/components/Page';
import SecondaryHero from 'amo/components/SecondaryHero';
import {
  LANDING_PAGE_EXTENSION_COUNT,
  MOBILE_HOME_PAGE_EXTENSION_COUNT,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
  INSTALL_SOURCE_FEATURED,
  VIEW_CONTEXT_HOME,
} from 'amo/constants';
import { withErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import { fetchHomeData } from 'amo/reducers/home';
import { getCategoryResultsPathname } from 'amo/utils/categories';

import './styles.scss';

export const MOZILLA_USER_ID = config.get('mozillaUserId');

export const FEATURED_COLLECTIONS = [
  { slug: 'privacy-matters', userId: MOZILLA_USER_ID },
  { slug: 'password-managers', userId: MOZILLA_USER_ID },
];

export const getFeaturedCollectionsMetadata = (i18n) => {
  return [
    {
      footerText: i18n.gettext('See more enhanced privacy extensions'),
      header: i18n.gettext('Enhanced privacy extensions'),
      isTheme: false,
      ...FEATURED_COLLECTIONS[0],
    },
    {
      footerText: i18n.gettext('See more recommended password managers'),
      header: i18n.gettext('Recommended password managers'),
      isTheme: false,
      ...FEATURED_COLLECTIONS[1],
    },
  ];
};

export class HomeBase extends React.Component {
  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    errorHandler: PropTypes.object.isRequired,
    homeShelves: PropTypes.object,
    i18n: PropTypes.object.isRequired,
    includeRecommendedThemes: PropTypes.bool,
    includeTrendingExtensions: PropTypes.bool,
    isDesktopSite: PropTypes.bool,
    isLoading: PropTypes.bool,
    resultsLoaded: PropTypes.bool.isRequired,
  };

  static defaultProps = {
    _config: config,
    _getFeaturedCollectionsMetadata: getFeaturedCollectionsMetadata,
    includeRecommendedThemes: true,
    includeTrendingExtensions: false,
  };

  constructor(props) {
    super(props);

    this.loadDataIfNeeded();
  }

  componentDidUpdate() {
    this.loadDataIfNeeded();
  }

  loadDataIfNeeded() {
    const {
      dispatch,
      errorHandler,
      includeRecommendedThemes,
      includeTrendingExtensions,
      isDesktopSite,
      isLoading,
      resultsLoaded,
    } = this.props;

    if (errorHandler.hasError()) {
      return;
    }

    dispatch(setViewContext(VIEW_CONTEXT_HOME));

    if (!resultsLoaded && !isLoading) {
      dispatch(
        fetchHomeData({
          collectionsToFetch: FEATURED_COLLECTIONS,
          errorHandlerId: errorHandler.id,
          includeRecommendedThemes,
          includeTrendingExtensions,
          isDesktopSite,
        }),
      );
    }
  }

  renderCuratedThemes() {
    const { i18n } = this.props;
    const curatedThemes = [
      {
        color: 1,
        slug: 'abstract',
        title: i18n.gettext('Abstract'),
      },
      {
        color: 2,
        slug: 'nature',
        title: i18n.gettext('Nature'),
      },
      {
        color: 3,
        slug: 'film-and-tv',
        title: i18n.gettext('Film & TV'),
      },
      {
        color: 4,
        slug: 'scenery',
        title: i18n.gettext('Scenery'),
      },
      {
        color: 5,
        slug: 'music',
        title: i18n.gettext('Music'),
      },
      {
        color: 6,
        slug: 'seasonal',
        title: i18n.gettext('Seasonal'),
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

  renderHeroHeader() {
    const { homeShelves } = this.props;
    return (
      <div className="Home-heroHeader">
        <h2 className="Home-heroHeader-title">
          {homeShelves ? homeShelves.secondary.headline : <LoadingText />}
        </h2>
        <h3 className="Home-heroHeader-subtitle">
          {homeShelves ? homeShelves.secondary.description : <LoadingText />}
        </h3>
      </div>
    );
  }

  render() {
    const {
      errorHandler,
      homeShelves,
      i18n,
      isDesktopSite,
      resultsLoaded,
    } = this.props;

    const themesHeader = i18n.gettext(`Change the way Firefox looks with
      themes.`);

    const loading = resultsLoaded === false;

    return (
      <Page isHomePage showWrongPlatformWarning={!isDesktopSite}>
        <div className="Home">
          <HeadMetaTags
            description={i18n.gettext(`Download Firefox extensions and themes.
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

            {!isDesktopSite ? this.renderHeroHeader() : null}

            {homeShelves ? (
              <HomepageShelves
                addonInstallSource={INSTALL_SOURCE_FEATURED}
                loading={loading}
                placeholderCount={
                  isDesktopSite
                    ? LANDING_PAGE_EXTENSION_COUNT
                    : MOBILE_HOME_PAGE_EXTENSION_COUNT
                }
                shelves={homeShelves.results}
              />
            ) : null}

            {isDesktopSite ? (
              <>
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
              </>
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
  };
}

export default compose(
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ name: 'Home' }),
)(HomeBase);
