import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { setViewContext } from 'amo/actions/viewContext';
import HomeHeroBanner from 'amo/components/HomeHeroBanner';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import Link from 'amo/components/Link';
import { fetchHomeAddons } from 'amo/reducers/home';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_TRENDING,
  VIEW_CONTEXT_HOME,
} from 'core/constants';
import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import Card from 'ui/components/Card';
import Icon from 'ui/components/Icon';

import './styles.scss';


export const FEATURED_COLLECTION_SLUG = 'change-up-your-tabs';
export const FEATURED_COLLECTION_USER = 'mozilla';

export class HomeBase extends React.Component {
  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    errorHandler: PropTypes.object.isRequired,
    featuredCollection: PropTypes.array.isRequired,
    featuredThemes: PropTypes.array.isRequired,
    i18n: PropTypes.object.isRequired,
    popularExtensions: PropTypes.array.isRequired,
    resultsLoaded: PropTypes.bool.isRequired,
    upAndComingExtensions: PropTypes.array.isRequired,
  }

  componentWillMount() {
    const { dispatch, errorHandler, resultsLoaded } = this.props;

    dispatch(setViewContext(VIEW_CONTEXT_HOME));

    if (!resultsLoaded) {
      dispatch(fetchHomeAddons({
        errorHandlerId: errorHandler.id,
        featuredCollectionSlug: FEATURED_COLLECTION_SLUG,
        featuredCollectionUser: FEATURED_COLLECTION_USER,
      }));
    }
  }

  renderCuratedCollections() {
    const { i18n } = this.props;
    const curatedMozillaCollections = [
      {
        title: i18n.gettext('Ad blockers'),
        collectionSlug: 'ad-blockers',
      },
      {
        title: i18n.gettext('Password managers'),
        collectionSlug: 'password-managers',
      },
      {
        title: i18n.gettext('Bookmarks'),
        collectionSlug: 'bookmark-managers',
      },
      {
        title: i18n.gettext('Watching Videos'),
        collectionSlug: 'watching-videos',
      },
    ];

    return (
      <ul className="Home-CuratedCollections-list">
        {curatedMozillaCollections.map(({ collectionSlug, title }) => (
          <li
            className="Home-CuratedCollections-list-item"
            key={collectionSlug}
          >
            <Link
              to={`/collections/mozilla/${collectionSlug}/`}
              className="Home-CuratedCollections-link"
            >
              <Icon name={`Home-CuratedCollections-${collectionSlug}`} />
              {title}
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  render() {
    const {
      errorHandler,
      featuredCollection,
      featuredThemes,
      i18n,
      popularExtensions,
      resultsLoaded,
      upAndComingExtensions,
    } = this.props;

    return (
      <div className="Home">
        {errorHandler.renderErrorIfPresent()}

        <HomeHeroBanner />

        <LandingAddonsCard
          addons={popularExtensions}
          className="Home-PopularExtensions"
          header={i18n.gettext('Most popular extensions')}
          footerText={i18n.gettext('More popular extensions')}
          footerLink={{
            pathname: '/search/',
            query: {
              addonType: ADDON_TYPE_EXTENSION,
              sort: SEARCH_SORT_POPULAR,
            },
          }}
          loading={resultsLoaded === false}
        />

        <LandingAddonsCard
          addons={featuredCollection}
          className="Home-FeaturedCollection"
          header={i18n.gettext('Change your tabs')}
          footerText={i18n.gettext('Browse this collection')}
          footerLink={{ pathname:
            `/collections/${FEATURED_COLLECTION_USER}/${FEATURED_COLLECTION_SLUG}/`,
          }}
          loading={resultsLoaded === false}
        />

        <Card
          className="Home-CuratedCollections"
          header={i18n.gettext("I'm interested in…")}
        >
          {this.renderCuratedCollections()}
        </Card>

        <LandingAddonsCard
          addons={featuredThemes}
          className="Home-FeaturedThemes"
          header={i18n.gettext('Featured themes')}
          footerText={i18n.gettext('More featured themes')}
          footerLink={{
            pathname: '/search/',
            query: {
              addonType: ADDON_TYPE_THEME,
              featured: true,
            },
          }}
          loading={resultsLoaded === false}
        />

        <LandingAddonsCard
          addons={upAndComingExtensions}
          className="Home-UpAndComingExtensions"
          header={i18n.gettext('Up & Coming')}
          footerText={i18n.gettext('More trending extensions')}
          footerLink={{
            pathname: '/search/',
            query: {
              addonType: ADDON_TYPE_EXTENSION,
              sort: SEARCH_SORT_TRENDING,
            },
          }}
          loading={resultsLoaded === false}
        />
      </div>
    );
  }
}

export function mapStateToProps(state) {
  return {
    featuredCollection: state.home.featuredCollection,
    featuredThemes: state.home.featuredThemes,
    popularExtensions: state.home.popularExtensions,
    resultsLoaded: state.home.resultsLoaded,
    upAndComingExtensions: state.home.upAndComingExtensions,
  };
}

export default compose(
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ name: 'Home' }),
)(HomeBase);
