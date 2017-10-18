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
import type { I18nType } from 'core/types/i18n';


type HandleLogInFunc = (
  location: ReactRouterLocation, options?: {| _window: typeof window |}
) => void;

type HandleLogOutFunction = ({| api: ApiStateType |}) => Promise<void>;

type Props = {|
  api: ApiStateType,
  className?: string,
  handleLogIn: HandleLogInFunc,
  handleLogOut: HandleLogOutFunction,
  i18n: I18nType,
  isAuthenticated: boolean,
  location: ReactRouterLocation,
  logInText?: string,
  logOutText?: string,
  noIcon: boolean,
|};

export class AuthenticateButtonBase extends React.Component<Props> {
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
      i18n, isAuthenticated, logInText, logOutText, noIcon, className,
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
      <Button
        href={`#${isAuthenticated ? 'logout' : 'login'}`}
        className={className}
        onClick={this.onClick}
      >
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
  handleLogOut: HandleLogOutFunction,
|};

export const createHandleLogOutFunction = (
  dispatch: DispatchFunc
): HandleLogOutFunction => {
  return ({ api }) => {
    return logOutFromServer({ api }).then(() => dispatch(logOutUser()));
  };
};

export const mapDispatchToProps = (
  dispatch: DispatchFunc,
  ownProps: Props
): DispatchMappedProps => ({
  handleLogOut: ownProps.handleLogOut || createHandleLogOutFunction(dispatch),
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  translate(),
)(AuthenticateButtonBase);
