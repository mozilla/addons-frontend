/* @flow */
/* global Event, window */
/* eslint-disable react/sort-comp */
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { logOutUser } from 'core/actions';
import { logOutFromServer, startLoginUrl } from 'core/api';
import { isAuthenticated as isUserAuthenticated } from 'core/reducers/user';
import translate from 'core/i18n/translate';
import Button from 'ui/components/Button';
import Icon from 'ui/components/Icon';
import type { ApiStateType } from 'core/reducers/api';
import type { UserStateType } from 'core/reducers/user';
import type { DispatchFunc } from 'core/types/redux';
import type { ReactRouterLocation } from 'core/types/router';


type HandleLogInFunc = (
  location: ReactRouterLocation, options?: {| _window: typeof window |}
) => void;

type HandleLogOutFunc = ({| api: ApiStateType |}) => Promise<void>;

type AuthenticateButtonProps = {|
  api: ApiStateType,
  className?: string,
  handleLogIn: HandleLogInFunc,
  handleLogOut: HandleLogOutFunc,
  i18n: Object,
  isAuthenticated: boolean,
  location: ReactRouterLocation,
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
      logInText || i18n.gettext('Register or Log in');

    // The `href` is required because a <button> element with a :hover effect
    // and/or focus effect (that is not part of a form) that changes its
    // appearance will transition to the hover state onClick when using a
    // mobile browser. This is the cause of
    // https://github.com/mozilla/addons-frontend/issues/1904
    return (
      <Button onClick={this.onClick} href="#" {...otherProps}>
        {noIcon ? null : <Icon name="user-dark" />}
        {buttonText}
      </Button>
    );
  }
}

type StateMappedProps = {|
  api: ApiStateType,
  isAuthenticated: boolean,
  handleLogIn: HandleLogInFunc,
|};

export const mapStateToProps = (
  state: {|
    api: ApiStateType,
    user: UserStateType,
  |}
): StateMappedProps => ({
  api: state.api,
  isAuthenticated: isUserAuthenticated(state),
  handleLogIn(location, { _window = window } = {}) {
    // eslint-disable-next-line no-param-reassign
    _window.location = startLoginUrl({ location });
  },
});

type DispatchMappedProps = {|
  handleLogOut: HandleLogOutFunc,
|};

export const mapDispatchToProps = (
  dispatch: DispatchFunc
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
