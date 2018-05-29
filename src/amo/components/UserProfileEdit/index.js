/* @flow */
import invariant from 'invariant';
import * as React from 'react';
import Textarea from 'react-textarea-autosize';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import NotFound from 'amo/components/ErrorPage/NotFound';
import UserProfileEditNotifications from 'amo/components/UserProfileEditNotifications';
import UserProfileEditPicture from 'amo/components/UserProfileEditPicture';
import {
  deleteUserAccount,
  deleteUserPicture,
  editUserAccount,
  fetchUserAccount,
  fetchUserNotifications,
  getCurrentUser,
  getUserByUsername,
  hasPermission,
  logOutUser,
} from 'amo/reducers/users';
import AuthenticateButton from 'core/components/AuthenticateButton';
import { USERS_EDIT } from 'core/constants';
import { withFixedErrorHandler } from 'core/errorHandler';
import log from 'core/logger';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import Button from 'ui/components/Button';
import Card from 'ui/components/Card';
import Notice from 'ui/components/Notice';
import OverlayCard from 'ui/components/OverlayCard';
import type { UsersStateType, UserType } from 'amo/reducers/users';
import type { ApiStateType } from 'core/reducers/api';
import type { DispatchFunc } from 'core/types/redux';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { I18nType } from 'core/types/i18n';
import type { ReactRouterType } from 'core/types/router';

import './styles.scss';


type Props = {|
  clientApp: string,
  currentUser: UserType | null,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  hasEditPermission: boolean,
  i18n: I18nType,
  isUpdating: boolean,
  lang: string,
  // The routing `params` prop is used in `mapStateToProps()`.
  // eslint-disable-next-line react/no-unused-prop-types
  params: {| username: string |},
  router: ReactRouterType,
  user: UserType | null,
  username: string,
|};

type FormValues = {|
  biography: string | null,
  displayName: string | null,
  homepage: string | null,
  location: string | null,
  occupation: string | null,
  picture: File | null,
  username: string,
|};

type State = {|
  ...FormValues,
  showProfileDeletionModal: boolean,
  pictureData: string | null,
  successMessage: string | null,
|};

type FileReaderEvent = {|
  target: {|
    result: string,
  |},
|};

