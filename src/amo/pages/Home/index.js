import * as React from 'react';
import config from 'config';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { setViewContext } from 'amo/actions/viewContext';
import CategoryIcon from 'amo/components/CategoryIcon';
import FeaturedCollectionCard from 'amo/components/FeaturedCollectionCard';
import HomeHeroGuides from 'amo/components/HomeHeroGuides';
import HeadLinks from 'amo/components/HeadLinks';
import HeadMetaTags from 'amo/components/HeadMetaTags';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import Link from 'amo/components/Link';
import { fetchHomeAddons } from 'amo/reducers/home';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  INSTALL_SOURCE_FEATURED,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_RECOMMENDED,
  SEARCH_SORT_TRENDING,
  VIEW_CONTEXT_HOME,
} from 'core/constants';
import { withErrorHandler } from 'core/errorHandler';
import { convertFiltersToQueryParams } from 'core/searchUtils';
import translate from 'core/i18n/translate';
import { getAddonTypeFilter } from 'core/utils';
import Card from 'ui/components/Card';
import Icon from 'ui/components/Icon';

import './styles.scss';

export const MOZILLA_USER_ID = config.get('mozillaUserId');

export const FEATURED_COLLECTIONS = [
  { slug: 'be-more-productive', userId: MOZILLA_USER_ID },
  { slug: 'youtube-boosters', userId: MOZILLA_USER_ID },
  { slug: 'feed-readers', userId: MOZILLA_USER_ID },
];

export const isFeaturedCollection = (
  collection,
  { featuredCollections = FEATURED_COLLECTIONS } = {},
) => {
  return featuredCollections.some((featured) => {
    return (
      featured.slug === collection.slug &&
      featured.userId === collection.authorId
    );
  });
};

export const getFeaturedCollectionsMetadata = (i18n) => {
  return [
    {
      footerText: i18n.gettext('See more productivity extensions'),
      header: i18n.gettext('Productivity extensions'),
      isTheme: false,
      ...FEATURED_COLLECTIONS[0],
    },
    {
      footerText: i18n.gettext('See more YouTube extensions'),
      header: i18n.gettext('YouTube boosters'),
      isTheme: false,
      ...FEATURED_COLLECTIONS[1],
    },
    {
      footerText: i18n.gettext('See more feed readers'),
      header: i18n.gettext('Feed readers'),
      isTheme: false,
      ...FEATURED_COLLECTIONS[2],
    },
  ];
};

export class HomeBase extends React.Component {
  static propTypes = {
    _config: PropTypes.object,
    _getFeaturedCollectionsMetadata: PropTypes.func,
    collections: PropTypes.array.isRequired,
    dispatch: PropTypes.func.isRequired,
    errorHandler: PropTypes.object.isRequired,
    i18n: PropTypes.object.isRequired,
    includeFeaturedThemes: PropTypes.bool,
    includeTrendingExtensions: PropTypes.bool,
    resultsLoaded: PropTypes.bool.isRequired,
    shelves: PropTypes.object.isRequired,
  };

  static defaultProps = {
    _config: config,
    _getFeaturedCollectionsMetadata: getFeaturedCollectionsMetadata,
    includeFeaturedThemes: true,
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
      includeFeaturedThemes,
      includeTrendingExtensions,
      resultsLoaded,
    } = this.props;

    dispatch(setViewContext(VIEW_CONTEXT_HOME));

