/* global window */
import config from 'config';
import React, { PropTypes } from 'react';
import cookie from 'react-cookie';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { logOutUser } from 'core/actions';
import { startLoginUrl } from 'core/api';
import translate from 'core/i18n/translate';
import Button from 'ui/components/Button';
import Icon from 'ui/components/Icon';


export class AuthenticateButtonBase extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    handleLogIn: PropTypes.func.isRequired,
    handleLogOut: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    isAuthenticated: PropTypes.bool.isRequired,
    location: PropTypes.object.isRequired,
  }

  onClick = () => {
    const { handleLogIn, handleLogOut, isAuthenticated, location } = this.props;
    if (isAuthenticated) {
      handleLogOut();
    } else {
      handleLogIn(location);
    }
  }

  render() {
    const { i18n, isAuthenticated, ...otherProps } = this.props;
    const text = isAuthenticated ? i18n.gettext('Log out') : i18n.gettext('Log in/Sign up');
    return (
      <Button onClick={this.onClick} {...otherProps}>
        <Icon name="user" />
        {text}
      </Button>
    );
  }
}

export const mapStateToProps = (state) => ({
  isAuthenticated: !!state.auth.token,
  handleLogIn(location, { _window = window } = {}) {
    // eslint-disable-next-line no-param-reassign
    _window.location = startLoginUrl({ location });
  },
});

export const mapDispatchToProps = (dispatch) => ({
  handleLogOut() {
    cookie.remove(config.get('cookieName'), { path: '/' });
    dispatch(logOutUser());
  },
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  translate(),
)(AuthenticateButtonBase);
