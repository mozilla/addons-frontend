import classNames from 'classnames';
import { oneLine } from 'common-tags';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { getLanding } from 'amo/actions/landing';
import { setViewContext } from 'amo/actions/viewContext';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import NotFound from 'amo/components/ErrorPage/NotFound';
import Categories from 'amo/components/Categories';
import Link from 'amo/components/Link';
import SearchLink from 'amo/components/SearchLink';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  SEARCH_SORT_POPULAR,
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
import Icon from 'ui/components/Icon/index';

import './styles.scss';


const ICON_MAP = {
  [ADDON_TYPE_EXTENSION]: 'multitasking-octopus',
  [ADDON_TYPE_THEME]: 'artistic-unicorn',
};

export class LandingPageBase extends React.Component {
  static propTypes = {
    addonTypeOfResults: PropTypes.string,
    dispatch: PropTypes.func.isRequired,
    errorHandler: PropTypes.object.isRequired,
    featuredAddons: PropTypes.array,
    highlyRatedAddons: PropTypes.array,
    loading: PropTypes.bool.isRequired,
    popularAddons: PropTypes.array,
    i18n: PropTypes.object.isRequired,
    params: PropTypes.objectOf({
      visibleAddonType: PropTypes.string.isRequired,
    }).isRequired,
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

  componentDidUpdate() {
    const { params } = this.props;
    if (!apiAddonTypeIsValid(params.visibleAddonType)) {
      log.warn(oneLine`Skipping componentDidUpdate() because visibleAddonType
        is invalid: ${params.visibleAddonType}`);
      return;
    }

    this.getLandingDataIfNeeded();
    this.setViewContextType();
  }

  getLandingDataIfNeeded() {
    const {
      addonTypeOfResults,
      dispatch,
      errorHandler,
      loading,
      params,
      resultsLoaded,
    } = this.props;

    const requestedAddonType = apiAddonType(params.visibleAddonType);

    if (!loading && !errorHandler.hasError() &&
        (!resultsLoaded || addonTypeOfResults !== requestedAddonType)) {
      dispatch(getLanding({
        addonType: requestedAddonType,
        errorHandlerId: errorHandler.id,
      }));
    }
  }

  setViewContextType() {
    const { dispatch, params } = this.props;
    const addonType = apiAddonType(params.visibleAddonType);
    dispatch(setViewContext(addonType));
  }

  contentForType = (visibleAddonType) => {
    const { i18n } = this.props;
    const addonType = apiAddonType(visibleAddonType);

    const contentForTypes = {
      [ADDON_TYPE_EXTENSION]: {
        featuredHeader: i18n.gettext('Featured extensions'),
        featuredFooter: (
          <Link to={`/${getVisibleAddonType(ADDON_TYPE_EXTENSION)}/featured/`}>
            {i18n.gettext('More featured extensions')}
          </Link>
        ),
        popularHeader: i18n.gettext('Most popular extensions'),
        popularFooter: (
          <SearchLink
            filters={{
              addonType: ADDON_TYPE_EXTENSION,
              sort: SEARCH_SORT_POPULAR,
            }}
          >
            {i18n.gettext('More popular extensions')}
          </SearchLink>
        ),
        highlyRatedHeader: i18n.gettext('Top rated extensions'),
        highlyRatedFooter: (
          <SearchLink
            filters={{
              addonType: ADDON_TYPE_EXTENSION,
              sort: SEARCH_SORT_TOP_RATED,
            }}
          >
            {i18n.gettext('More highly rated extensions')}
          </SearchLink>
        ),
      },
      [ADDON_TYPE_THEME]: {
        featuredHeader: i18n.gettext('Featured themes'),
        featuredFooter: (
          <Link to={`/${getVisibleAddonType(ADDON_TYPE_THEME)}/featured/`}>
            {i18n.gettext('More featured themes')}
          </Link>
        ),
        popularHeader: i18n.gettext('Most popular themes'),
        popularFooter: (
          <SearchLink
            filters={{
              addonType: ADDON_TYPE_THEME,
              sort: SEARCH_SORT_POPULAR,
            }}
          >
            {i18n.gettext('More popular themes')}
          </SearchLink>
        ),
        highlyRatedHeader: i18n.gettext('Top rated themes'),
        highlyRatedFooter: (
          <SearchLink
            filters={{
              addonType: ADDON_TYPE_THEME,
              sort: SEARCH_SORT_TOP_RATED,
            }}
          >
            {i18n.gettext('More highly rated themes')}
          </SearchLink>
        ),
      },
    };

    return { addonType, html: contentForTypes[addonType] };
  }

  icon(addonType) {
    return (
      <Icon
        className={classNames(
          'LandingPage-icon',
          `LandingPage-icon--${addonType}`,
        )}
        name={ICON_MAP[addonType]}
      />
    );
  }

  render() {
    const {
      errorHandler,
      featuredAddons,
      highlyRatedAddons,
      loading,
      popularAddons,
      i18n,
    } = this.props;
    const { visibleAddonType } = this.props.params;

    if (!apiAddonTypeIsValid(visibleAddonType)) {
      log.warn(oneLine`Rendering 404 because visibleAddonType
        is invalid: ${visibleAddonType}`);
      return <NotFound />;
    }

    const content = this.contentForType(visibleAddonType);

    const { addonType, html } = content;
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
      <div className={classNames('LandingPage', `LandingPage--${addonType}`)}>
        {errorHandler.renderErrorIfPresent()}
        <div className="LandingPage-header">
          <div className="LandingPage-header-text">
            <h1 className="LandingPage-addonType-name">
              {headingText[addonType]}
            </h1>
            <p className="LandingPage-heading-content">
              {contentText[addonType]}
            </p>
          </div>
          {this.icon(addonType)}
        </div>

        <Categories addonType={addonType} />

        <Button
          className="LandingPage-button Button--light"
          to={`/${getVisibleAddonType(addonType)}/categories/`}
        >
          {i18n.gettext('Explore all categories')}
        </Button>

        <LandingAddonsCard
          addons={featuredAddons}
          className="FeaturedAddons"
          footerLink={html.featuredFooter}
          header={html.featuredHeader}
          loading={loading}
        />
        <LandingAddonsCard
          addons={highlyRatedAddons}
          className="HighlyRatedAddons"
          footerLink={html.highlyRatedFooter}
          header={html.highlyRatedHeader}
          loading={loading}
        />
        <LandingAddonsCard
          addons={popularAddons}
          className="PopularAddons"
          footerLink={html.popularFooter}
          header={html.popularHeader}
          loading={loading}
        />
      </div>
    );
  }
}

export function mapStateToProps(state) {
  return {
    addonTypeOfResults: state.landing.addonType,
    featuredAddons: state.landing.featured.results,
    highlyRatedAddons: state.landing.highlyRated.results,
    loading: state.landing.loading,
    popularAddons: state.landing.popular.results,
    resultsLoaded: state.landing.resultsLoaded,
  };
}

export default compose(
  withErrorHandler({ name: 'LandingPage' }),
  connect(mapStateToProps),
  translate({ withRef: true }),
)(LandingPageBase);
