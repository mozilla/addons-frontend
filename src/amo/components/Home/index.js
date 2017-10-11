import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { setViewContext } from 'amo/actions/viewContext';
import HomeCarousel from 'amo/components/HomeCarousel';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import Link from 'amo/components/Link';
import { fetchHomeAddons } from 'amo/reducers/home';
import {
  ADDON_TYPE_EXTENSION,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  SEARCH_SORT_POPULAR,
  VIEW_CONTEXT_HOME,
} from 'core/constants';
import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import Card from 'ui/components/Card';

import './styles.scss';


export const CategoryLink = ({ children, name, slug, type }) => {
  return (
    <li className={classNames('Home-category-li', `Home-${name}`)}>
      <Link to={`/${type}/${slug}/`} className="Home-category-link">
        <span>{children}</span>
      </Link>
    </li>
  );
};

CategoryLink.propTypes = {
  children: PropTypes.node.isRequired,
  name: PropTypes.string.isRequired,
  slug: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
};

export const ExtensionLink = (props) => {
  return <CategoryLink type="extensions" {...props} />;
};

export const ThemeLink = (props) => {
  return <CategoryLink type="themes" {...props} />;
};

export const FEATURED_COLLECTION_SLUG = 'change-up-your-tabs';
export const FEATURED_COLLECTION_USER = 'mozilla';

export class HomeBase extends React.Component {
  static propTypes = {
    clientApp: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
    errorHandler: PropTypes.object.isRequired,
    featuredCollection: PropTypes.array.isRequired,
    featuredThemes: PropTypes.array.isRequired,
    i18n: PropTypes.object.isRequired,
    popularExtensions: PropTypes.array.isRequired,
    resultsLoaded: PropTypes.bool.isRequired,
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

  extensionsCategoriesForClientApp() {
    const { clientApp, i18n } = this.props;

    let linkHTML = null;

    if (clientApp === CLIENT_APP_ANDROID) {
      linkHTML = (
        <ul className="Home-category-list">
          <ExtensionLink name="block-ads" slug="security-privacy">
            {i18n.gettext('Block ads')}
          </ExtensionLink>
          <ExtensionLink name="screenshot" slug="photos-media">
            {i18n.gettext('Screenshot')}
          </ExtensionLink>
          <ExtensionLink name="find-news" slug="feeds-news-blogging">
            {i18n.gettext('Find news')}
          </ExtensionLink>
          <ExtensionLink name="shop-online" slug="shopping">
            {i18n.gettext('Shop online')}
          </ExtensionLink>
          <ExtensionLink name="be-social" slug="social-networking">
            {i18n.gettext('Be social')}
          </ExtensionLink>
          <ExtensionLink name="play-games" slug="sports-games">
            {i18n.gettext('Play games')}
          </ExtensionLink>
        </ul>
      );
    }

    if (clientApp === CLIENT_APP_FIREFOX) {
      linkHTML = (
        <ul className="Home-category-list">
          <ExtensionLink name="block-ads" slug="privacy-security">
            {i18n.gettext('Block ads')}
          </ExtensionLink>
          <ExtensionLink name="screenshot" slug="photos-music-videos">
            {i18n.gettext('Screenshot')}
          </ExtensionLink>
          <ExtensionLink name="find-news" slug="feeds-news-blogging">
            {i18n.gettext('Find news')}
          </ExtensionLink>
          <ExtensionLink name="shop-online" slug="shopping">
            {i18n.gettext('Shop online')}
          </ExtensionLink>
          <ExtensionLink name="be-social" slug="social-communication">
            {i18n.gettext('Be social')}
          </ExtensionLink>
          <ExtensionLink name="play-games" slug="games-entertainment">
            {i18n.gettext('Play games')}
          </ExtensionLink>
        </ul>
      );
    }

    return linkHTML;
  }

  themesCategoriesForClientApp() {
    const { i18n } = this.props;

    return (
      <ul className="Home-category-list">
        <ThemeLink name="wild" slug="nature">{i18n.gettext('Wild')}</ThemeLink>
        <ThemeLink name="abstract" slug="abstract">{i18n.gettext('Abstract')}</ThemeLink>
        <ThemeLink name="holiday" slug="holiday">{i18n.gettext('Holiday')}</ThemeLink>
        <ThemeLink name="scenic" slug="scenery">{i18n.gettext('Scenic')}</ThemeLink>
        <ThemeLink name="sporty" slug="sports">{i18n.gettext('Sporty')}</ThemeLink>
        <ThemeLink name="solid" slug="solid">{i18n.gettext('Solid')}</ThemeLink>
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
    } = this.props;

    return (
      <div className="Home">
        {errorHandler.renderErrorIfPresent()}

        <HomeCarousel />

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

        <LandingAddonsCard
          addons={featuredThemes}
          className="Home-FeaturedThemes"
          header={i18n.gettext('Featured themes')}
          footerText={i18n.gettext('More featured themes')}
          footerLink={{ pathname: '/themes/featured/' }}
          loading={resultsLoaded === false}
        />

        <Card
          className="Home-category-card Home-category-card--extensions"
          footerLink={<Link to="/extensions/">
            {i18n.gettext('Browse all extensions')}
          </Link>}
        >
          <div className="Home-text-wrapper">
            <h2 className="Home-subheading">
              {i18n.gettext('You can change how Firefox works…')}
            </h2>
            <p className="Home-description">
              {i18n.gettext(`Explore powerful tools and features to customize
                Firefox and make the browser all your own.`)}
            </p>
          </div>

          {this.extensionsCategoriesForClientApp()}
        </Card>

        <Card
          className="Home-category-card Home-category-card--themes"
          footerLink={<Link to="/themes/">
            {i18n.gettext('Browse all themes')}
          </Link>}
        >
          <div className="Home-text-wrapper">
            <h2 className="Home-subheading">
              {i18n.gettext('…or what it looks like')}
            </h2>
            <p className="Home-description">
              {i18n.gettext(
                `Change your browser's appearance. Choose from thousands of
                themes to give Firefox the look you want.`)}
            </p>
          </div>

          {this.themesCategoriesForClientApp()}
        </Card>
      </div>
    );
  }
}

export function mapStateToProps(state) {
  return {
    clientApp: state.api.clientApp,
    featuredCollection: state.home.featuredCollection,
    featuredThemes: state.home.featuredThemes,
    popularExtensions: state.home.popularExtensions,
    resultsLoaded: state.home.resultsLoaded,
  };
}

export default compose(
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ name: 'Home' }),
)(HomeBase);
