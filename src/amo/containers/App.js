/* @flow */
/* eslint-disable react/sort-comp */
/* global $PropertyType, Event, Navigator, Node, navigator, window */
import config from 'config';
import { oneLine } from 'common-tags';
import React from 'react';
import cookie from 'react-cookie';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import LoadingBar from 'react-redux-loading-bar';
import { compose } from 'redux';

import SearchForm from 'amo/components/SearchForm';
import { getDjangoBase62, getErrorComponent } from 'amo/utils';
import Footer from 'amo/components/Footer';
import MastHead from 'amo/components/MastHead';
import { addChangeListeners } from 'core/addonManager';
import {
  logOutUser as logOutUserAction, setUserAgent as setUserAgentAction,
} from 'core/actions';
import { INSTALL_STATE, maximumSetTimeoutDelay } from 'core/constants';
import DefaultErrorPage from 'core/components/ErrorPage';
import InfoDialog from 'core/containers/InfoDialog';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import type { UrlFormatParams } from 'core/api';
import type { ApiStateType } from 'core/reducers/api';
import type { DispatchFunc } from 'core/types/redux';
import type { InstalledAddon } from 'core/reducers/installations';

import 'amo/css/App.scss';
import 'core/fonts/fira.scss';

interface MozNavigator extends Navigator {
  mozAddonManager?: Object,
}

type AppProps = {
  ErrorPage: typeof DefaultErrorPage,
  FooterComponent: typeof Footer,
  InfoDialogComponent: typeof InfoDialog,
  MastHeadComponent: typeof MastHead,
  _addChangeListeners: () => void,
  _navigator: typeof navigator,
  authToken?: string,
  authTokenValidFor?: number,
  children: any,
  clientApp: string,
  handleGlobalEvent: () => void,
  i18n: Object,
  lang: string,
  location: UrlFormatParams,
  logOutUser: () => void,
  mozAddonManager: $PropertyType<MozNavigator, 'mozAddonManager'>,
  setUserAgent: () => void,
  userAgent: string,
}

export class AppBase extends React.Component {
  mastHead: Node;
  props: AppProps;
  scheduledLogout: number;

  static defaultProps = {
    ErrorPage: DefaultErrorPage,
    FooterComponent: Footer,
    InfoDialogComponent: InfoDialog,
    MastHeadComponent: MastHead,
    _addChangeListeners: addChangeListeners,
    _navigator: (typeof navigator !== 'undefined' ? navigator : null),
    authTokenValidFor: config.get('authTokenValidFor'),
    mozAddonManager:
      config.get('server') ? {} : (navigator: MozNavigator).mozAddonManager,
    userAgent: null,
  }

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
        'userAgent not in state on App load; using navigator.userAgent.');
      setUserAgent(_navigator.userAgent);
    }

    if (authToken) {
      this.setLogOutTimer(authToken);
    }
  }

  componentWillReceiveProps(nextProps: AppProps) {
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
        `Auth token "${encodedTimestamp}" triggered this base62 error: "${base62Error}"`);
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
    const expirationTime = (createdAt + expiresAt) - now;
    const readableExpiration =
      new Date((now + expirationTime) * 1000).toString();
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
      _window = window, _cookie = cookie,
    }: {|
      _window: typeof window, _cookie: typeof cookie,
    |} = {}
  ) => {
    event.preventDefault();
    if (_window && _window.location) {
      _cookie.save('mamo', 'off', { path: '/' });
      _window.location.reload();
    }
  }

  render() {
    const {
      ErrorPage,
      FooterComponent,
      InfoDialogComponent,
      MastHeadComponent,
      children,
      clientApp,
      i18n,
      lang,
      location,
    } = this.props;

    const isHomePage = Boolean(location.pathname && location.pathname.match(
      new RegExp(`^\\/${lang}\\/${clientApp}\\/?$`)));
    const query = location.query ? location.query.q : null;
    return (
      <div className="amo">
        <LoadingBar className="App-loading-bar" />
        <Helmet defaultTitle={i18n.gettext('Add-ons for Firefox')} />
        <InfoDialogComponent />
        <MastHeadComponent
          SearchFormComponent={SearchForm} isHomePage={isHomePage} location={location}
          query={query} ref={(ref) => { this.mastHead = ref; }} />
        <div className="App-content">
          <ErrorPage getErrorComponent={getErrorComponent}>
            {children}
          </ErrorPage>
        </div>
        <FooterComponent handleViewDesktop={this.onViewDesktop}
          location={location} />
      </div>
    );
  }
}

export const mapStateToProps = (state: { api: ApiStateType }) => ({
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
      dispatch({ type: INSTALL_STATE, payload });
    },
    setUserAgent(userAgent: string) {
      dispatch(setUserAgentAction(userAgent));
    },
  };
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  translate({ withRef: true }),
)(AppBase);
