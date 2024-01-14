/* @flow */
/* global window */
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';

import { logOutFromServer, startLoginUrl } from 'amo/api';
import { getCurrentUser, logOutUser } from 'amo/reducers/users';
import translate from 'amo/i18n/translate';
import Button from 'amo/components/Button';
import Icon from 'amo/components/Icon';
import log from 'amo/logger';
import type { ButtonType } from 'amo/components/Button';
import type { AppState } from 'amo/store';
import type { ApiState } from 'amo/reducers/api';
import type { UserType } from 'amo/reducers/users';
import type { ElementEvent, HTMLElementEventHandler } from 'amo/types/dom';
import type { I18nType } from 'amo/types/i18n';
import type { DispatchFunc } from 'amo/types/redux';
import type { ReactRouterLocationType } from 'amo/types/router';

type HandleLogInFunc = (
  location: ReactRouterLocationType,
  options?: {| _window: typeof window |},
) => void;

type HandleLogOutFunction = ({| api: ApiState |}) => Promise<void>;

type DefaultProps = {|
  buttonType?: ButtonType,
  noIcon?: boolean,
|};

type Props = {|
  ...DefaultProps,
  className?: string,
  handleLogIn?: HandleLogInFunc,
  handleLogOut?: HandleLogOutFunction,
  logInText?: string,
  logOutText?: string,
|};

type PropsFromState = {|
  api: ApiState,
  handleLogIn: HandleLogInFunc,
  siteIsReadOnly: boolean,
  siteUser: UserType | null,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  i18n: I18nType,
  location: ReactRouterLocationType,
|};

export class AuthenticateButtonBase extends React.Component<InternalProps> {
  static defaultProps: DefaultProps = {
    buttonType: 'action',
    noIcon: false,
  };

  onClick: HTMLElementEventHandler = (event: ElementEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const { api, handleLogIn, handleLogOut, location, siteUser } = this.props;

    invariant(handleLogOut, 'handleLogOut() is undefined');

    if (siteUser) {
      handleLogOut({ api });
    } else {
      handleLogIn(location);
    }
  };

  render(): React.Node {
    const {
      buttonType,
      className,
      i18n,
      logInText,
      logOutText,
      noIcon,
      siteIsReadOnly,
      siteUser,
    } = this.props;

    const buttonText = siteUser
      ? logOutText || i18n.t('Log out')
      : logInText || i18n.t('Log in');

    const title = siteIsReadOnly
      ? i18n.t(
          'This action is currently unavailable. Please reload the page in a moment.',
        )
      : null;

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
        disabled={siteIsReadOnly}
        onClick={this.onClick}
        title={title}
        micro
      >
        {noIcon ? null : <Icon name="user-dark" />}
        {buttonText}
      </Button>
    );
  }
}

export const mapStateToProps = (
  state: AppState,
  ownProps: Props,
): PropsFromState => {
  const defaultHandleLogIn = (location, { _window = window } = {}) => {
    // eslint-disable-next-line no-param-reassign
    _window.location.assign(startLoginUrl({ location }));
  };

  return {
    api: state.api,
    handleLogIn: ownProps.handleLogIn || defaultHandleLogIn,
    siteIsReadOnly: state.site.readOnly,
    siteUser: getCurrentUser(state.users),
  };
};

type DispatchMappedProps = {|
  handleLogOut: HandleLogOutFunction,
|};

export const createHandleLogOutFunction = (
  dispatch: DispatchFunc,
): HandleLogOutFunction => {
  return ({ api }) => {
    return (
      logOutFromServer({ api })
        // We want to force a logout on the client, even if the API returned an
        // error. See: https://github.com/mozilla/addons-frontend/issues/9260
        .catch((error) => {
          log.warn(`Received error from the API while logging out: ${error}`);
        })
        .then(() => dispatch(logOutUser()))
    );
  };
};

export const mapDispatchToProps = (
  dispatch: DispatchFunc,
  ownProps: Props,
): DispatchMappedProps => ({
  handleLogOut: ownProps.handleLogOut || createHandleLogOutFunction(dispatch),
});

const AuthenticateButton: React.ComponentType<Props> = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  translate(),
)(AuthenticateButtonBase);

export default AuthenticateButton;
