import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { setViewContext } from 'amo/actions/viewContext';
import CategoryIcon from 'amo/components/CategoryIcon';
import HomeHeroBanner from 'amo/components/HomeHeroBanner';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import Link from 'amo/components/Link';
import { fetchHomeAddons } from 'amo/reducers/home';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  SEARCH_SORT_POPULAR,
  VIEW_CONTEXT_HOME,
} from 'core/constants';
import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import Card from 'ui/components/Card';
import Icon from 'ui/components/Icon';

import './styles.scss';


export const COLLECTIONS_TO_FETCH = [
  { slug: 'privacy-matters', user: 'mozilla' },
  { slug: 're-imagine-search', user: 'mozilla' },
  { slug: 'addonsofthemonth', user: 'mozilla' },
];

export class HomeBase extends React.Component {
  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    errorHandler: PropTypes.object.isRequired,
    collections: PropTypes.array.isRequired,
    featuredExtensions: PropTypes.array.isRequired,
    popularThemes: PropTypes.array.isRequired,
    i18n: PropTypes.object.isRequired,
    resultsLoaded: PropTypes.bool.isRequired,
  }

  componentWillMount() {
    const { dispatch, errorHandler, resultsLoaded } = this.props;

    dispatch(setViewContext(VIEW_CONTEXT_HOME));

    if (!resultsLoaded) {
      dispatch(fetchHomeAddons({
        errorHandlerId: errorHandler.id,
        collectionsToFetch: COLLECTIONS_TO_FETCH,
      }));
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
          <li
            className="Home-SubjectShelf-list-item"
            key={collectionSlug}
          >
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
      popularThemes,
      i18n,
      resultsLoaded,
    } = this.props;

    // translators: The ending ellipsis alludes to a row of icons for each type
    // of extension.
    const extensionsHeader = i18n.gettext(`Customize the way Firefox works with
      extensions. Are you interested in…`);
    const themesHeader = i18n.gettext(`Change the way Firefox looks with
      themes.`);

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
            <h2 className="Home-SubjectShelf-subheading">
              {extensionsHeader}
            </h2>
          </div>

          {this.renderCuratedCollections()}
        </Card>

        <LandingAddonsCard
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
          loading={resultsLoaded === false}
        />

        <LandingAddonsCard
          addons={collections[0]}
          className="Home-FeaturedCollection"
          header={i18n.gettext('Privacy tools')}
          footerText={i18n.gettext('See more privacy tools')}
          footerLink={
            `/collections/${COLLECTIONS_TO_FETCH[0].user}/${COLLECTIONS_TO_FETCH[0].slug}/`
          }
          loading={resultsLoaded === false}
        />

        <LandingAddonsCard
          addons={popularThemes}
          className="Home-PopularThemes"
          header={i18n.gettext('Popular themes')}
          footerText={i18n.gettext('See more popular themes')}
          footerLink={{
            pathname: '/search/',
            query: {
              addonType: ADDON_TYPE_THEME,
              sort: SEARCH_SORT_POPULAR,
            },
          }}
          loading={resultsLoaded === false}
        />

        <LandingAddonsCard
          addons={collections[1]}
          className="Home-FeaturedCollection"
          header={i18n.gettext('Re-imagine search')}
          footerText={i18n.gettext('See more search extensions')}
          footerLink={
            `/collections/${COLLECTIONS_TO_FETCH[1].user}/${COLLECTIONS_TO_FETCH[1].slug}/`
          }
          loading={resultsLoaded === false}
        />

        <LandingAddonsCard
          addons={collections[2]}
          className="Home-FeaturedCollection"
          header={i18n.gettext(`February’s new featured extensions`)}
          footerText={i18n.gettext('See all the new featured extensions')}
          footerLink={
            `/collections/${COLLECTIONS_TO_FETCH[2].user}/${COLLECTIONS_TO_FETCH[2].slug}/`
          }
          loading={resultsLoaded === false}
        />

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
      </div>
    );
  }
}

export function mapStateToProps(state) {
  return {
    collections: state.home.collections,
    featuredExtensions: state.home.featuredExtensions,
    popularThemes: state.home.popularThemes,
    resultsLoaded: state.home.resultsLoaded,
  };
}

export default compose(
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ name: 'Home' }),
)(HomeBase);
