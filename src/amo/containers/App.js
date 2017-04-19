/* @flow */
/* global Event, Navigator, Node, navigator, window */
import base62 from 'base62';
import config from 'config';
import React, { PropTypes } from 'react';
import cookie from 'react-cookie';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import LoadingBar from 'react-redux-loading-bar';
import { compose } from 'redux';

import SearchForm from 'amo/components/SearchForm';
import { getErrorComponent } from 'amo/utils';
import Footer from 'amo/components/Footer';
import MastHead from 'amo/components/MastHead';
import { addChangeListeners } from 'core/addonManager';
import { logOutUser, setUserAgent as setUserAgentAction }
  from 'core/actions';
import { INSTALL_STATE } from 'core/constants';
import DefaultErrorPage from 'core/components/ErrorPage';
import InfoDialog from 'core/containers/InfoDialog';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import type { ApiStateType } from 'core/reducers/api';
import type { DispatchFunc } from 'core/types/redux';
import type { InstalledAddon } from 'core/reducers/installations';

import 'amo/css/App.scss';
import 'core/fonts/fira.scss';

interface MozNavigator extends Navigator {
  mozAddonManager?: Object,
}


export class AppBase extends React.Component {
  mastHead: Node;

  static propTypes = {
    ErrorPage: PropTypes.node.isRequired,
    FooterComponent: PropTypes.node.isRequired,
    InfoDialogComponent: PropTypes.node.isRequired,
    MastHeadComponent: PropTypes.node.isRequired,
    _addChangeListeners: PropTypes.func,
    _navigator: PropTypes.object,
    authToken: PropTypes.string,
    children: PropTypes.node,
    clientApp: PropTypes.string.isRequired,
    handleGlobalEvent: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    lang: PropTypes.string.isRequired,
    location: PropTypes.object.isRequired,
    mozAddonManager: PropTypes.object,
    setUserAgent: PropTypes.func.isRequired,
    userAgent: PropTypes.string,
  }

  static defaultProps = {
    ErrorPage: DefaultErrorPage,
    FooterComponent: Footer,
    InfoDialogComponent: InfoDialog,
    MastHeadComponent: MastHead,
    _addChangeListeners: addChangeListeners,
    _navigator: (typeof navigator !== 'undefined' ? navigator : null),
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
      log.info('Setting a logout timer when the token expires');
      this.setLogOutTimer(authToken);
    } else {
      log.info('No authToken');
    }
  }

  setLogOutTimer(authToken: string) {
    const parts = authToken.split(':');
    console.log('authToken: ', authToken);
    base62.setCharacterSet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
    const createdAt = base62.decode(parts[1]);
    // GMT Unix timestamp:
    console.log('token created at timestamp:', createdAt);
    console.log('authTokenValidFor:', config.get('authTokenValidFor'));
    const expiresAt = config.get('authTokenValidFor');
    const now = Date.now() / 1000;
    console.log('token created at:', new Date(createdAt * 1000));

    console.log('now:', now);
    const expirationTime = createdAt + expiresAt - now;
    console.log('expirationTime:', expirationTime);

    setTimeout(() => this.props.logOutUser(), expirationTime * 1000);

    console.log('token expires at:',
      new Date((now + expirationTime) * 1000));
  }

  onViewDesktop = (
    event: Event,
    {
      window_ = window, cookie_ = cookie,
    }: {
      window_: typeof window, cookie_: typeof cookie,
    } = {}
  ) => {
    event.preventDefault();
    if (window_ && window_.location) {
      cookie_.save('mamo', 'off', { path: '/' });
      window_.location.reload();
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
      dispatch(logOutUser());
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
