/* @flow */
/* global Navigator, navigator */
import makeClassName from 'classnames';
import config from 'config';
import { oneLine } from 'common-tags';
import * as React from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import NestedStatus from 'react-nested-status';
import { compose } from 'redux';

// We have to import these styles first to have them listed first in the final
// CSS file. See: https://github.com/mozilla/addons-frontend/issues/3565
import 'core/fonts/fira.scss';
import 'core/fonts/opensans.scss';
import 'normalize.css/normalize.css';
import './styles.scss';

/* eslint-disable import/first */
import AppBanner from 'amo/components/AppBanner';
import Routes from 'amo/components/Routes';
import ScrollToTop from 'core/components/ScrollToTop';
import { getDjangoBase62 } from 'amo/utils';
import { getErrorComponent } from 'amo/utils/errors';
import Footer from 'amo/components/Footer';
import Header from 'amo/components/Header';
import { logOutUser as logOutUserAction } from 'amo/reducers/users';
import { addChangeListeners } from 'core/addonManager';
import { setUserAgent as setUserAgentAction } from 'core/actions';
import { setInstallState } from 'core/actions/installations';
import { CLIENT_APP_ANDROID, maximumSetTimeoutDelay } from 'core/constants';
import DefaultErrorPage from 'core/components/ErrorPage';
import InfoDialog from 'core/components/InfoDialog';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import type { AppState } from 'amo/store';
import type { DispatchFunc } from 'core/types/redux';
import type { ReactRouterLocationType } from 'core/types/router';
import type { InstalledAddon } from 'core/reducers/installations';
import type { I18nType } from 'core/types/i18n';
/* eslint-enable import/first */

interface MozNavigator extends Navigator {
  mozAddonManager?: Object;
}

// This function assumed the home page will no more than two parts in its path,
// whereas any page other than the home page will have more than two.
// Every path in the app starts with /lang/application/ (e.g., /en-US/firefox/)
// which is what this logic is based upon.
export const isHomePage = (location: ReactRouterLocationType) => {
  return location.pathname.split('/').filter(Boolean).length <= 2;
};

type Props = {|
  _config: typeof config,
  _isHomePage: typeof isHomePage,
  ErrorPage: typeof DefaultErrorPage,
  FooterComponent: typeof Footer,
  InfoDialogComponent: typeof InfoDialog,
  HeaderComponent: typeof Header,
  _addChangeListeners: (callback: Function, mozAddonManager?: Object) => void,
  _navigator: typeof navigator,
  authToken?: string,
  authTokenValidFor?: number,
  clientApp: string,
  handleGlobalEvent: () => void,
  i18n: I18nType,
  lang: string,
  location: ReactRouterLocationType,
  logOutUser: () => void,
  mozAddonManager: $PropertyType<MozNavigator, 'mozAddonManager'>,
  setUserAgent: (userAgent: string) => void,
  userAgent: string,
|};

export class AppBase extends React.Component<Props> {
  header: React.ElementRef<typeof Header>;

  scheduledLogout: TimeoutID;

  static defaultProps = {
    _config: config,
    _isHomePage: isHomePage,
    ErrorPage: DefaultErrorPage,
    FooterComponent: Footer,
    InfoDialogComponent: InfoDialog,
    HeaderComponent: Header,
    _addChangeListeners: addChangeListeners,
    _navigator: typeof navigator !== 'undefined' ? navigator : null,
    authTokenValidFor: config.get('authTokenValidFor'),
    mozAddonManager: config.get('server')
      ? {}
      : (navigator: MozNavigator).mozAddonManager,
    userAgent: null,
  };

  componentDidMount() {
    const {
      _addChangeListeners,
      _navigator,
      authToken,
      handleGlobalEvent,
      mozAddonManager,
      setUserAgent,
      userAgent,
    } = this.props;

    // Use addonManager.addChangeListener to setup and filter events.
    _addChangeListeners(handleGlobalEvent, mozAddonManager);

    // If userAgent isn't set in state it could be that we couldn't get one
    // from the request headers on our first (server) request. If that's the
    // case we try to load them from navigator.
    if (!userAgent && _navigator && _navigator.userAgent) {
      log.info(
        'userAgent not in state on App load; using navigator.userAgent.',
      );
      setUserAgent(_navigator.userAgent);
    }

    if (authToken) {
      this.setLogOutTimer(authToken);
    }
  }

  componentDidUpdate() {
    const { authToken } = this.props;

    if (authToken) {
      this.setLogOutTimer(authToken);
    }
  }

