/* global window */

import React, { PropTypes } from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import 'core/fonts/fira.scss';
import 'amo/css/App.scss';
import translate from 'core/i18n/translate';
import { startLoginUrl } from 'core/api';

export class AppBase extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    handleLogIn: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    isAuthenticated: PropTypes.bool,
    location: PropTypes.object.isRequired,
  }

  accountButton() {
    const { handleLogIn, i18n, isAuthenticated, location } = this.props;
    if (isAuthenticated) {
      return <p>You are logged in</p>;
    }
    return (
      <button className="button" onClick={() => handleLogIn(location)}
              ref={(ref) => { this.logInButton = ref; }}>
        {i18n.gettext('Log in')}
      </button>
    );
  }

  render() {
    const { children, i18n } = this.props;
    return (
      <div className="amo">
        <Helmet
          defaultTitle={i18n.gettext('Add-ons for Firefox')}
        />
        {children}
        <footer>{this.accountButton()}</footer>
      </div>
    );
  }
}

export const setupMapStateToProps = (_window) => (state) => ({
  lang: state.lang,
  isAuthenticated: !!state.auth.token,
  handleLogIn(location) {
    // eslint-disable-next-line no-param-reassign
    (_window || window).location = startLoginUrl({ location });
  },
});

export default compose(
  connect(setupMapStateToProps()),
  translate({ withRef: true }),
)(AppBase);
