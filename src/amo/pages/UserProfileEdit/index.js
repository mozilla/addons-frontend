/* @flow */
/* global window */
import url from 'url';

import invariant from 'invariant';
import * as React from 'react';
import Textarea from 'react-textarea-autosize';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import NotFoundPage from 'amo/pages/ErrorPages/NotFoundPage';
import Page from 'amo/components/Page';
import UserProfileEditNotifications from 'amo/components/UserProfileEditNotifications';
import UserProfileEditPicture from 'amo/components/UserProfileEditPicture';
import {
  deleteUserAccount,
  deleteUserPicture,
  updateUserAccount,
  fetchUserAccount,
  fetchUserNotifications,
  getCurrentUser,
  getUserById,
  hasPermission,
  isDeveloper,
  logOutUser,
} from 'amo/reducers/users';
import AuthenticateButton from 'amo/components/AuthenticateButton';
import { USERS_EDIT, VIEW_CONTEXT_HOME } from 'amo/constants';
import { withFixedErrorHandler } from 'amo/errorHandler';
import log from 'amo/logger';
import translate from 'amo/i18n/translate';
import { sanitizeHTML } from 'amo/utils';
import Button from 'amo/components/Button';
import Card from 'amo/components/Card';
import LoadingText from 'amo/components/LoadingText';
import Notice from 'amo/components/Notice';
import OverlayCard from 'amo/components/OverlayCard';
import type {
  NotificationsUpdateType,
  UserId,
  UserType,
} from 'amo/reducers/users';
import type { AppState } from 'amo/store';
import type { ElementEvent, HTMLElementEventHandler } from 'amo/types/dom';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { I18nType } from 'amo/types/i18n';
import type { DispatchFunc } from 'amo/types/redux';
import type {
  ReactRouterHistoryType,
  ReactRouterLocationType,
  ReactRouterMatchType,
} from 'amo/types/router';
import { setViewContext } from 'amo/actions/viewContext';
import { isMzaBranding } from 'amo/utils/fxa';

import './styles.scss';

type Props = {||};

type PropsFromState = {|
  clientApp: string,
  currentUser: UserType | null,
  hasEditPermission: boolean,
  isEditingCurrentUser: boolean,
  isUpdating: boolean,
  lang: string,
  user: UserType | null,
  userId: UserId,
|};

type DefaultProps = {|
  _window: typeof window | Object,
|};

type InternalProps = {|
  ...PropsFromState,
  ...DefaultProps,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  history: ReactRouterHistoryType,
  i18n: I18nType,
  location: ReactRouterLocationType,
  // `match` is used in `mapStateToProps()`
  // eslint-disable-next-line react/no-unused-prop-types
  match: {|
    ...ReactRouterMatchType,
    params: {| userId: string |},
  |},
|};

type FormValues = {|
  biography: string | null,
  displayName: string | null,
  homepage: string | null,
  location: string | null,
  notifications: NotificationsUpdateType,
  occupation: string | null,
  picture: File | null,
|};

type State = {|
  ...FormValues,
  showProfileDeletionModal: boolean,
  pictureData: string | null,
  successMessage: string | null,
|};

export class UserProfileEditBase extends React.Component<InternalProps, State> {
  static defaultProps: DefaultProps = {
    _window: typeof window !== 'undefined' ? window : {},
  };

  constructor(props: InternalProps) {
    super(props);

    const { dispatch, errorHandler, userId, user } = props;

    this.state = {
      showProfileDeletionModal: false,
      pictureData: null,
      successMessage: null,
      ...this.getFormValues(user),
    };

    dispatch(setViewContext(VIEW_CONTEXT_HOME));

    if (errorHandler.hasError()) {
      log.warn('Not loading data because of an error.');
      return;
    }

    if (!user && userId) {
      dispatch(
        fetchUserAccount({
          errorHandlerId: errorHandler.id,
          userId,
        }),
      );
    }

    if ((!user && userId) || (user && !user.notifications)) {
      dispatch(
        fetchUserNotifications({
          errorHandlerId: errorHandler.id,
          userId,
        }),
      );
    }
  }

