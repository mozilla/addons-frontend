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
import { withErrorHandling } from 'core/errorHandler';
import { setDefaultErrorHandler as _setDefaultErrorHandler }
  from 'core/errorHandler';
import { INSTALL_STATE } from 'core/constants';
import log from 'core/logger';
import translate from 'core/i18n/translate';
import { startLoginUrl } from 'core/api';
import Footer from 'amo/components/Footer';
import MastHead from 'amo/components/MastHead';


export class AppBase extends React.Component {
  static propTypes = {
    FooterComponent: PropTypes.node.isRequired,
    MastHeadComponent: PropTypes.node.isRequired,
    _addChangeListeners: PropTypes.func,
    children: PropTypes.node,
    errorHandler: PropTypes.object,
    handleGlobalEvent: PropTypes.func.isRequired,
    handleLogIn: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    isAuthenticated: PropTypes.bool,
    location: PropTypes.object.isRequired,
    mozAddonManager: PropTypes.object,
    setDefaultErrorHandler: PropTypes.func,
  }

  static defaultProps = {
    FooterComponent: Footer,
    MastHeadComponent: MastHead,
    _addChangeListeners: addChangeListeners,
    mozAddonManager: config.get('server') ? {} : navigator.mozAddonManager,
    setDefaultErrorHandler: _setDefaultErrorHandler,
  }

  constructor(props) {
    super(props);
    const { errorHandler, setDefaultErrorHandler } = this.props;
    if (errorHandler) {
      log.warn('<App/> set default error handler', errorHandler);
      setDefaultErrorHandler(errorHandler);
    } else {
      log.warn('<App/> did not receive an errorHandler property');
    }
  }

  componentDidMount() {
    const {
      _addChangeListeners, handleGlobalEvent, mozAddonManager,
    } = this.props;
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
      FooterComponent, MastHeadComponent, children, i18n, location,
    } = this.props;
    const query = location.query ? location.query.q : null;
    return (
      <div className="amo">
        <Helmet defaultTitle={i18n.gettext('Add-ons for Firefox')} />
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
  withErrorHandling({ name: 'App' }),
  connect(setupMapStateToProps(), mapDispatchToProps),
  translate({ withRef: true }),
)(AppBase);