    if (!resultsLoaded) {
      dispatch(
        fetchHomeAddons({
          collectionsToFetch: FEATURED_COLLECTIONS,
          errorHandlerId: errorHandler.id,
          includeFeaturedThemes,
          includeTrendingExtensions,
        }),
      );
    }
  }

  renderCuratedCollections() {
    const { i18n } = this.props;

    const curatedMozillaCollections = [
      {
        title: i18n.gettext('Bookmarks'),
        collectionSlug: 'bookmark-managers',
      },
      {
        title: i18n.gettext('Password managers'),
        collectionSlug: 'password-managers',
      },
      {
        title: i18n.gettext('Ad blockers'),
        collectionSlug: 'ad-blockers',
      },
      {
        title: i18n.gettext('Smarter shopping'),
        collectionSlug: 'smarter-shopping',
      },
      {
        title: i18n.gettext('Productivity'),
        collectionSlug: 'be-more-productive',
      },
      {
        title: i18n.gettext('Watching videos'),
        collectionSlug: 'watching-videos',
      },
    ];

    return (
      <ul className="Home-SubjectShelf-list">
        {curatedMozillaCollections.map(({ collectionSlug, title }) => (
          <li className="Home-SubjectShelf-list-item" key={collectionSlug}>
            <Link
              to={`/collections/${MOZILLA_USER_ID}/${collectionSlug}/`}
              className="Home-SubjectShelf-link"
            >
              <Icon name={`Home-SubjectShelf-${collectionSlug}`} />
              <span>{title}</span>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  renderCuratedThemes() {
    const { i18n } = this.props;
    const curatedThemes = [
      {
        color: 8,
        slug: 'abstract',
        title: i18n.gettext('Abstract'),
      },
      {
        color: 8,
        slug: 'nature',
        title: i18n.gettext('Nature'),
      },
      {
        color: 10,
        slug: 'film-and-tv',
        title: i18n.gettext('Film & TV'),
      },
      {
        color: 8,
        slug: 'scenery',
        title: i18n.gettext('Scenery'),
      },
      {
        color: 10,
        slug: 'music',
        title: i18n.gettext('Music'),
      },
      {
        color: 9,
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
                pathname: '/search/',
                query: convertFiltersToQueryParams({
                  addonType: getAddonTypeFilter(ADDON_TYPE_THEME),
                  category: slug,
                  sort: `${SEARCH_SORT_RECOMMENDED},${SEARCH_SORT_POPULAR}`,
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

  render() {
    const {
      _getFeaturedCollectionsMetadata,
      collections,
      errorHandler,
      i18n,
      includeFeaturedThemes,
      includeTrendingExtensions,
      resultsLoaded,
      shelves,
    } = this.props;

    // translators: The ending ellipsis alludes to a row of icons for each type
    // of extension.
    const extensionsHeader = i18n.gettext(`Customize the way Firefox works with
      extensions. Are you interested in…`);
    const themesHeader = i18n.gettext(`Change the way Firefox looks with
      themes.`);

    const featuredCollectionsMetadata = _getFeaturedCollectionsMetadata(i18n);

    const loading = resultsLoaded === false;

    // This is a helper function (closure) configured to render a featured
    // collection by index.
    const renderFeaturedCollection = (index) => {
      const metadata = featuredCollectionsMetadata[index];

      const collection = collections[index];
      if (loading || collection) {
        return (
          <FeaturedCollectionCard
            addons={collection}
            className="Home-FeaturedCollection"
            loading={loading}
            {...metadata}
          />
        );
      }

      return null;
    };

    return (
      <div className="Home">
        <HeadMetaTags
          description={i18n.gettext(`Download Firefox extensions and themes.
            They’re like apps for your browser. They can block annoying ads,
            protect passwords, change browser appearance, and more.`)}
        />

        <HeadLinks />

        <span
          className="visually-hidden do-not-remove"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: '<!-- Godzilla of browsers -->' }}
        />

        {errorHandler.renderErrorIfPresent()}

        <HomeHeroGuides />

        <Card
          className="Home-SubjectShelf Home-CuratedCollections"
          header={extensionsHeader}
        >
          <div className="Home-SubjectShelf-text-wrapper">
            <h2 className="Home-SubjectShelf-subheading">{extensionsHeader}</h2>
          </div>

          {this.renderCuratedCollections()}
        </Card>

        <LandingAddonsCard
          addonInstallSource={INSTALL_SOURCE_FEATURED}
          addons={shelves.featuredExtensions}
          className="Home-FeaturedExtensions"
          header={i18n.gettext('Featured extensions')}
          footerText={i18n.gettext('See more featured extensions')}
          footerLink={{
            pathname: '/search/',
            query: {
              addonType: ADDON_TYPE_EXTENSION,
              featured: true,
            },
          }}
          loading={loading}
        />

        {renderFeaturedCollection(0)}

        {includeFeaturedThemes && (
          <LandingAddonsCard
            addonInstallSource={INSTALL_SOURCE_FEATURED}
            addons={shelves.featuredThemes}
            className="Home-FeaturedThemes"
            footerText={i18n.gettext('See more featured themes')}
            footerLink={{
              pathname: '/search/',
              query: {
                addonType: getAddonTypeFilter(ADDON_TYPE_THEME, {
                  _config: this.props._config,
                }),
                featured: true,
              },
            }}
            header={i18n.gettext('Featured themes')}
            isTheme
            loading={loading}
          />
        )}

        {renderFeaturedCollection(1)}

        {renderFeaturedCollection(2)}

        {includeTrendingExtensions && (
          <LandingAddonsCard
            addonInstallSource={INSTALL_SOURCE_FEATURED}
            addons={shelves.trendingExtensions}
            className="Home-TrendingExtensions"
            header={i18n.gettext('Trending extensions')}
            footerText={i18n.gettext('See more trending extensions')}
            footerLink={{
              pathname: '/search/',
              query: {
                addonType: ADDON_TYPE_EXTENSION,
                sort: SEARCH_SORT_TRENDING,
              },
            }}
            loading={loading}
          />
        )}

        <Card
          className="Home-SubjectShelf Home-CuratedThemes"
          header={themesHeader}
        >
          <div className="Home-SubjectShelf-text-wrapper">
            <h2 className="Home-SubjectShelf-subheading">{themesHeader}</h2>
          </div>

          {this.renderCuratedThemes()}
        </Card>
      </div>
    );
  }
}

export function mapStateToProps(state) {
  return {
    clientApp: state.api.clientApp,
    collections: state.home.collections,
    resultsLoaded: state.home.resultsLoaded,
    shelves: state.home.shelves,
  };
}

export default compose(
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ name: 'Home' }),
)(HomeBase);
