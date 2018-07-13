import * as React from 'react';
import config from 'config';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { setViewContext } from 'amo/actions/viewContext';
import CategoryIcon from 'amo/components/CategoryIcon';
import FeaturedCollectionCard from 'amo/components/FeaturedCollectionCard';
import HomeHeroBanner from 'amo/components/HomeHeroBanner';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import Link from 'amo/components/Link';
import { fetchHomeAddons } from 'amo/reducers/home';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  INSTALL_SOURCE_FEATURED,
  VIEW_CONTEXT_HOME,
} from 'core/constants';
import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import { getAddonTypeFilter } from 'core/utils';
import Card from 'ui/components/Card';
import Icon from 'ui/components/Icon';

import './styles.scss';

export const FEATURED_COLLECTIONS = [
  { slug: 'social-media-customization', username: 'mozilla' },
  { slug: 'dynamic-media-downloaders', username: 'mozilla' },
  { slug: 'summer-themes', username: 'mozilla' },
  { slug: 'must-have-media', username: 'mozilla' },
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
      footerText: i18n.gettext(
        'See more social media customization extensions',
      ),
      header: i18n.gettext('Social media customization'),
      isTheme: false,
      ...FEATURED_COLLECTIONS[0],
    },
    {
      footerText: i18n.gettext('See more dynamic downloaders'),
      header: i18n.gettext('Dynamic downloaders'),
      isTheme: false,
      ...FEATURED_COLLECTIONS[1],
    },
    {
      footerText: i18n.gettext('See more summer themes'),
      header: i18n.gettext('Summer themes'),
      isTheme: true,
      ...FEATURED_COLLECTIONS[2],
    },
    {
      footerText: i18n.gettext('See more must-have media extensions'),
      header: i18n.gettext('Must-have media'),
      isTheme: false,
      ...FEATURED_COLLECTIONS[3],
    },
  ];
};

export class HomeBase extends React.Component {
  static propTypes = {
    _config: PropTypes.object,
    dispatch: PropTypes.func.isRequired,
    errorHandler: PropTypes.object.isRequired,
    collections: PropTypes.array.isRequired,
    featuredExtensions: PropTypes.array.isRequired,
    featuredThemes: PropTypes.array.isRequired,
    i18n: PropTypes.object.isRequired,
    includeFeaturedThemes: PropTypes.bool,
    resultsLoaded: PropTypes.bool.isRequired,
  };

  static defaultProps = {
    _config: config,
    includeFeaturedThemes: false,
  };

  componentWillMount() {
    const {
      dispatch,
      errorHandler,
      includeFeaturedThemes,
      resultsLoaded,
    } = this.props;

    dispatch(setViewContext(VIEW_CONTEXT_HOME));

    if (!resultsLoaded) {
      dispatch(
        fetchHomeAddons({
          collectionsToFetch: FEATURED_COLLECTIONS,
          errorHandlerId: errorHandler.id,
          includeFeaturedThemes,
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
      errorHandler,
      collections,
      featuredExtensions,
      featuredThemes,
      i18n,
      includeFeaturedThemes,
      resultsLoaded,
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
        <span
          className="visually-hidden do-not-remove"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: '<!-- Godzilla of browsers -->' }}
        />

        {errorHandler.renderErrorIfPresent()}

        <HomeHeroBanner />

        <Card
          className="Home-SubjectShelf Home-CuratedCollections"
          header={extensionsHeader}
        >
          <div className="Home-SubjectShelf-text-wrapper">
            <h2 className="Home-SubjectShelf-subheading">{extensionsHeader}</h2>
          </div>

          {this.renderCuratedCollections()}
        </Card>

        {includeFeaturedThemes && (
          <LandingAddonsCard
            addonInstallSource={INSTALL_SOURCE_FEATURED}
            addons={featuredThemes}
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

        {(loading || collections[2]) && (
          <FeaturedCollectionCard
            addons={collections[2]}
            className="Home-FeaturedCollection"
            loading={loading}
            {...featuredCollectionsMetadata[2]}
          />
        )}

        <LandingAddonsCard
          addonInstallSource={INSTALL_SOURCE_FEATURED}
          addons={featuredExtensions}
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

        {(loading || collections[3]) && (
          <FeaturedCollectionCard
            addons={collections[3]}
            className="Home-FeaturedCollection"
            loading={loading}
            {...featuredCollectionsMetadata[3]}
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
    featuredExtensions: state.home.featuredExtensions,
    resultsLoaded: state.home.resultsLoaded,
    featuredThemes: state.home.featuredThemes,
  };
}

export default compose(
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ name: 'Home' }),
)(HomeBase);
