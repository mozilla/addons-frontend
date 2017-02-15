/* global navigator, window */
import config from 'config';
import React, { PropTypes } from 'react';
import cookie from 'react-cookie';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import SearchForm from 'amo/components/SearchForm';
import { getErrorComponent } from 'amo/utils';
import Footer from 'amo/components/Footer';
import MastHead from 'amo/components/MastHead';
import { addChangeListeners } from 'core/addonManager';
import { INSTALL_STATE } from 'core/constants';
import DefaultErrorPage from 'core/components/ErrorPage';
import InfoDialog from 'core/containers/InfoDialog';
import translate from 'core/i18n/translate';

import 'amo/css/App.scss';
import 'core/fonts/fira.scss';


export class AppBase extends React.Component {
  static propTypes = {
    ErrorPage: PropTypes.node.isRequired,
    FooterComponent: PropTypes.node.isRequired,
    InfoDialogComponent: PropTypes.node.isRequired,
    MastHeadComponent: PropTypes.node.isRequired,
    _addChangeListeners: PropTypes.func,
    children: PropTypes.node,
    clientApp: PropTypes.string.isRequired,
    handleGlobalEvent: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    lang: PropTypes.string.isRequired,
    location: PropTypes.object.isRequired,
    mozAddonManager: PropTypes.object,
  }

  static defaultProps = {
    ErrorPage: DefaultErrorPage,
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

export const mapStateToProps = (state) => ({
  clientApp: state.api.clientApp,
  lang: state.api.lang,
});

export function mapDispatchToProps(dispatch) {
  return {
    handleGlobalEvent(payload) {
      dispatch({ type: INSTALL_STATE, payload });
    },
  };
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  translate({ withRef: true }),
)(AppBase);
