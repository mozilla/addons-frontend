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
    // This is a bug; addonTypeOfResults is used in
    // `componentWillReceiveProps()`.
    // eslint-disable-next-line react/no-unused-prop-types
    addonTypeOfResults: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
    errorHandler: PropTypes.object.isRequired,
    featuredAddons: PropTypes.array.isRequired,
    highlyRatedAddons: PropTypes.array.isRequired,
    loading: PropTypes.bool.isRequired,
    popularAddons: PropTypes.array.isRequired,
    i18n: PropTypes.object.isRequired,
    params: PropTypes.objectOf({
      visibleAddonType: PropTypes.string.isRequired,
    }).isRequired,
    // This is a bug; resultsLoaded is used in `componentWillReceiveProps()`.
    // eslint-disable-next-line react/no-unused-prop-types
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

  componentWillReceiveProps(nextProps) {
    const { params } = nextProps;

    if (!apiAddonTypeIsValid(params.visibleAddonType)) {
      log.warn(oneLine`Skipping componentWillReceiveProps() because
        visibleAddonType is invalid: ${params.visibleAddonType}`);
      return;
    }

    this.getLandingDataIfNeeded(nextProps);
    this.setViewContextType(nextProps);
  }

  getLandingDataIfNeeded(nextProps = {}) {
    const {
      addonTypeOfResults,
      errorHandler,
      loading,
      params,
      resultsLoaded,
    } = {
      ...this.props,
      ...nextProps,
    };

    const requestedAddonType = apiAddonType(params.visibleAddonType);

    if (!loading && !errorHandler.hasError() &&
      (!resultsLoaded || addonTypeOfResults !== requestedAddonType)) {
      this.props.dispatch(getLanding({
        addonType: requestedAddonType,
        errorHandlerId: errorHandler.id,
      }));
    }
  }

  setViewContextType(nextProps = {}) {
    const { params } = { ...this.props, ...nextProps };
    const addonType = apiAddonType(params.visibleAddonType);
    this.props.dispatch(setViewContext(addonType));
  }

  contentForType = (visibleAddonType) => {
    const { i18n } = this.props;
    const addonType = apiAddonType(visibleAddonType);

    const featuredFooterLink = {
      pathname: `/${getVisibleAddonType(addonType)}/featured/`,
    };

    const contentForTypes = {
      [ADDON_TYPE_EXTENSION]: {
        featuredHeader: i18n.gettext('Featured extensions'),
        featuredFooterLink,
        featuredFooterText: i18n.gettext('More featured extensions'),
        popularHeader: i18n.gettext('Most popular extensions'),
        popularFooterLink: {
          pathname: '/search/',
          query: { addonType: ADDON_TYPE_EXTENSION, sort: SEARCH_SORT_POPULAR },
        },
        popularFooterText: i18n.gettext('More popular extensions'),
        highlyRatedHeader: i18n.gettext('Top rated extensions'),
        highlyRatedFooterLink: {
          pathname: '/search/',
          query: {
            addonType: ADDON_TYPE_EXTENSION,
            sort: SEARCH_SORT_TOP_RATED,
          },
        },
        highlyRatedFooterText: i18n.gettext('More highly rated extensions'),
      },
      [ADDON_TYPE_THEME]: {
        featuredHeader: i18n.gettext('Featured themes'),
        featuredFooterLink,
        featuredFooterText: i18n.gettext('More featured themes'),
        popularHeader: i18n.gettext('Most popular themes'),
        popularFooterLink: {
          pathname: '/search/',
          query: { addonType: ADDON_TYPE_THEME, sort: SEARCH_SORT_POPULAR },
        },
        popularFooterText: i18n.gettext('More popular themes'),
        highlyRatedHeader: i18n.gettext('Top rated themes'),
        highlyRatedFooterLink: {
          pathname: '/search/',
          query: { addonType: ADDON_TYPE_THEME, sort: SEARCH_SORT_TOP_RATED },
        },
        highlyRatedFooterText: i18n.gettext('More highly rated themes'),
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
          footerText={html.featuredFooterText}
          footerLink={html.featuredFooterLink}
          header={html.featuredHeader}
          loading={loading}
        />
        <LandingAddonsCard
          addons={highlyRatedAddons}
          className="HighlyRatedAddons"
          footerLink={html.highlyRatedFooterLink}
          footerText={html.highlyRatedFooterText}
          header={html.highlyRatedHeader}
          loading={loading}
        />
        <LandingAddonsCard
          addons={popularAddons}
          className="PopularAddons"
          footerLink={html.popularFooterLink}
          footerText={html.popularFooterText}
          header={html.popularHeader}
          loading={loading}
        />
      </div>
    );
  }
}

export function mapStateToProps(state) {
  const { landing } = state;

  return {
    addonTypeOfResults: landing.addonType,
    featuredAddons: landing.featured.results,
    highlyRatedAddons: landing.highlyRated.results,
    loading: landing.loading,
    popularAddons: landing.popular.results,
    resultsLoaded: landing.resultsLoaded && landing.category === null,
  };
}

export default compose(
  withErrorHandler({ name: 'LandingPage' }),
  connect(mapStateToProps),
  translate({ withRef: true }),
)(LandingPageBase);
