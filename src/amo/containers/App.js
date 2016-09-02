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
    i18n: PropTypes.object.isRequired,
    isAuthenticated: PropTypes.bool,
    handleLogIn: PropTypes.func,
  }

  logIn() {
    const { i18n, isAuthenticated, handleLogIn } = this.props;
    if (isAuthenticated) {
      return <p>You are logged in</p>;
    }
    return <button className="button" onClick={handleLogIn}>{i18n.gettext('Log in')}</button>;
  }

  render() {
    const { children, i18n } = this.props;
    return (
      <div className="amo">
        <Helmet
          defaultTitle={i18n.gettext('Add-ons for Firefox')}
        />
        {children}
        <footer>{this.logIn()}</footer>
      </div>
    );
  }
}

export const makeMapStateToProps = ({ _window = window } = {}) => (state) => ({
  isAuthenticated: !!state.auth.token,
  handleLogIn() {
    // eslint-disable-next-line no-param-reassign
    _window.location = startLoginUrl();
  },
});


export default compose(
  connect(makeMapStateToProps()),
  translate({ withRef: true }),
)(AppBase);