  setLogOutTimer(authToken: string) {
    const { authTokenValidFor, logOutUser } = this.props;

    const expiresAt = authTokenValidFor;
    if (!expiresAt) {
      log.warn(oneLine`configured authTokenValidFor is falsey, not
        checking for auth expiration`);
      return;
    }

    const parts = authToken.split(':');
    const encodedTimestamp = parts[1];
    const base62 = getDjangoBase62();
    let createdAt;
    try {
      // This is a UTC Unix timestamp.
      createdAt = base62.decode(encodedTimestamp);
    } catch (base62Error) {
      log.error(
        `Auth token "${encodedTimestamp}" triggered this base62 error: "${base62Error}"`,
      );
      return;
    }
    // If the encoded timestamp was malformed it will be NaN, 0 or negative.
    if (Number.isNaN(createdAt) || createdAt <= 0) {
      log.error(oneLine`Got an invalid timestamp from auth token;
        encoded value: ${encodedTimestamp}; decoded value: ${createdAt}`);
      return;
    }
    const readableCreatedAt = new Date(createdAt * 1000).toString();
    log.debug(`Auth token was created at: ${readableCreatedAt}`);

    // Get the current UTC Unix timestamp.
    const now = Date.now() / 1000;
    // Set the expiration time in seconds.
    const expirationTime = createdAt + expiresAt - now;
    const readableExpiration = new Date(
      (now + expirationTime) * 1000,
    ).toString();
    log.debug(`Auth token expires at ${readableExpiration}`);

    const setTimeoutDelay = expirationTime * 1000;
    if (setTimeoutDelay >= maximumSetTimeoutDelay) {
      log.debug(oneLine`No logout was scheduled because the expiration
        exceeded the setTimeout limit`);
      return;
    }
    if (this.scheduledLogout) {
      clearTimeout(this.scheduledLogout);
    }
    log.info('Setting a logout timer for when the token expires');
    this.scheduledLogout = setTimeout(() => {
      log.info('Logging out because the auth token has expired');
      logOutUser();
    }, setTimeoutDelay);
  }

  render() {
    const {
      _config,
      _isHomePage,
      ErrorPage,
      FooterComponent,
      HeaderComponent,
      InfoDialogComponent,
      clientApp,
      i18n,
      lang,
      location,
    } = this.props;

    const i18nValues = {
      locale: lang,
    };

    let defaultTitle = i18n.sprintf(
      i18n.gettext('Add-ons for Firefox (%(locale)s)'),
      i18nValues,
    );
    let titleTemplate = i18n.sprintf(
      i18n.gettext('%(title)s – Add-ons for Firefox (%(locale)s)'),
      // We inject `%s` as a named argument to avoid localizer mistakes. Helmet
      // will replace `%s` by the title supplied in other pages.
      { ...i18nValues, title: '%s' },
    );

    if (clientApp === CLIENT_APP_ANDROID) {
      defaultTitle = i18n.sprintf(
        i18n.gettext('Add-ons for Firefox Android (%(locale)s)'),
        i18nValues,
      );
      titleTemplate = i18n.sprintf(
        i18n.gettext('%(title)s – Add-ons for Firefox Android (%(locale)s)'),
        // We inject `%s` as a named argument to avoid localizer mistakes.
        // Helmet will replace `%s` by the title supplied in other pages.
        { ...i18nValues, title: '%s' },
      );
    }

    return (
      <NestedStatus code={200}>
        <ScrollToTop>
          <div className="App-amo">
            <Helmet defaultTitle={defaultTitle} titleTemplate={titleTemplate} />

            <InfoDialogComponent />

            <HeaderComponent
              isHomePage={_isHomePage(location)}
              location={location}
              ref={(ref) => {
                this.header = ref;
              }}
            />

            <div className="App-content">
              <div
                className={makeClassName(
                  _isHomePage(location)
                    ? 'App-content-wrapper-homepage'
                    : 'App-content-wrapper',
                )}
              >
                {// Exclude the AppBanner from the home page if it will be
                // included via HeroRecommendation.
                (!_isHomePage(location) ||
                  !_config.get('enableFeatureHeroRecommendation')) && (
                  <AppBanner />
                )}
                <ErrorPage getErrorComponent={getErrorComponent}>
                  <Routes />
                </ErrorPage>
              </div>
            </div>

            <FooterComponent />
          </div>
        </ScrollToTop>
      </NestedStatus>
    );
  }
}

export const mapStateToProps = (state: AppState) => ({
  authToken: state.api && state.api.token,
  clientApp: state.api.clientApp,
  lang: state.api.lang,
  userAgent: state.api.userAgent,
});

export function mapDispatchToProps(dispatch: DispatchFunc) {
  return {
    logOutUser() {
      dispatch(logOutUserAction());
    },
    handleGlobalEvent(payload: InstalledAddon) {
      dispatch(setInstallState(payload));
    },
    setUserAgent(userAgent: string) {
      dispatch(setUserAgentAction(userAgent));
    },
  };
}

const App: React.ComponentType<Props> = compose(
  withRouter,
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  translate(),
)(AppBase);

export default App;
