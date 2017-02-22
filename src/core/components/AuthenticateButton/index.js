/* global window */
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { logOutUser } from 'core/actions';
import { logOutFromServer, startLoginUrl } from 'core/api';
import translate from 'core/i18n/translate';
import Button from 'ui/components/Button';
import Icon from 'ui/components/Icon';


export class AuthenticateButtonBase extends React.Component {
  static propTypes = {
    api: PropTypes.object.isRequired,
    className: PropTypes.string,
    handleLogIn: PropTypes.func.isRequired,
    handleLogOut: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    isAuthenticated: PropTypes.bool.isRequired,
    location: PropTypes.object.isRequired,
    logInText: PropTypes.string,
    logOutText: PropTypes.string,
    noIcon: PropTypes.boolean,
  }

  static defaultProps = {
    noIcon: false,
  }

  onClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const {
      api, handleLogIn, handleLogOut, isAuthenticated, location,
    } = this.props;
    if (isAuthenticated) {
      handleLogOut({ api });
    } else {
      handleLogIn(location);
    }
  }

  render() {
    const {
      i18n, isAuthenticated, logInText, logOutText, noIcon, ...otherProps
    } = this.props;
    const buttonText = isAuthenticated ?
      logOutText || i18n.gettext('Log out') :
      logInText || i18n.gettext('Log in/Sign up');
    return (
      <Button onClick={this.onClick} {...otherProps}>
        {noIcon ? null : <Icon name="user-dark" />}
        {buttonText}
      </Button>
    );
  }
}

export const mapStateToProps = (state) => ({
  api: state.api,
  isAuthenticated: !!state.api.token,
  handleLogIn(location, { _window = window } = {}) {
    // eslint-disable-next-line no-param-reassign
    _window.location = startLoginUrl({ location });
  },
});

export const mapDispatchToProps = (dispatch) => ({
  handleLogOut({ api }) {
    return logOutFromServer({ api })
      .then(() => dispatch(logOutUser()));
  },
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  translate(),
)(AuthenticateButtonBase);
