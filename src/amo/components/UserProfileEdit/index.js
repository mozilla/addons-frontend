/* @flow */
/* global window */
import invariant from 'invariant';
import * as React from 'react';
import Textarea from 'react-textarea-autosize';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import NotFound from 'amo/components/ErrorPage/NotFound';
import UserProfileEditNotifications from 'amo/components/UserProfileEditNotifications';
import UserProfileEditPicture from 'amo/components/UserProfileEditPicture';
import {
  deleteUserAccount,
  deleteUserPicture,
  updateUserAccount,
  fetchUserAccount,
  fetchUserNotifications,
  getCurrentUser,
  getUserByUsername,
  hasPermission,
  isDeveloper,
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
import type { NotificationsUpdateType, UserType } from 'amo/reducers/users';
import type { AppState } from 'amo/store';
import type { DispatchFunc } from 'core/types/redux';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { I18nType } from 'core/types/i18n';
import type {
  ReactRouterHistoryType,
  ReactRouterMatchType,
} from 'core/types/router';

import './styles.scss';

type Props = {|
  _window: typeof window | Object,
  clientApp: string,
  currentUser: UserType | null,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  hasEditPermission: boolean,
  i18n: I18nType,
  isUpdating: boolean,
  lang: string,
  match: {|
    ...ReactRouterMatchType,
    params: {| username: string |},
  |},
  history: ReactRouterHistoryType,
  user: UserType | null,
  username: string,
|};

type FormValues = {|
  biography: string | null,
  displayName: string | null,
  homepage: string | null,
  location: string | null,
  notifications: NotificationsUpdateType,
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
  static defaultProps = {
    _window: typeof window !== 'undefined' ? window : {},
  };

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
      dispatch(
        fetchUserAccount({
          errorHandlerId: errorHandler.id,
          username,
        }),
      );
    }

    if ((!user && username) || (user && !user.notifications)) {
      dispatch(
        fetchUserNotifications({
          errorHandlerId: errorHandler.id,
          username,
        }),
      );
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
      match,
      history,
      user: newUser,
      username: newUsername,
    } = props;

    if (oldUsername !== newUsername) {
      if (!newUser && newUsername) {
        dispatch(
          fetchUserAccount({
            errorHandlerId: errorHandler.id,
            username: newUsername,
          }),
        );
      }

      if ((!newUser && newUsername) || (newUser && !newUser.notifications)) {
        dispatch(
          fetchUserNotifications({
            errorHandlerId: errorHandler.id,
            username: newUser ? newUser.username : newUsername,
          }),
        );
      }

      this.setState({
        ...this.getFormValues(newUser),
        pictureData: null,
        successMessage: null,
      });
    } else if (
      oldUser &&
      oldUser.picture_url &&
      newUser &&
      !newUser.picture_url
    ) {
      this.setState({
        picture: null,
        pictureData: null,
        successMessage: i18n.gettext('Picture successfully deleted'),
      });
    }

    if (wasUpdating && !isUpdating && !errorHandler.hasError()) {
      history.push(`/${lang}/${clientApp}/user/${newUsername}/`);
      return;
    }

    if (match.params.username && oldUsername !== newUsername) {
      history.push(`/${lang}/${clientApp}/user/${newUsername}/edit/`);
    }
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (
      (!prevProps.errorHandler.hasError() &&
        this.props.errorHandler.hasError()) ||
      (!prevState.successMessage && this.state.successMessage)
    ) {
      this.props._window.scroll(0, 0);
    }
  }

  componentWillUnmount() {
    this.props.errorHandler.clear();
  }

  onDeleteProfile = (e: SyntheticEvent<HTMLButtonElement>) => {
    e.preventDefault();

    this.setState({ showProfileDeletionModal: true });
  };

  onCancelProfileDeletion = (e: SyntheticEvent<HTMLButtonElement>) => {
    e.preventDefault();

    this.setState({ showProfileDeletionModal: false });
  };

  onConfirmProfileDeletion = (e: SyntheticEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const {
      clientApp,
      currentUser,
      dispatch,
      errorHandler,
      lang,
      history,
      user,
    } = this.props;

    invariant(currentUser, 'currentUser is required');
    invariant(user, 'user is required');

    dispatch(
      deleteUserAccount({
        errorHandlerId: errorHandler.id,
        userId: user.id,
      }),
    );

    if (currentUser.id === user.id) {
      dispatch(logOutUser());
    }

    history.push(`/${lang}/${clientApp}`);
  };

  onPictureLoaded = (e: FileReaderEvent) => {
    this.setState({ pictureData: e.target.result });
  };

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
  };

  onNotificationChange = (event: SyntheticEvent<HTMLInputElement>) => {
    event.stopPropagation();

    const { name, checked } = event.currentTarget;

    this.setState((prevState) => ({
      notifications: {
        ...prevState.notifications,
        [name]: checked,
      },
      successMessage: null,
    }));
  };

  onPictureDelete = (event: SyntheticEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const { dispatch, errorHandler, user } = this.props;

    invariant(user, 'user is required');

    dispatch(
      deleteUserPicture({
        errorHandlerId: errorHandler.id,
        userId: user.id,
      }),
    );
  };

  onFieldChange = (event: SyntheticEvent<HTMLInputElement>) => {
    event.preventDefault();

    const { name, value } = event.currentTarget;

    this.setState({
      [name]: value,
      successMessage: null,
    });
  };

  onSubmit = (event: SyntheticEvent<any>) => {
    event.preventDefault();

    const { dispatch, errorHandler, user } = this.props;
    const {
      biography,
      displayName,
      homepage,
      location,
      notifications,
      occupation,
      picture,
      pictureData,
      username,
    } = this.state;

    invariant(user, 'user is required');

    dispatch(
      updateUserAccount({
        errorHandlerId: errorHandler.id,
        notifications,
        picture,
        pictureData,
        userFields: {
          biography,
          display_name: displayName,
          homepage,
          location,
          occupation,
          username,
        },
        userId: user.id,
      }),
    );
  };

  getFormValues(user: UserType | null): FormValues {
    const defaultFormValues = {
      biography: '',
      displayName: '',
      homepage: '',
      location: '',
      notifications: {},
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
  };

  preventSubmit() {
    const { user, isUpdating } = this.props;
    const { username } = this.state;

    return (
      !user || isUpdating || !username || (username && username.trim() === '')
    );
  }

  render() {
    const {
      currentUser,
      errorHandler,
      hasEditPermission,
      i18n,
      isUpdating,
      history,
      user,
      username,
    } = this.props;

    if (!currentUser) {
      return (
        <div className="UserProfileEdit">
          <Card className="UserProfileEdit-authenticate">
            <AuthenticateButton
              noIcon
              location={history.location}
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

    const isEditingCurrentUser =
      currentUser && user ? currentUser.id === user.id : false;

    const userProfileURL = `/user/${username}/`;

    return (
      <div className="UserProfileEdit">
        {user && (
          <Helmet>
            <title>
              {i18n.sprintf(i18n.gettext('User Profile for %(user)s'), {
                user: user.name,
              })}
            </title>
          </Helmet>
        )}

        <Card className="UserProfileEdit-user-links">
          <ul>
            <li>
              <Link to={userProfileURL}>
                {isEditingCurrentUser
                  ? i18n.gettext('View My Profile')
                  : i18n.gettext(`View user's profile`)}
              </Link>
            </li>
            <li>
              {isEditingCurrentUser
                ? i18n.gettext('Edit My Profile')
                : i18n.gettext(`Edit user's profile`)}
            </li>
          </ul>
        </Card>

        <form className="UserProfileEdit-form" onSubmit={this.onSubmit}>
          <div className="UserProfileEdit-form-messages">
            {errorMessage}

            {this.state.successMessage && (
              <Notice type="success">{this.state.successMessage}</Notice>
            )}
          </div>
          <div>
            <Card
              className="UserProfileEdit--Card"
              header={
                isEditingCurrentUser
                  ? i18n.gettext('Account')
                  : i18n.sprintf(i18n.gettext('Account for %(username)s'), {
                      username,
                    })
              }
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

              <div>
                <label className="UserProfileEdit--label" htmlFor="email">
                  {i18n.gettext('Email Address')}
                </label>
                <input
                  className="UserProfileEdit-email"
                  defaultValue={user && user.email}
                  disabled
                  onChange={this.onFieldChange}
                  title={i18n.gettext('Email address cannot be changed here')}
                  type="email"
                />
                {isEditingCurrentUser && (
                  <p
                    className="UserProfileEdit-email--help"
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={sanitizeHTML(
                      i18n.sprintf(
                        i18n.gettext(`You can change your email address on
                          Firefox Accounts. %(startLink)sNeed help?%(endLink)s`),
                        {
                          startLink:
                            '<a href="https://support.mozilla.org/kb/change-primary-email-address-firefox-accounts">',
                          endLink: '</a>',
                        },
                      ),
                      ['a'],
                    )}
                  />
                )}
                {isEditingCurrentUser && (
                  <a
                    href="https://accounts.firefox.com/settings"
                    className="UserProfileEdit-manage-account-link"
                  >
                    {i18n.gettext('Manage Firefox Accounts…')}
                  </a>
                )}
              </div>
            </Card>

            <Card
              className="UserProfileEdit--Card"
              header={i18n.gettext('Profile')}
            >
              <p className="UserProfileEdit-profile-aside">
                {isEditingCurrentUser
                  ? i18n.gettext(
                      `Tell users a bit more information about yourself. These
                  fields are optional, but they'll help other users get to know
                  you better.`,
                    )
                  : i18n.sprintf(
                      i18n.gettext(
                        `Tell users a bit more information about this user. These
                    fields are optional, but they'll help other users get to
                    know %(username)s better.`,
                      ),
                      { username },
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
                {isEditingCurrentUser
                  ? i18n.gettext(
                      `Introduce yourself to the community if you like`,
                    )
                  : i18n.sprintf(
                      i18n.gettext(`Introduce %(username)s to the community`),
                      { username },
                    )}
              </label>
              <Textarea
                className="UserProfileEdit-biography"
                disabled={!user}
                id="biography"
                name="biography"
                onChange={this.onFieldChange}
                value={this.state.biography || ''}
              />
              <p className="UserProfileEdit-biography--help">
                {i18n.sprintf(
                  i18n.gettext(
                    `Some HTML supported: %(htmlTags)s. Links are forbidden.`,
                  ),
                  {
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
                  },
                )}
              </p>
            </Card>

            <Card
              className="UserProfileEdit--Card"
              header={i18n.gettext('Notifications')}
            >
              <p className="UserProfileEdit-notifications-aside">
                {isEditingCurrentUser
                  ? i18n.gettext(
                      `From time to time, Mozilla may send you email about
                      upcoming releases and add-on events. Please select the
                      topics you are interested in.`,
                    )
                  : i18n.gettext(
                      `From time to time, Mozilla may send this user email
                      about upcoming releases and add-on events. Please select
                      the topics this user may be interested in.`,
                    )}
              </p>

              <UserProfileEditNotifications
                onChange={this.onNotificationChange}
                user={user}
              />

              {isEditingCurrentUser &&
                isDeveloper(user) && (
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
                {isEditingCurrentUser
                  ? isUpdating
                    ? i18n.gettext('Updating your profile…')
                    : i18n.gettext('Update My Profile')
                  : isUpdating
                    ? i18n.gettext('Updating profile…')
                    : i18n.gettext('Update Profile')}
              </Button>
              <Button
                buttonType="neutral"
                className="UserProfileEdit-button UserProfileEdit-delete-button"
                disabled={!user}
                onClick={this.onDeleteProfile}
                puffy
                type="button"
              >
                {isEditingCurrentUser
                  ? i18n.gettext('Delete My Profile')
                  : i18n.gettext(`Delete Profile`)}
              </Button>
            </div>
          </div>
        </form>

        {this.state.showProfileDeletionModal && (
          <OverlayCard
            className="UserProfileEdit-deletion-modal"
            header={
              isEditingCurrentUser
                ? i18n.gettext(
                    `IMPORTANT: Deleting your Firefox Add-ons profile is irreversible.`,
                  )
                : i18n.gettext(
                    `IMPORTANT: Deleting this Firefox Add-ons profile is irreversible.`,
                  )
            }
            onEscapeOverlay={this.onCancelProfileDeletion}
            visibleOnLoad
          >
            <p>
              {isEditingCurrentUser
                ? i18n.gettext(
                    `Your data will be permanently removed, including profile
                    details (picture, user name, display name, location, home
                    page, biography, occupation) and notification preferences.
                    Your reviews and ratings will be anonymised and no longer
                    editable.`,
                  )
                : i18n.gettext(
                    `The user’s data will be permanently removed, including
                    profile details (picture, user name, display name,
                    location, home page, biography, occupation) and
                    notification preferences. Reviews and ratings will be
                    anonymised and no longer editable.`,
                  )}
            </p>
            {isEditingCurrentUser && (
              <p>
                {i18n.gettext(
                  `When you use this email address to login again to
                  addons.mozilla.org, you will create a new Firefox Add-ons
                  profile that is in no way associated with the profile you
                  deleted.`,
                )}
              </p>
            )}
            <p
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={sanitizeHTML(
                i18n.sprintf(
                  isEditingCurrentUser
                    ? i18n.gettext(
                        `%(strongStart)sNOTE:%(strongEnd)s You cannot delete
                        your profile if you are the %(linkStart)sauthor of any
                        add-ons%(linkEnd)s. You must %(docLinkStart)stransfer
                        ownership%(docLinkEnd)s or delete the add-ons before
                        you can delete your profile.`,
                      )
                    : i18n.gettext(
                        `%(strongStart)sNOTE:%(strongEnd)s You cannot delete a
                        user’s profile if the user is the %(linkStart)sauthor
                        of any add-ons%(linkEnd)s.`,
                      ),
                  {
                    linkStart: `<a href="${userProfileURL}">`,
                    linkEnd: '</a>',
                    docLinkStart:
                      '<a href="https://developer.mozilla.org/Add-ons/Distribution#More_information_about_AMO">',
                    docLinkEnd: '</a>',
                    strongStart: '<strong>',
                    strongEnd: '</strong>',
                  },
                ),
                ['a', 'strong'],
              )}
            />
            <div className="UserProfileEdit-buttons-wrapper">
              <Button
                buttonType="alert"
                className="UserProfileEdit-button UserProfileEdit-confirm-button"
                disabled={user && user.num_addons_listed > 0}
                onClick={this.onConfirmProfileDeletion}
                puffy
              >
                {isEditingCurrentUser
                  ? i18n.gettext('Delete My Profile')
                  : i18n.gettext('Delete Profile')}
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

export function mapStateToProps(state: AppState, ownProps: Props) {
  const { clientApp, lang } = state.api;
  const { params } = ownProps.match;

  const currentUser = getCurrentUser(state.users);
  const user = params.username
    ? getUserByUsername(state.users, params.username)
    : currentUser;

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
    username: user ? user.username : params.username,
  };
}

export const extractId = (ownProps: Props) => {
  return ownProps.match.params.username;
};

const UserProfileEdit: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(UserProfileEditBase);

export default UserProfileEdit;