  componentDidUpdate(prevProps: InternalProps, prevState: State) {
    const {
      isUpdating: wasUpdating,
      user: oldUser,
      userId: oldUserId,
    } = prevProps;

    const {
      clientApp,
      currentUser,
      dispatch,
      errorHandler,
      i18n,
      isUpdating,
      lang,
      location,
      user: newUser,
      userId: newUserId,
    } = this.props;

    if (!currentUser) {
      return;
    }

    if (oldUserId !== newUserId) {
      if (!newUser && newUserId) {
        dispatch(
          fetchUserAccount({
            errorHandlerId: errorHandler.id,
            userId: newUserId,
          }),
        );
      }

      if ((!newUser && newUserId) || (newUser && !newUser.notifications)) {
        dispatch(
          fetchUserNotifications({
            errorHandlerId: errorHandler.id,
            userId: newUser ? newUser.id : newUserId,
          }),
        );
      }

      // eslint-disable-next-line react/no-did-update-set-state
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
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        picture: null,
        pictureData: null,
        successMessage: i18n.gettext('Picture successfully deleted'),
      });
    }

    if (wasUpdating && !isUpdating && !errorHandler.hasError()) {
      let toPath = location.query.to;
      if (toPath && typeof toPath === 'string') {
        toPath = url.parse(toPath).pathname;
        if (toPath && !toPath.startsWith('//')) {
          try {
            this.props._window.location.assign(toPath);
            return;
          } catch (error) {
            log.warn(`Error redirecting to location: ${toPath}: ${error}`);
          }
        }
      }
      this.props._window.location.assign(
        `/${lang}/${clientApp}/user/${newUserId}/`,
      );
    }

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

  onDeleteProfile: HTMLElementEventHandler = (e: ElementEvent) => {
    e.preventDefault();

    this.setState({ showProfileDeletionModal: true });
  };

  onCancelProfileDeletion: (e: ElementEvent | null) => void = (
    e: ElementEvent | null,
  ) => {
    if (e) {
      e.preventDefault();
    }

    this.setState({ showProfileDeletionModal: false });
  };

  onConfirmProfileDeletion: HTMLElementEventHandler = (e: ElementEvent) => {
    e.preventDefault();

    const {
      clientApp,
      currentUser,
      dispatch,
      errorHandler,
      history,
      lang,
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

  onPictureLoaded: (e: ProgressEvent) => void = (e: ProgressEvent) => {
    // $FlowFixMe: `result` should exist.
    const { result } = e.target;

    this.setState({ pictureData: result });
  };

  onPictureChange: (event: SyntheticEvent<HTMLInputElement>) => void = (
    event: SyntheticEvent<HTMLInputElement>,
  ) => {
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

  onNotificationChange: (event: SyntheticEvent<HTMLInputElement>) => void = (
    event: SyntheticEvent<HTMLInputElement>,
  ) => {
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

  onPictureDelete: HTMLElementEventHandler = (event: ElementEvent) => {
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

  onFieldChange: (event: SyntheticEvent<HTMLInputElement>) => void = (
    event: SyntheticEvent<HTMLInputElement>,
  ) => {
    event.preventDefault();

    const { name, value } = event.currentTarget;

    this.setState({
      [name]: value,
      successMessage: null,
    });
  };

  onSubmit: HTMLElementEventHandler = (event: ElementEvent) => {
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
    } = user;

    return {
      ...defaultFormValues,
      biography,
      displayName,
      homepage,
      location,
      occupation,
    };
  }

  loadPicture: (picture: File) => void = (picture: File) => {
    const reader = new FileReader();
    reader.onload = this.onPictureLoaded;
    reader.readAsDataURL(picture);
  };

  preventSubmit(): boolean {
    const { user, isUpdating } = this.props;
    const { displayName } = this.state;

    return (
      !user ||
      isUpdating ||
      !displayName ||
      (displayName && displayName.trim() === '')
    );
  }

  renderProfileAside(): string | Array<React.Node> {
    const { user, i18n, isEditingCurrentUser } = this.props;

    if (!user) {
      return [
        <LoadingText key="profile-aside-1" width={100} />,
        <LoadingText key="profile-aside-2" width={80} />,
      ];
    }

    return isEditingCurrentUser
      ? i18n.gettext(`Tell users a bit more information about yourself. Most
        fields are optional, but they'll help other users get to know you
        better.`)
      : i18n.sprintf(
          i18n.gettext(`Tell users a bit more information about this user.
            Most fields are optional, but they'll help other users get to know
            %(userName)s better.`),
          { userName: user.name },
        );
  }

  renderBiographyLabel(): React.Node | string {
    const { user, i18n, isEditingCurrentUser } = this.props;

    if (!user) {
      return <LoadingText />;
    }

    return isEditingCurrentUser
      ? i18n.gettext(`Introduce yourself to the community if you like`)
      : i18n.sprintf(i18n.gettext(`Introduce %(userName)s to the community`), {
          userName: user.name,
        });
  }

  render(): React.Node {
    const {
      currentUser,
      errorHandler,
      hasEditPermission,
      i18n,
      isEditingCurrentUser,
      isUpdating,
      user,
      userId,
    } = this.props;

    let alternateOutput;
    let errorMessage;

    if (!currentUser) {
      alternateOutput = (
        <div className="UserProfileEdit">
          <Card className="UserProfileEdit-authenticate">
            <AuthenticateButton
              noIcon
              logInText={i18n.gettext('Log in to edit the profile')}
            />
          </Card>
        </div>
      );
    } else {
      if (errorHandler.hasError()) {
        log.warn(`Captured API Error: ${errorHandler.capturedError.messages}`);

        if (errorHandler.capturedError.responseStatusCode === 404) {
          return <NotFoundPage />;
        }

        errorMessage = errorHandler.renderError();
      }

      if (user && !hasEditPermission) {
        return <NotFoundPage />;
      }
    }

    let submitButtonText = isUpdating
      ? i18n.gettext('Creating your profile…')
      : i18n.gettext('Create My Profile');
    if (user && user.display_name) {
      if (isEditingCurrentUser) {
        submitButtonText = isUpdating
          ? i18n.gettext('Updating your profile…')
          : i18n.gettext('Update My Profile');
      } else {
        submitButtonText = isUpdating
          ? i18n.gettext('Updating profile…')
          : i18n.gettext('Update Profile');
      }
    }

    const userProfileURL = `/user/${userId}/`;
    const overlayClassName = 'UserProfileEdit-deletion-modal';

    return (
      <Page>
        <div className="warning-container">
          <Notice
            type="warning"
            key="MzA-branding"
            className="MzA-branding"
            actionText={i18n.gettext('Learn more')}
            actionHref="https://support.mozilla.org/en-US/kb/change-primary-email-address-firefox-accounts"
            actionTarget="_blank"
          >
            {i18n.gettext(
              'Firefox accounts will be renamed to Mozilla accounts on Nov 1. You will still sign in with the same username and password, and there are no other changes to the products that you use.',
            )}
          </Notice>
        </div>
        {alternateOutput || (
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
                    isEditingCurrentUser || !user
                      ? i18n.gettext('Account')
                      : i18n.sprintf(i18n.gettext('Account for %(userName)s'), {
                          userName: user.name,
                        })
                  }
                >
                  <div>
                    <label className="UserProfileEdit--label" htmlFor="email">
                      {i18n.gettext('Email Address')}
                    </label>
                    <input
                      className="UserProfileEdit-email"
                      id="email"
                      value={user && user.email}
                      disabled
                      onChange={this.onFieldChange}
                      title={i18n.gettext(
                        'Email address cannot be changed here',
                      )}
                      type="email"
                    />
                    {isEditingCurrentUser && (
                      <p
                        className="UserProfileEdit-email--help"
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={sanitizeHTML(
                          i18n.sprintf(
                            isMzaBranding()
                              ? i18n.gettext(`You can change your email address on
                          Mozilla accounts. %(startLink)sNeed help?%(endLink)s`)
                              : i18n.gettext(`You can change your email address on
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
                    {isEditingCurrentUser &&
                      user &&
                      user.fxa_edit_email_url && (
                        <a
                          href={user.fxa_edit_email_url}
                          className="UserProfileEdit-manage-account-link"
                        >
                          {isMzaBranding()
                            ? i18n.gettext('Manage Mozilla accounts…')
                            : i18n.gettext('Manage Firefox Accounts…')}
                        </a>
                      )}
                  </div>
                </Card>

                <Card
                  className="UserProfileEdit--Card"
                  header={i18n.gettext('Profile')}
                >
                  <p className="UserProfileEdit-profile-aside">
                    {this.renderProfileAside()}
                  </p>

                  <label
                    className="UserProfileEdit--label"
                    htmlFor="displayName"
                    title={i18n.gettext('This field is required')}
                  >
                    {
                      // translators: the star is used to indicate a required field
                      i18n.gettext('Display Name *')
                    }
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

                  <label
                    className="UserProfileEdit--label"
                    htmlFor="occupation"
                  >
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
                    {this.renderBiographyLabel()}
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
                    key={user && user.id}
                    onChange={this.onNotificationChange}
                    user={user}
                  />

                  {isEditingCurrentUser && isDeveloper(user) && (
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
                    {submitButtonText}
                  </Button>
                  <Button
                    buttonType="alert"
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
                onEscapeOverlay={this.onCancelProfileDeletion}
                className={overlayClassName}
                header={
                  isEditingCurrentUser
                    ? i18n.gettext(
                        `IMPORTANT: Deleting your Firefox Add-ons profile is irreversible.`,
                      )
                    : i18n.gettext(
                        `IMPORTANT: Deleting this Firefox Add-ons profile is irreversible.`,
                      )
                }
                id={overlayClassName}
                visibleOnLoad
              >
                <p>
                  {isEditingCurrentUser
                    ? i18n.gettext(
                        `Your data will be permanently removed, including
                    profile details (picture, user name, display name,
                    location, home page, biography, occupation), notification
                    preferences, reviews, and collections.`,
                      )
                    : i18n.gettext(
                        `The user’s data will be permanently removed, including
                    profile details (picture, user name, display name,
                    location, home page, biography, occupation), notification
                    preferences, reviews, and collections.`,
                      )}
                </p>
                <p>
                  {isEditingCurrentUser
                    ? i18n.gettext(
                        `If you authored any add-ons they will also be deleted,
                    unless you share ownership with other authors. In that
                    case, you will be removed as an author and the remaining
                    authors will maintain ownership of the add-on.`,
                      )
                    : i18n.gettext(
                        `If the user authored any add-ons they will also be
                    deleted, unless ownership is shared with other authors. In
                    that case, the user will be removed as an author and the
                    remaining authors will maintain ownership of the add-on.`,
                      )}
                </p>

                {isEditingCurrentUser && (
                  <p>
                    {i18n.gettext(
                      `When you use this email address to log in again to
                    addons.mozilla.org, your profile on Firefox Add-ons will
                    not have access to any of its previous content.`,
                    )}
                  </p>
                )}

                <div className="UserProfileEdit-buttons-wrapper">
                  <Button
                    buttonType="alert"
                    className="UserProfileEdit-button UserProfileEdit-confirm-button"
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
        )}
      </Page>
    );
  }
}

function mapStateToProps(
  state: AppState,
  ownProps: InternalProps,
): PropsFromState {
  const { clientApp, lang } = state.api;

  const { params } = ownProps.match;
  const userId = Number(params.userId);

  const currentUser = getCurrentUser(state.users);
  const user = params.userId ? getUserById(state.users, userId) : currentUser;

  let hasEditPermission = Boolean(
    currentUser && user && currentUser.id === user.id,
  );
  if (currentUser && hasPermission(state, USERS_EDIT)) {
    hasEditPermission = true;
  }

  const isEditingCurrentUser =
    currentUser && user ? currentUser.id === user.id : false;

  return {
    clientApp,
    currentUser,
    hasEditPermission,
    isEditingCurrentUser,
    isUpdating: state.users.isUpdating,
    lang,
    user,
    userId: user ? user.id : userId,
  };
}

export const extractId = (ownProps: InternalProps): string => {
  return ownProps.match.params.userId;
};

const UserProfileEdit: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(UserProfileEditBase);

export default UserProfileEdit;
