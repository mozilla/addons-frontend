/* @flow */
/* global window */
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { logOutUser } from 'core/actions';
import { logOutFromServer, startLoginUrl } from 'core/api';
import type { UrlFormatParams } from 'core/api';
import translate from 'core/i18n/translate';
import type { DispatchFn } from 'core/types/reduxTypes';
import Button from 'ui/components/Button';
import Icon from 'ui/components/Icon';

type AuthenticateButtonProps = {|
  api: Object,
  className?: string,
  handleLogIn: HandleLogInFn,
  handleLogOut: HandleLogOutFn,
  i18n: Object,
  isAuthenticated: boolean,
  location: UrlFormatParams,
  logInText?: string,
  logOutText?: string,
  noIcon: boolean,
|};

export class AuthenticateButtonBase extends React.Component {
  props: AuthenticateButtonProps;

  static defaultProps = {
    noIcon: false,
  }

  onClick = (event: Event) => {
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

type HandleLogInFn = (
  location: UrlFormatParams, options?: {| _window: Object |}
) => void;

type StateMappedProps = {|
  api: Object, // TODO apiState from reducer
  isAuthenticated: boolean,
  handleLogIn: HandleLogInFn,
|};

export const mapStateToProps = (state: Object): StateMappedProps => ({
  api: state.api,
  isAuthenticated: !!state.api.token,
  handleLogIn(location, { _window = window } = {}) {
    // eslint-disable-next-line no-param-reassign
    _window.location = startLoginUrl({ location });
  },
});

type HandleLogOutFn = ({|
  api: Object, // TODO: apiState from reducer
|}) => Promise<void>;

type DispatchMappedProps = {|
  handleLogOut: HandleLogOutFn,
|};

export const mapDispatchToProps = (
  dispatch: DispatchFn
): DispatchMappedProps => ({
  handleLogOut({ api }) {
    return logOutFromServer({ api })
      .then(() => dispatch(logOutUser()));
  },
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  translate(),
)(AuthenticateButtonBase);