export class UserProfileEditBase extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      showProfileDeletionModal: false,
      pictureData: null,
      successMessage: null,
      ...this.getFormValues(props.user),
    };
  }

  componentWillMount() {
    const { dispatch, errorHandler, username, user } = this.props;

    if (errorHandler.hasError()) {
      log.warn('Not loading data because of an error.');
      return;
    }

    if (!user && username) {
      dispatch(fetchUserAccount({
        errorHandlerId: errorHandler.id,
        username,
      }));
    }

    if ((!user && username) || (user && !user.notifications)) {
      dispatch(fetchUserNotifications({
        errorHandlerId: errorHandler.id,
        username,
      }));
    }
  }

  componentWillReceiveProps(props: Props) {
    const {
      isUpdating: wasUpdating,
      user: oldUser,
      username: oldUsername,
    } = this.props;

    const {
      clientApp,
      dispatch,
      errorHandler,
      i18n,
      isUpdating,
      lang,
      params,
      router,
      user: newUser,
      username: newUsername,
    } = props;

    if (oldUsername !== newUsername) {
      if (!newUser && newUsername) {
        dispatch(fetchUserAccount({
          errorHandlerId: errorHandler.id,
          username: newUsername,
        }));
      }

      if ((!newUser && newUsername) || (newUser && !newUser.notifications)) {
        dispatch(fetchUserNotifications({
          errorHandlerId: errorHandler.id,
          username: newUser ? newUser.username : newUsername,
        }));
      }

      this.setState({
        ...this.getFormValues(newUser),
        pictureData: null,
        successMessage: null,
      });
    }

    if (wasUpdating && !isUpdating && !errorHandler.hasError()) {
      this.setState({
        pictureData: null,
        successMessage: i18n.gettext('Profile successfully updated'),
      });
    }

    if (oldUser && oldUser.picture_url && newUser && !newUser.picture_url) {
      this.setState({
        pictureData: null,
        successMessage: i18n.gettext('Picture successfully deleted'),
      });
    }

    if (params.username && oldUsername !== newUsername) {
      router.push(`/${lang}/${clientApp}/user/${newUsername}/edit/`);
    }
  }

  onDeleteProfile = (e: SyntheticEvent<HTMLButtonElement>) => {
    e.preventDefault();

    this.setState({ showProfileDeletionModal: true });
  }

  onCancelProfileDeletion = (e: SyntheticEvent<HTMLButtonElement>) => {
    e.preventDefault();

    this.setState({ showProfileDeletionModal: false });
  }

  onConfirmProfileDeletion = (e: SyntheticEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const {
      clientApp,
      currentUser,
      dispatch,
      errorHandler,
      lang,
      router,
      user,
    } = this.props;

    invariant(currentUser, 'currentUser is required');
    invariant(user, 'user is required');

    dispatch(deleteUserAccount({
      errorHandlerId: errorHandler.id,
      userId: user.id,
    }));

    if (currentUser.id === user.id) {
      dispatch(logOutUser());
    }

    router.push(`/${lang}/${clientApp}`);
  }

  onPictureLoaded = (e: FileReaderEvent) => {
    this.setState({ pictureData: e.target.result });
  }

  onPictureChange = (event: SyntheticEvent<HTMLInputElement>) => {
    event.preventDefault();

    const { files } = event.currentTarget;

    if (files && files[0]) {
      const picture = files[0];

      this.loadPicture(picture);

      this.setState({
        picture,
        successMessage: null,
      });
    }
  }

  onPictureDelete = (event: SyntheticEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const { dispatch, errorHandler, user } = this.props;

    invariant(user, 'user is required');

    dispatch(deleteUserPicture({
      errorHandlerId: errorHandler.id,
      userId: user.id,
    }));
  }

  onFieldChange = (event: SyntheticEvent<HTMLInputElement>) => {
    event.preventDefault();

    const { name, value } = event.currentTarget;

    this.setState({
      [name]: value,
      successMessage: null,
    });
  }

  onSubmit = (event: SyntheticEvent<any>) => {
    event.preventDefault();

    const { dispatch, errorHandler, user } = this.props;
    const {
      biography,
      displayName,
      homepage,
      location,
      occupation,
      picture,
      username,
    } = this.state;

    invariant(user, 'user is required');

    dispatch(editUserAccount({
      errorHandlerId: errorHandler.id,
      picture,
      userFields: {
        biography,
        display_name: displayName,
        homepage,
        location,
        occupation,
        username,
      },
      userId: user.id,
    }));
  }

  getFormValues(user: UserType | null): FormValues {
    const defaultFormValues = {
      biography: '',
      displayName: '',
      homepage: '',
      location: '',
      occupation: '',
      picture: null,
      username: this.props.username,
    };

    if (!user) {
      return defaultFormValues;
    }

    const {
      biography,
      display_name: displayName,
      homepage,
      location,
      occupation,
      username,
    } = user;

    return {
      ...defaultFormValues,
      biography,
      displayName,
      homepage,
      location,
      occupation,
      username,
    };
  }

  loadPicture = (picture: File) => {
    const reader = new FileReader();
    reader.onload = this.onPictureLoaded;
    reader.readAsDataURL(picture);
  }

  preventSubmit() {
    const { user, isUpdating } = this.props;
    const { username } = this.state;

    return !user || isUpdating || !username || (username &&
      username.trim() === '');
  }

  render() {
    const {
      currentUser,
      errorHandler,
      hasEditPermission,
      i18n,
      isUpdating,
      router,
      user,
      username,
    } = this.props;

    if (!currentUser) {
      return (
        <div className="UserProfileEdit">
          <Card className="UserProfileEdit-user-links">
            <AuthenticateButton
              noIcon
              location={router.location}
              logInText={i18n.gettext('Log in to edit the profile')}
            />
          </Card>
        </div>
      );
    }

    let errorMessage;
    if (errorHandler.hasError()) {
      log.warn('Captured API Error:', errorHandler.capturedError);

      if (errorHandler.capturedError.responseStatusCode === 404) {
        return <NotFound errorCode={errorHandler.capturedError.code} />;
      }

      errorMessage = errorHandler.renderError();
    }

    if (user && !hasEditPermission) {
      return <NotFound />;
    }

    const isEditingCurrentUser = currentUser && user ? currentUser.id ===
      user.id : false;

    return (
      <div className="UserProfileEdit">
        {user && (
          <Helmet>
            <title>
              {i18n.sprintf(
                i18n.gettext('User Profile for %(user)s'),
                { user: user.name }
              )}
            </title>
          </Helmet>
        )}

        <Card className="UserProfileEdit-user-links">
          <ul>
            <li>
              <Link to={`/user/${username}/`}>
                {isEditingCurrentUser ?
                  i18n.gettext('View My Profile') :
                  i18n.gettext(`View user's profile`)
                }
              </Link>
            </li>
            <li>
              {isEditingCurrentUser ?
                i18n.gettext('Edit My Profile') :
                i18n.gettext(`Edit user's profile`)
              }
            </li>
          </ul>
        </Card>

        <form className="UserProfileEdit-form" onSubmit={this.onSubmit}>
          <div className="UserProfileEdit-form-messages">
            {errorMessage}

            {this.state.successMessage && (
              <Notice type="success">
                {this.state.successMessage}
              </Notice>
            )}
          </div>
          <div>
            <Card
              className="UserProfileEdit--Card"
              header={isEditingCurrentUser ? i18n.gettext('Account') : (
                i18n.sprintf(i18n.gettext('Account for %(username)s'), {
                  username,
                })
              )}
            >
              <label className="UserProfileEdit--label" htmlFor="username">
                {i18n.gettext('Username')}
              </label>
              <input
                className="UserProfileEdit-username"
                disabled={!user}
                id="username"
                name="username"
                onChange={this.onFieldChange}
                value={this.state.username}
              />

              <div title={i18n.gettext('Email address cannot be changed here')}>
                <label className="UserProfileEdit--label" htmlFor="email">
                  {i18n.gettext('Email Address')}
                </label>
                <input
                  className="UserProfileEdit-email"
                  disabled
                  defaultValue={user && user.email}
                  onChange={this.onFieldChange}
                  type="email"
                />
                {isEditingCurrentUser && (
                  <p
                    className="UserProfileEdit-email--help"
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={
                      sanitizeHTML(
                        i18n.sprintf(
                          i18n.gettext(`You can change your email address on
                            Firefox Accounts. %(startLink)sNeed help?%(endLink)s`
                          ),
                          {
                            startLink: '<a href="https://support.mozilla.org/kb/change-primary-email-address-firefox-accounts">',
                            endLink: '</a>',
                          }
                        ), ['a'])
                    }
                  />
                )}
              </div>
            </Card>

            <Card
              className="UserProfileEdit--Card"
              header={i18n.gettext('Profile')}
            >
              <p className="UserProfileEdit-profile-aside">
                {isEditingCurrentUser ? i18n.gettext(
                  `Tell users a bit more information about yourself. These
                  fields are optional, but they'll help other users get to know
                  you better.`
                ) : i18n.sprintf(
                  i18n.gettext(
                    `Tell users a bit more information about this user. These
                    fields are optional, but they'll help other users get to
                    know %(username)s better.`
                  ), { username }
                )}
              </p>

              <label className="UserProfileEdit--label" htmlFor="displayName">
                {i18n.gettext('Display Name')}
              </label>
              <input
                className="UserProfileEdit-displayName"
                disabled={!user}
                id="displayName"
                name="displayName"
                onChange={this.onFieldChange}
                value={this.state.displayName}
              />

              {/*
                TODO: Don't show these to users who don't have a public-facing
                user profile page (eg are developers). It's just noise and may
                encourage them to enter a lot of text (especially the bio) which
                no one will see. It also gets in the way of settings,
                like notifications, below.
                See: https://github.com/mozilla/addons-frontend/issues/4964
              */}
              <label className="UserProfileEdit--label" htmlFor="homepage">
                {i18n.gettext('Homepage')}
              </label>
              <input
                className="UserProfileEdit-homepage"
                disabled={!user}
                id="homepage"
                name="homepage"
                onChange={this.onFieldChange}
                type="url"
                value={this.state.homepage}
              />
              <p className="UserProfileEdit-homepage--help">
                {i18n.gettext(`This URL will only be visible for users who are
                  developers.`)}
              </p>

              <label className="UserProfileEdit--label" htmlFor="location">
                {i18n.gettext('Location')}
              </label>
              <input
                className="UserProfileEdit-location"
                disabled={!user}
                id="location"
                name="location"
                onChange={this.onFieldChange}
                value={this.state.location}
              />

              <label className="UserProfileEdit--label" htmlFor="occupation">
                {i18n.gettext('Occupation')}
              </label>
              <input
                className="UserProfileEdit-occupation"
                disabled={!user}
                id="occupation"
                name="occupation"
                onChange={this.onFieldChange}
                value={this.state.occupation}
              />

              <UserProfileEditPicture
                name="picture"
                onDelete={this.onPictureDelete}
                onSelect={this.onPictureChange}
                preview={this.state.pictureData}
                user={user}
              />
            </Card>

            <Card
              className="UserProfileEdit--Card"
              header={i18n.gettext('Biography')}
            >
              <label className="UserProfileEdit--label" htmlFor="biography">
                {isEditingCurrentUser ? i18n.gettext(
                  `Introduce yourself to the community if you like`
                ) : i18n.sprintf(
                  i18n.gettext(`Introduce %(username)s to the community`),
                  { username }
                )}
              </label>
              <Textarea
                className="UserProfileEdit-biography"
                disabled={!user}
                id="biography"
                name="biography"
                onChange={this.onFieldChange}
                value={this.state.biography}
              />
              <p className="UserProfileEdit-biography--help">
                {i18n.sprintf(i18n.gettext(
                  `Some HTML supported: %(htmlTags)s. Links are forbidden.`
                ), {
                  htmlTags: [
                    '<abbr title>',
                    '<acronym title>',
                    '<b>',
                    '<blockquote>',
                    '<code>',
                    '<em>',
                    '<i>',
                    '<li>',
                    '<ol>',
                    '<strong>',
                    '<ul>',
                  ].join(' '),
                })}
              </p>
            </Card>

            <Card
              className="UserProfileEdit--Card"
              header={i18n.gettext('Notifications')}
            >
              <p className="UserProfileEdit-notifications-aside">
                {isEditingCurrentUser ? i18n.gettext(
                  `From time to time, Mozilla may send you email about upcoming
                  releases and add-on events. Please select the topics you are
                  interested in.`
                ) : i18n.gettext(
                  `From time to time, Mozilla may send this user email about
                  upcoming releases and add-on events. Please select the
                  topics this user may be interested in.`
                )}
              </p>

              <UserProfileEditNotifications user={user} />

              {isEditingCurrentUser && (
                <p className="UserProfileEdit-notifications--help">
                  {i18n.gettext(`Mozilla reserves the right to contact you
                    individually about specific concerns with your hosted
                    add-ons.`)}
                </p>
              )}
            </Card>

            <div className="UserProfileEdit-buttons-wrapper">
              <Button
                buttonType="action"
                className="UserProfileEdit-submit-button UserProfileEdit-button"
                disabled={this.preventSubmit()}
                puffy
                type="submit"
              >
                {/* eslint-disable-next-line no-nested-ternary */}
                {isEditingCurrentUser ? (
                  isUpdating ? i18n.gettext('Updating your profile…') :
                    i18n.gettext('Update my profile')
                ) : (
                  isUpdating ? i18n.gettext("Updating user's profile…") :
                    i18n.gettext("Update user's profile")
                )}
              </Button>
              <Button
                buttonType="neutral"
                className="UserProfileEdit-button UserProfileEdit-delete-button"
                disabled={!user}
                onClick={this.onDeleteProfile}
                puffy
                type="button"
              >
                {isEditingCurrentUser ?
                    i18n.gettext('Delete my profile') :
                    i18n.gettext(`Delete user's profile`)}
              </Button>
            </div>
          </div>
        </form>

        {this.state.showProfileDeletionModal && (
          <OverlayCard
            className="UserProfileEdit-deletion-modal"
            header={isEditingCurrentUser ? i18n.gettext(
              `Attention: you are about to delete your profile. Are you sure?`
            ) : i18n.gettext(
              `Attention: you are about to delete a profile. Are you sure?`
            )}
            onEscapeOverlay={this.onCancelProfileDeletion}
            visibleOnLoad
          >
            <p
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={
                sanitizeHTML(i18n.sprintf(
                  i18n.gettext(`If you confirm this
                    %(startStrong)sirreversible action%(endStrong)s, the
                    following data will be removed: profile picture,
                    profile details (including username, email, display
                    name, location, home page, biography, occupation) and
                    notification preferences. Other data such as ratings
                    and reviews will be anonymized.`
                  ), {
                    startStrong: '<strong>',
                    endStrong: '</strong>',
                  }
                ), ['strong'])
              }
            />
            {isEditingCurrentUser && (
              <p>
                {i18n.gettext(`Important: if you own add-ons, you have to
                  transfer them to other users or to delete them before you
                  can delete your profile.`)}
              </p>
            )}
            <div className="UserProfileEdit-buttons-wrapper">
              <Button
                buttonType="alert"
                className="UserProfileEdit-button UserProfileEdit-confirm-button"
                onClick={this.onConfirmProfileDeletion}
                puffy
              >
                {isEditingCurrentUser ?
                    i18n.gettext('Yes, delete my profile') :
                    i18n.gettext('Yes, delete this profile')}
              </Button>
              <Button
                buttonType="cancel"
                className="UserProfileEdit-button UserProfileEdit-cancel-button"
                onClick={this.onCancelProfileDeletion}
              >
                {i18n.gettext('Cancel')}
              </Button>
            </div>
          </OverlayCard>
        )}
      </div>
    );
  }
}

export function mapStateToProps(
  state: {
    api: ApiStateType,
    users: UsersStateType,
  },
  ownProps: Props,
) {
  const { clientApp, lang } = state.api;

  const currentUser = getCurrentUser(state.users);
  const user = ownProps.params.username ?
    getUserByUsername(state.users, ownProps.params.username) : currentUser;

  let hasEditPermission = currentUser && user && currentUser.id === user.id;
  if (currentUser && hasPermission(state, USERS_EDIT)) {
    hasEditPermission = true;
  }

  return {
    clientApp,
    currentUser,
    hasEditPermission,
    isUpdating: state.users.isUpdating,
    lang,
    user,
    username: user ? user.username : ownProps.params.username,
  };
}

export const extractId = (ownProps: Props) => {
  return ownProps.params.username;
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(UserProfileEditBase);
