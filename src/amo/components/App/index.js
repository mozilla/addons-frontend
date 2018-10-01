/* @flow */
/* global Event, Navigator, Node, navigator, window */
import config from 'config';
import { oneLine } from 'common-tags';
import * as React from 'react';
import cookie from 'react-cookie';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import NestedStatus from 'react-nested-status';
import { compose } from 'redux';

// We have to import these styles first to have them listed first in the final
// CSS file. See: https://github.com/mozilla/addons-frontend/issues/3565
import 'core/fonts/fira.scss';
import 'core/fonts/opensans.scss';
import './styles.scss';

/* eslint-disable import/first */
import Routes from 'amo/components/Routes';
import ScrollToTop from 'core/components/ScrollToTop';
import { getDjangoBase62, getErrorComponent } from 'amo/utils';
import Footer from 'amo/components/Footer';
import Header from 'amo/components/Header';
import { logOutUser as logOutUserAction } from 'amo/reducers/users';
import { addChangeListeners } from 'core/addonManager';
import { setUserAgent as setUserAgentAction } from 'core/actions';
import { setInstallState } from 'core/actions/installations';
import {
  CLIENT_APP_ANDROID,
  VIEW_CONTEXT_HOME,
  maximumSetTimeoutDelay,
} from 'core/constants';
import DefaultErrorPage from 'core/components/ErrorPage';
import SurveyNotice from 'core/components/SurveyNotice';
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

type Props = {|
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
  isHomePage: boolean,
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

  componentWillReceiveProps(nextProps: Props) {
    const { authToken } = nextProps;
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
    // If the encoded timestamp was malformed it will be 0 or negative.
    if (createdAt <= 0) {
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

  onViewDesktop = (
    event: Event,
    {
      _window = window,
      _cookie = cookie,
    }: {|
      _window: typeof window,
      _cookie: typeof cookie,
    |} = {},
  ) => {
    event.preventDefault();
    if (_window && _window.location) {
      _cookie.save('mamo', 'off', { path: '/' });
      _window.location.reload();
    }
  };

  render() {
    const {
      ErrorPage,
      FooterComponent,
      HeaderComponent,
      InfoDialogComponent,
      clientApp,
      i18n,
      isHomePage,
      lang,
      location,
    } = this.props;

    const query = location.query ? location.query.q : null;
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
        i18n.gettext('Add-ons for Android (%(locale)s)'),
        i18nValues,
      );
      titleTemplate = i18n.sprintf(
        i18n.gettext('%(title)s – Add-ons for Android (%(locale)s)'),
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
              isHomePage={isHomePage}
              location={location}
              query={query}
              ref={(ref) => {
                this.header = ref;
              }}
            />

            <div className="App-content">
              <div className="App-content-wrapper">
                <ErrorPage getErrorComponent={getErrorComponent}>
                  <div className="App-banner">
                    <SurveyNotice location={location} />
                  </div>

                  <Routes />
                </ErrorPage>
              </div>
            </div>

            <FooterComponent
              handleViewDesktop={this.onViewDesktop}
              location={location}
            />
          </div>
        </ScrollToTop>
      </NestedStatus>
    );
  }
}

export const mapStateToProps = (state: AppState) => ({
  authToken: state.api && state.api.token,
  clientApp: state.api.clientApp,
  isHomePage: state.viewContext.context === VIEW_CONTEXT_HOME,
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
