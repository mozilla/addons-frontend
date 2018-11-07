import * as React from 'react';
import config from 'config';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import Helmet from 'react-helmet';

import { setViewContext } from 'amo/actions/viewContext';
import CategoryIcon from 'amo/components/CategoryIcon';
import FeaturedCollectionCard from 'amo/components/FeaturedCollectionCard';
import HomeHeroBanner from 'amo/components/HomeHeroBanner';
import HomeHeroGuides from 'amo/components/HomeHeroGuides';
import HeadLinks from 'amo/components/HeadLinks';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import Link from 'amo/components/Link';
import { fetchHomeAddons } from 'amo/reducers/home';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  INSTALL_SOURCE_FEATURED,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_TRENDING,
  VIEW_CONTEXT_HOME,
} from 'core/constants';
import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import { getAddonTypeFilter } from 'core/utils';
import Card from 'ui/components/Card';
import Icon from 'ui/components/Icon';

import './styles.scss';

export const FEATURED_COLLECTIONS = [
  { slug: 'privacy-matters', username: 'mozilla' },
  { slug: 'social-media-customization', username: 'mozilla' },
];

export const isFeaturedCollection = (
  collection,
  { featuredCollections = FEATURED_COLLECTIONS } = {},
) => {
  return featuredCollections.some((featured) => {
    return (
      featured.slug === collection.slug &&
      featured.username === collection.authorUsername
    );
  });
};

export const getFeaturedCollectionsMetadata = (i18n) => {
  return [
    {
      footerText: i18n.gettext('See more privacy & security extensions'),
      header: i18n.gettext('Privacy & security'),
      isTheme: false,
      ...FEATURED_COLLECTIONS[0],
    },
    {
      footerText: i18n.gettext('See more social media customization'),
      header: i18n.gettext('Social media customization'),
      isTheme: false,
      ...FEATURED_COLLECTIONS[1],
    },
  ];
};

export class HomeBase extends React.Component {
  static propTypes = {
    _config: PropTypes.object,
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
    includeFeaturedThemes: true,
    includeTrendingExtensions: false,
  };

  constructor(props) {
    super(props);

    const {
      dispatch,
      errorHandler,
      includeFeaturedThemes,
      includeTrendingExtensions,
      resultsLoaded,
    } = props;

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
        title: i18n.gettext('Smarter Shopping'),
        collectionSlug: 'smarter-shopping',
      },
      {
        title: i18n.gettext('Productivity'),
        collectionSlug: 'be-more-productive',
      },
      {
        title: i18n.gettext('Watching Videos'),
        collectionSlug: 'watching-videos',
      },
    ];

    return (
      <ul className="Home-SubjectShelf-list">
        {curatedMozillaCollections.map(({ collectionSlug, title }) => (
          <li className="Home-SubjectShelf-list-item" key={collectionSlug}>
            <Link
              to={`/collections/mozilla/${collectionSlug}/`}
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
            <Link to={`/themes/${slug}/`} className="Home-SubjectShelf-link">
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
      _config,
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

    const featuredCollectionsMetadata = getFeaturedCollectionsMetadata(i18n);

    const loading = resultsLoaded === false;

    return (
      <div className="Home">
        <Helmet>
          <meta
            name="description"
            content={i18n.gettext(`Download Firefox extensions and themes.
              They’re like apps for your browser. They can block annoying ads,
              protect passwords, change browser appearance, and more.`)}
          />
        </Helmet>

        <HeadLinks to="/" />

        <span
          className="visually-hidden do-not-remove"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: '<!-- Godzilla of browsers -->' }}
        />

        {errorHandler.renderErrorIfPresent()}

        {_config.get('enableFeatureHomeHeroGuides') ? (
          <HomeHeroGuides />
        ) : (
          <HomeHeroBanner />
        )}

        <Card
          className="Home-SubjectShelf Home-CuratedCollections"
          header={extensionsHeader}
        >
          <div className="Home-SubjectShelf-text-wrapper">
            <h2 className="Home-SubjectShelf-subheading">{extensionsHeader}</h2>
          </div>

          {this.renderCuratedCollections()}
        </Card>

        {(loading || collections[0]) && (
          <FeaturedCollectionCard
            addons={collections[0]}
            className="Home-FeaturedCollection"
            loading={loading}
            {...featuredCollectionsMetadata[0]}
          />
        )}

        {(loading || collections[1]) && (
          <FeaturedCollectionCard
            addons={collections[1]}
            className="Home-FeaturedCollection"
            loading={loading}
            {...featuredCollectionsMetadata[1]}
          />
        )}

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

        <LandingAddonsCard
          addonInstallSource={INSTALL_SOURCE_FEATURED}
          addons={shelves.popularExtensions}
          className="Home-PopularExtensions"
          header={i18n.gettext('Popular extensions')}
          footerText={i18n.gettext('See more popular extensions')}
          footerLink={{
            pathname: '/search/',
            query: {
              addonType: ADDON_TYPE_EXTENSION,
              sort: SEARCH_SORT_POPULAR,
            },
          }}
          loading={loading}
        />

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
    collections: state.home.collections,
    shelves: state.home.shelves,
    resultsLoaded: state.home.resultsLoaded,
  };
}

export default compose(
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ name: 'Home' }),
)(HomeBase);
