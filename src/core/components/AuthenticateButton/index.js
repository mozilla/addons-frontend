/* @flow */
/* global Event, window */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { logOutFromServer, startLoginUrl } from 'core/api';
import { getCurrentUser, logOutUser } from 'amo/reducers/users';
import translate from 'core/i18n/translate';
import Button from 'ui/components/Button';
import Icon from 'ui/components/Icon';
import type { ApiStateType } from 'core/reducers/api';
import type { UsersStateType, UserType } from 'amo/reducers/users';
import type { DispatchFunc } from 'core/types/redux';
import type { ReactRouterLocation } from 'core/types/router';
import type { I18nType } from 'core/types/i18n';


type HandleLogInFunc = (
  location: ReactRouterLocation, options?: {| _window: typeof window |}
) => void;

type HandleLogOutFunction = ({| api: ApiStateType |}) => Promise<void>;

type Props = {|
  api: ApiStateType,
  buttonType?: string,
  className?: string,
  handleLogIn: HandleLogInFunc,
  handleLogOut: HandleLogOutFunction,
  i18n: I18nType,
  location: ReactRouterLocation,
  logInText?: string,
  logOutText?: string,
  noIcon: boolean,
  siteUser: UserType | null,
|};

export class AuthenticateButtonBase extends React.Component<Props> {
  static defaultProps = {
    buttonType: 'action',
    noIcon: false,
  }

  onClick = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    const {
      api,
      handleLogIn,
      handleLogOut,
      location,
      siteUser,
    } = this.props;

    if (siteUser) {
      handleLogOut({ api });
    } else {
      handleLogIn(location);
    }
  }

  render() {
    const {
      buttonType,
      className,
      i18n,
      logInText,
      logOutText,
      noIcon,
      siteUser,
    } = this.props;

    const buttonText = siteUser ?
      logOutText || i18n.gettext('Log out') :
      logInText || i18n.gettext('Register or Log in');

    // The `href` is required because a <button> element with a :hover effect
    // and/or focus effect (that is not part of a form) that changes its
    // appearance will transition to the hover state onClick when using a
    // mobile browser. This is the cause of
    // https://github.com/mozilla/addons-frontend/issues/1904
    return (
      <Button
        href={`#${siteUser ? 'logout' : 'login'}`}
        buttonType={buttonType}
        className={className}
        onClick={this.onClick}
        micro
      >
        {noIcon ? null : <Icon name="user-dark" />}
        {buttonText}
      </Button>
    );
  }
}

type StateMappedProps = {|
  api: ApiStateType,
  handleLogIn: HandleLogInFunc,
  siteUser: UserType | null,
|};

export const mapStateToProps = (
  state: {|
    api: ApiStateType,
    users: UsersStateType,
  |}
): StateMappedProps => ({
  api: state.api,
  handleLogIn(location, { _window = window } = {}) {
    // eslint-disable-next-line no-param-reassign
    _window.location = startLoginUrl({ location });
  },
  siteUser: getCurrentUser(state.users),
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
