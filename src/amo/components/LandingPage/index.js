import classNames from 'classnames';
import { oneLine } from 'common-tags';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { setViewContext } from 'amo/actions/viewContext';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import NotFound from 'amo/components/ErrorPage/NotFound';
import Categories from 'amo/components/Categories';
import { loadLandingAddons } from 'amo/utils';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_TOP_RATED,
} from 'core/constants';
import { AddonTypeNotFound } from 'core/errors';
import log from 'core/logger';
import {
  apiAddonType as getApiAddonType,
  safeAsyncConnect,
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
    apiAddonType: PropTypes.func.isRequired,
    contentForType: PropTypes.func,
    dispatch: PropTypes.func.isRequired,
    featuredAddons: PropTypes.array,
    highlyRatedAddons: PropTypes.array,
    popularAddons: PropTypes.array,
    i18n: PropTypes.object.isRequired,
    params: PropTypes.objectOf({
      visibleAddonType: PropTypes.string.isRequired,
    }).isRequired,
  }

  static defaultProps = {
    apiAddonType: getApiAddonType,
    contentForType: null,
  }

  componentWillMount() {
    this.setViewContextType();
  }

  componentDidUpdate() {
    this.setViewContextType();
  }

  setViewContextType() {
    const { apiAddonType, dispatch, params } = this.props;

    // This error is handled properly in `render()`, so we just ignore it
    // and log here. The reason for this is this component gets loaded for
    // what should be a 404 (/not-a-page/) because of limitations in our
    // current router. See:
    // https://github.com/mozilla/addons-frontend/issues/2161
    try {
      const addonType = apiAddonType(params.visibleAddonType);
      dispatch(setViewContext(addonType));
    } catch (err) {
      if (err instanceof AddonTypeNotFound) {
        log.info('AddonTypeNotFound in setViewContextType()', err);
      } else {
        throw err;
      }
    }
  }

  contentForType = (visibleAddonType) => {
    const { apiAddonType, i18n } = this.props;
    const addonType = apiAddonType(visibleAddonType);

    const contentForTypes = {
      [ADDON_TYPE_EXTENSION]: {
        featuredHeader: i18n.gettext('Featured extensions'),
        featuredFooterLink: {
          pathname: `/${getVisibleAddonType(ADDON_TYPE_EXTENSION)}/featured/`,
        },
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
        featuredFooterLink: {
          pathname: `/${getVisibleAddonType(ADDON_TYPE_THEME)}/featured/`,
        },
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
      featuredAddons,
      highlyRatedAddons,
      popularAddons,
      i18n,
    } = this.props;
    const { visibleAddonType } = this.props.params;
    const contentForType = this.props.contentForType || this.contentForType;

    // TODO: Remove this code and throw a proper error once
    // https://github.com/mozilla/addons-frontend/issues/2161 is fixed.
    // This is only used because the router will pass any top-level URL
    // through to this component because of limitations in our current router.
    let content;
    try {
      content = contentForType(visibleAddonType);
    } catch (err) {
      if (err instanceof AddonTypeNotFound) {
        log.info('Rendering <NotFound /> for error:', err);
        return <NotFound />;
      }

      throw err;
    }

    const { addonType, html } = content;
    const headingText = {
      [ADDON_TYPE_THEME]: i18n.gettext('Themes'),
      [ADDON_TYPE_EXTENSION]: i18n.gettext('Extensions'),
    };
    const contentText = {
      [ADDON_TYPE_THEME]: i18n.gettext(oneLine`Change your browser's
        appearance. Choose from thousands of themes to give Firefox the look
        you want.`),
      [ADDON_TYPE_EXTENSION]: i18n.gettext(oneLine`Install powerful tools that
        make browsing faster and safer, add-ons make your browser yours.`),
    };

    return (
      <div className={classNames('LandingPage', `LandingPage--${addonType}`)}>
        <div className="LandingPage-header">
          {this.icon(addonType)}

          <div className="LandingPage-header-text">
            <h1 className="LandingPage-addonType-name">
              {headingText[addonType]}
            </h1>
            <p className="LandingPage-heading-content">
              {contentText[addonType]}
            </p>
          </div>
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
        />
        <LandingAddonsCard
          addons={highlyRatedAddons}
          className="HighlyRatedAddons"
          footerLink={html.highlyRatedFooterLink}
          footerText={html.highlyRatedFooterText}
          header={html.highlyRatedHeader}
        />
        <LandingAddonsCard
          addons={popularAddons}
          className="PopularAddons"
          footerLink={html.popularFooterLink}
          footerText={html.popularFooterText}
          header={html.popularHeader}
        />
      </div>
    );
  }
}

export function mapStateToProps(state) {
  return {
    featuredAddons: state.landing.featured.results,
    highlyRatedAddons: state.landing.highlyRated.results,
    popularAddons: state.landing.popular.results,
    // TODO: add state.landing.loading
  };
}

export default compose(
  safeAsyncConnect([{ promise: loadLandingAddons }]),
  connect(mapStateToProps),
  translate({ withRef: true }),
)(LandingPageBase);
