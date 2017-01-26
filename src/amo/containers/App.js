/* global navigator, window */
import config from 'config';
import React, { PropTypes } from 'react';
import cookie from 'react-cookie';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import 'core/fonts/fira.scss';
import 'amo/css/App.scss';
import SearchForm from 'amo/components/SearchForm';
import { logOutUser } from 'core/actions';
import { addChangeListeners } from 'core/addonManager';
import { INSTALL_STATE } from 'core/constants';
import InfoDialog from 'core/containers/InfoDialog';
import { handleResourceErrors } from 'core/resourceErrors/decorator';
import translate from 'core/i18n/translate';
import { startLoginUrl } from 'core/api';
import Footer from 'amo/components/Footer';
import MastHead from 'amo/components/MastHead';


export class AppBase extends React.Component {
  static propTypes = {
    FooterComponent: PropTypes.node.isRequired,
    InfoDialogComponent: PropTypes.node.isRequired,
    MastHeadComponent: PropTypes.node.isRequired,
    _addChangeListeners: PropTypes.func,
    children: PropTypes.node,
    clientApp: PropTypes.string.isRequired,
    handleGlobalEvent: PropTypes.func.isRequired,
    handleLogIn: PropTypes.func.isRequired,
    handleLogOut: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    isAuthenticated: PropTypes.bool,
    lang: PropTypes.string.isRequired,
    location: PropTypes.object.isRequired,
    mozAddonManager: PropTypes.object,
  }

  static defaultProps = {
    FooterComponent: Footer,
    InfoDialogComponent: InfoDialog,
    MastHeadComponent: MastHead,
    _addChangeListeners: addChangeListeners,
    mozAddonManager: config.get('server') ? {} : navigator.mozAddonManager,
  }

  componentDidMount() {
    const { _addChangeListeners, handleGlobalEvent, mozAddonManager } = this.props;
    // Use addonManager.addChangeListener to setup and filter events.
    _addChangeListeners(handleGlobalEvent, mozAddonManager);
  }

  onViewDesktop = (event, { window_ = window, cookie_ = cookie } = {}) => {
    event.preventDefault();
    if (window_ && window_.location) {
      cookie_.save('mamo', 'off', { path: '/' });
      window_.location.reload();
    }
  }

  accountButton() {
    const { handleLogIn, handleLogOut, i18n, isAuthenticated, location } = this.props;
    return (
      <button className="button AccountButton"
              onClick={() => (isAuthenticated ? handleLogOut() : handleLogIn(location))}
              ref={(ref) => { this.logInButton = ref; }}>
        <span>{ isAuthenticated ? i18n.gettext('Log out') : i18n.gettext('Log in/Sign up') }</span>
      </button>
    );
  }

  render() {
    const {
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
        <Helmet defaultTitle={i18n.gettext('Add-ons for Firefox')} />
        <InfoDialogComponent />
        <MastHeadComponent SearchFormComponent={SearchForm}
          isHomePage={isHomePage} query={query}
          ref={(ref) => { this.mastHead = ref; }}>
          {this.accountButton()}
        </MastHeadComponent>
        <div className="App-content">
          {children}
        </div>
        <FooterComponent handleViewDesktop={this.onViewDesktop}
          location={location} />
      </div>
    );
  }
}

export const setupMapStateToProps = (_window) => (state) => ({
  clientApp: state.api.application,
  isAuthenticated: !!state.auth.token,
  handleLogIn(location) {
    // eslint-disable-next-line no-param-reassign
    (_window || window).location = startLoginUrl({ location });
  },
  lang: state.api.lang,
});

export function mapDispatchToProps(dispatch) {
  return {
    handleGlobalEvent(payload) {
      dispatch({ type: INSTALL_STATE, payload });
    },
    handleLogOut() {
      cookie.remove(config.get('cookieName'), { path: '/' });
      dispatch(logOutUser());
    },
  };
}

export default compose(
  handleResourceErrors,
  connect(setupMapStateToProps(), mapDispatchToProps),
  translate({ withRef: true }),
)(AppBase);
