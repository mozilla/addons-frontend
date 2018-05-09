/* @flow */
import invariant from 'invariant';
import * as React from 'react';
import Textarea from 'react-textarea-autosize';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import NotFound from 'amo/components/ErrorPage/NotFound';
import {
  editUserAccount,
  fetchUserAccount,
  getCurrentUser,
  getUserByUsername,
  hasPermission,
} from 'amo/reducers/users';
import { USERS_EDIT } from 'core/constants';
import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import Button from 'ui/components/Button';
import Card from 'ui/components/Card';
import Notice from 'ui/components/Notice';
import type { UsersStateType, UserType } from 'amo/reducers/users';
import type { DispatchFunc } from 'core/types/redux';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';


type Props = {|
  currentUser: UserType | null,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  hasEditPermission: boolean,
  i18n: I18nType,
  isEditing: boolean,
  // The routing `params` prop is used in `mapStateToProps()`.
  // eslint-disable-next-line react/no-unused-prop-types
  params: {| username: string |},
  user: UserType | null,
  username: string,
|};

type FormValues = {|
  biography: string | null,
  displayName: string | null,
  homepage: string | null,
  location: string | null,
  occupation: string | null,
  username: string | null,
|};

type State = {|
  ...FormValues,
  displaySuccessMessage: boolean,
|};

export class UserProfileEditBase extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      displaySuccessMessage: false,
      ...this.getFormValues(props.user),
    };
  }

  componentWillMount() {
    const { dispatch, errorHandler, username, user } = this.props;

    if (!user && username) {
      dispatch(fetchUserAccount({
        errorHandlerId: errorHandler.id,
        username,
      }));
    }
  }

  componentWillReceiveProps(props: Props) {
    const {
      isEditing: wasEditing,
      user: oldUser,
      username: oldUsername,
    } = this.props;
    const {
      dispatch,
      errorHandler,
      isEditing,
      user: newUser,
      username: newUsername,
    } = props;

    if (!newUser || (!oldUser || oldUser.id !== newUser.id)) {
      this.setState(this.getFormValues(newUser));
    } else if (oldUsername !== newUsername) {
      dispatch(fetchUserAccount({
        errorHandlerId: errorHandler.id,
        username: newUsername,
      }));

      this.setState({ displaySuccessMessage: false });
    }

    if (wasEditing && !isEditing && !errorHandler.hasError()) {
      this.setState({ displaySuccessMessage: true });
    }
  }

  onFieldChange = (event: SyntheticEvent<HTMLInputElement>) => {
    const { name, value } = event.currentTarget;

    event.preventDefault();

    this.setState({
      [name]: value,
      displaySuccessMessage: false,
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
      username,
    } = this.state;

    invariant(user, 'user is required');

    dispatch(editUserAccount({
      errorHandlerId: errorHandler.id,
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

  preventSubmit() {
    const { user, isEditing } = this.props;
    const { username } = this.state;

    return !user || isEditing || !username || (username &&
      username.trim() === '');
  }

  render() {
    const {
      currentUser,
      errorHandler,
      hasEditPermission,
      i18n,
      isEditing,
      user,
      username,
    } = this.props;

    if (!currentUser || (currentUser && user && !hasEditPermission)) {
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
                { user: user.displayName }
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
            {errorHandler.renderErrorIfPresent()}

            {this.state.displaySuccessMessage && (
              <Notice type="success">
                {i18n.gettext('Profile successfully updated.')}
              </Notice>
            )}
          </div>
          <div>
            <Card
              className="UserProfileEdit--Card"
              header={isEditingCurrentUser ? i18n.gettext('Account') : (
                i18n.sprintf(i18n.gettext('User Account for %(username)s'), {
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
                    className="UserProfileEdit--help"
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
              <p className="UserProfileEdit-aside">
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
              <p className="UserProfileEdit--help">
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
              <p className="UserProfileEdit--help">
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
                  isEditing ? i18n.gettext('Updating your profile…') :
                    i18n.gettext('Update my profile')
                ) : (
                  isEditing ? i18n.gettext("Updating user's profile…") :
                    i18n.gettext("Update user's profile")
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

export function mapStateToProps(
  state: { users: UsersStateType },
  ownProps: Props,
) {
  const currentUser = getCurrentUser(state.users);
  const user = ownProps.params.username ?
    getUserByUsername(state.users, ownProps.params.username) : currentUser;

  let hasEditPermission = currentUser && user && currentUser.id === user.id;
  if (currentUser && hasPermission(state, USERS_EDIT)) {
    hasEditPermission = true;
  }

  return {
    currentUser,
    hasEditPermission,
    isEditing: state.users.isEditing,
    user,
    username: user ? user.username : ownProps.params.username,
  };
}

export default compose(
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ name: 'UserProfileEdit' }),
)(UserProfileEditBase);
