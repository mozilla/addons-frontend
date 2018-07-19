/* @flow */
/* global Event, Navigator, Node, navigator, window */
import config from 'config';
import { oneLine } from 'common-tags';
import * as React from 'react';
import cookie from 'react-cookie';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { withRouter, Route, Switch } from 'react-router-dom';
import NestedStatus from 'react-nested-status';
import { compose } from 'redux';

import About from 'amo/components/StaticPages/About';
import Addon from 'amo/components/Addon';
import AddonReviewList from 'amo/components/AddonReviewList';
import CategoriesPage from 'amo/components/CategoriesPage';
import Category from 'amo/components/Category';
import Collection from 'amo/components/Collection';
import CollectionEdit from 'amo/components/CollectionEdit';
import CollectionList from 'amo/components/CollectionList';
import Home from 'amo/components/Home';
import LandingPage from 'amo/components/LandingPage';
import LanguageTools from 'amo/components/LanguageTools';
import SearchTools from 'amo/components/SearchTools';
import NotAuthorized from 'amo/components/ErrorPage/NotAuthorized';
import NotFound from 'amo/components/ErrorPage/NotFound';
import ReviewGuide from 'amo/components/StaticPages/ReviewGuide';
import SearchPage from 'amo/components/SearchPage';
import ServerError from 'amo/components/ErrorPage/ServerError';
import UserProfile from 'amo/components/UserProfile';
import UserProfileEdit from 'amo/components/UserProfileEdit';
import SimulateAsyncError from 'core/components/error-simulation/SimulateAsyncError';
import SimulateClientError from 'core/components/error-simulation/SimulateClientError';
import SimulateSyncError from 'core/components/error-simulation/SimulateSyncError';
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

import 'core/fonts/fira.scss';
import 'core/fonts/opensans.scss';
import './styles.scss';

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
      location,
    } = this.props;

    const query = location.query ? location.query.q : null;

    let defaultTitle = i18n.gettext('Add-ons for Firefox');
    let titleTemplate = i18n.gettext('%s – Add-ons for Firefox');

    if (clientApp === CLIENT_APP_ANDROID) {
      defaultTitle = i18n.gettext('Add-ons for Android');
      titleTemplate = i18n.gettext('%s – Add-ons for Android');
    }

    return (
      <NestedStatus code={200}>
        <ScrollToTop>
          <div className="amo">
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

                  <Switch>
                    <Route exact path="/:lang/about" component={About} />
                    {/* TODO: Post launch update this URL and redirect see #3374/ */}
                    <Route
                      exact
                      path="/:lang/review_guide"
                      component={ReviewGuide}
                    />

                    <Route exact path="/:lang/:application/" component={Home} />

                    <Route
                      exact
                      path="/:lang/:application/addon/:slug/"
                      component={Addon}
                    />
                    <Route
                      exact
                      path="/:lang/:application/addon/:addonSlug/reviews/"
                      component={AddonReviewList}
                    />

                    <Route
                      exact
                      path="/:lang/:application/users/edit"
                      component={UserProfileEdit}
                    />
                    <Route
                      exact
                      path="/:lang/:application/user/:username/edit/"
                      component={UserProfileEdit}
                    />
                    <Route
                      exact
                      path="/:lang/:application/user/:username/"
                      component={UserProfile}
                    />

                    <Route
                      exact
                      path="/:lang/:application/collections/:username/:slug/"
                      component={Collection}
                    />
                    <Route
                      exact
                      path="/:lang/:application/collections/"
                      component={CollectionList}
                    />
                    <Route
                      exact
                      path="/:lang/:application/collections/add/"
                      component={(props) => <Collection {...props} creating />}
                    />
                    <Route
                      exact
                      path="/:lang/:application/collections/:username/:slug/edit/"
                      component={CollectionEdit}
                    />

                    <Route
                      exact
                      path="/:lang/:application/:visibleAddonType/categories/"
                      component={CategoriesPage}
                    />
                    <Route
                      exact
                      path="/:lang/:application/:visibleAddonType/:slug/"
                      component={Category}
                    />

                    {/* See: https://github.com/mozilla/addons-frontend/issues/5150 */}
                    <Route
                      exact
                      path="/:lang/android/language-tools/"
                      component={NotFound}
                    />
                    <Route
                      exact
                      path="/:lang/:application/language-tools/"
                      component={LanguageTools}
                    />
                    <Route
                      exact
                      path="/:lang/:application/search-tools/"
                      component={SearchTools}
                    />
                    <Route
                      exact
                      path="/:lang/:application/search/"
                      component={SearchPage}
                    />

                    <Route
                      exact
                      path="/:lang/:application/401/"
                      component={
                        config.get('isDevelopment') ? NotAuthorized : NotFound
                      }
                    />
                    <Route
                      exact
                      path="/:lang/:application/404/"
                      component={NotFound}
                    />
                    <Route
                      exact
                      path="/:lang/:application/500/"
                      component={
                        config.get('isDevelopment') ? ServerError : NotFound
                      }
                    />

                    <Route
                      exact
                      path="/:lang/:application/simulate-async-error/"
                      component={SimulateAsyncError}
                    />
                    <Route
                      exact
                      path="/:lang/:application/simulate-sync-error/"
                      component={SimulateSyncError}
                    />
                    <Route
                      exact
                      path="/:lang/:application/simulate-client-error/"
                      component={SimulateClientError}
                    />
                    <Route
                      exact
                      path="/:lang/:application/:visibleAddonType/"
                      component={LandingPage}
                    />

                    <Route component={NotFound} />
                  </Switch>
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
