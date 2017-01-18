/* global navigator, window */
import config from 'config';
import React, { PropTypes } from 'react';
import Helmet from 'react-helmet';
import cookie from 'react-cookie';
import { connect } from 'react-redux';
import { compose } from 'redux';

import 'core/fonts/fira.scss';
import 'amo/css/App.scss';
import SearchForm from 'amo/components/SearchForm';
import { addChangeListeners } from 'core/addonManager';
import { INSTALL_STATE } from 'core/constants';
import InfoDialog from 'core/containers/InfoDialog';
import { getReduxConnectError } from 'core/reduxConnectErrors';
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
    handleGlobalEvent: PropTypes.func.isRequired,
    handleLogIn: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    isAuthenticated: PropTypes.bool,
    location: PropTypes.object.isRequired,
    mozAddonManager: PropTypes.object,
    reduxAsyncConnect: PropTypes.object.isRequired,
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
    const { handleLogIn, i18n, isAuthenticated, location } = this.props;
    return (
      <button className="button AccountButton"
              onClick={() => handleLogIn(location)}
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
      i18n,
      location,
      reduxAsyncConnect,
    } = this.props;
    const query = location.query ? location.query.q : null;

    if (reduxAsyncConnect && reduxAsyncConnect.loadState) {
      const reduxResult = getReduxConnectError(reduxAsyncConnect.loadState);
      if (reduxResult.error) {
        // TODO: This will be prettier once we implement real error pages.
        // https://github.com/mozilla/addons-frontend/issues/1033
        return (
          <div className="amo">
            <div className="App-content">{reduxResult.error}</div>
          </div>
        );
      }
    }

    return (
      <div className="amo">
        <Helmet defaultTitle={i18n.gettext('Add-ons for Firefox')} />
        <InfoDialogComponent />
        <MastHeadComponent SearchFormComponent={SearchForm} query={query}>
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
  isAuthenticated: !!state.auth.token,
  reduxAsyncConnect: state.reduxAsyncConnect,
  handleLogIn(location) {
    // eslint-disable-next-line no-param-reassign
    (_window || window).location = startLoginUrl({ location });
  },
});

export function mapDispatchToProps(dispatch) {
  return {
    handleGlobalEvent(payload) {
      dispatch({ type: INSTALL_STATE, payload });
    },
  };
}

export default compose(
  connect(setupMapStateToProps(), mapDispatchToProps),
  translate({ withRef: true }),
)(AppBase);
