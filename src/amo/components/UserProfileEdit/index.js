/* @flow */
import * as React from 'react';
import Textarea from 'react-textarea-autosize';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import {
  editUserAccount,
  fetchUserAccount,
  getCurrentUser,
  getUserByUsername,
} from 'amo/reducers/users';
import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import { sanitizeHTML } from 'core/utils';
import Button from 'ui/components/Button';
import Card from 'ui/components/Card';
import type { UsersStateType, UserType } from 'amo/reducers/users';
import type { DispatchFunc } from 'core/types/redux';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';


type Props = {|
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  isEditing: boolean,
  isEditingCurrentUser: boolean,
  params: {| username: string |},
  user?: UserType,
  username: string,
|};

const getValueOrEmpty = (input) => {
  if (input && input.value) {
    return input.value;
  }

  return '';
};

export class UserProfileEditBase extends React.Component<Props> {
  displayName: HTMLInputElement | null;

  componentWillMount() {
    const { dispatch, errorHandler, params, user } = this.props;

    if (!user && params.username) {
      dispatch(fetchUserAccount({
        errorHandlerId: errorHandler.id,
        username: params.username,
      }));
    }
  }

  componentWillReceiveProps({ params: newParams }: Props) {
    const { dispatch, errorHandler, params: oldParams } = this.props;

    if (oldParams.username !== newParams.username) {
      dispatch(fetchUserAccount({
        errorHandlerId: errorHandler.id,
        username: newParams.username,
      }));
    }
  }

  onSubmit = (event: SyntheticEvent<any>) => {
    event.preventDefault();

    const { dispatch, errorHandler, user } = this.props;

    // This should never happen in real life, but Flow complains without this
    // check...
    if (!user) {
      log.debug('Form has been submitted but no user passed as prop.');
      return;
    }

    dispatch(editUserAccount({
      errorHandlerId: errorHandler.id,
      userFields: {
        biography: getValueOrEmpty(this.biography),
        display_name: getValueOrEmpty(this.displayName),
        homepage: getValueOrEmpty(this.homepage),
        location: getValueOrEmpty(this.location),
        occupation: getValueOrEmpty(this.occupation),
        username: getValueOrEmpty(this.username),
      },
      userId: user.id,
    }));
  }

  biography: HTMLInputElement | null;
  homepage: HTMLInputElement | null;
  location: HTMLInputElement | null;
  occupation: HTMLInputElement | null;
  username: HTMLInputElement | null;

  render() {
    const {
      errorHandler,
      i18n,
      isEditing,
      isEditingCurrentUser,
      user,
      username,
    } = this.props;

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
                  i18n.gettext('View my profile') :
                  i18n.gettext("View user's profile")
                }
              </Link>
            </li>
            <li>
              {isEditingCurrentUser ?
                i18n.gettext('Edit my profile') :
                i18n.gettext("Edit user's profile")
              }
            </li>
          </ul>
        </Card>

        <form
          action=""
          className="UserProfileEdit-form"
          onSubmit={this.onSubmit}
        >
          <div>
            {errorHandler.renderErrorIfPresent()}

            <Card
              className="UserProfileEdit--Card"
              header={isEditingCurrentUser ? i18n.gettext('Your Account') : (
                i18n.sprintf(i18n.gettext('User Account for %(username)s'), {
                  username,
                })
              )}
            >
              <p className="UserProfileEdit-aside">
                {i18n.gettext(`Manage basic account information, such as your
                  username and Firefox Accounts settings.`)}
              </p>

              <label className="UserProfileEdit--label" htmlFor="username">
                {i18n.gettext('Username')}
              </label>
              <input
                className="UserProfileEdit-username"
                disabled={!user}
                id="username"
                name="username"
                ref={(ref) => { this.username = ref; }}
                defaultValue={user && user.username}
              />

              <div title={i18n.gettext('Email address cannot be changed here')}>
                <label className="UserProfileEdit--label" htmlFor="email">
                  {i18n.gettext('Email address')}
                </label>
                <input
                  className="UserProfileEdit-email"
                  disabled
                  defaultValue={user && user.email}
                  type="email"
                />
                <p
                  className="UserProfileEdit--help"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={
                    sanitizeHTML(
                      i18n.sprintf(
                        i18n.gettext(`You can change your email address on
                          Firefox Accounts. %(startLink)sLearn how%(endLink)s.`
                        ),
                        {
                          startLink: '<a href="https://support.mozilla.org/kb/change-primary-email-address-firefox-accounts">',
                          endLink: '</a>',
                        }
                      ), ['a'])
                  }
                />
              </div>
            </Card>

            <Card
              className="UserProfileEdit--Card"
              header={i18n.gettext('Your Profile')}
            >
              <p className="UserProfileEdit-aside">
                {i18n.gettext(`Tell users a bit more information about yourself.
                  These fields are optional, but they'll help other users get to
                  know you better.`)}
              </p>

              <label className="UserProfileEdit--label" htmlFor="displayName">
                {i18n.gettext('Display Name')}
              </label>
              <input
                className="UserProfileEdit-displayName"
                disabled={!user}
                id="displayName"
                name="displayName"
                ref={(ref) => { this.displayName = ref; }}
                defaultValue={user && user.displayName}
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
                ref={(ref) => { this.homepage = ref; }}
                defaultValue={user && user.homepage}
                type="url"
              />

              <label className="UserProfileEdit--label" htmlFor="location">
                {i18n.gettext('Location')}
              </label>
              <input
                className="UserProfileEdit-location"
                disabled={!user}
                id="location"
                name="location"
                ref={(ref) => { this.location = ref; }}
                defaultValue={user && user.location}
              />

              <label className="UserProfileEdit--label" htmlFor="occupation">
                {i18n.gettext('Occupation')}
              </label>
              <input
                className="UserProfileEdit-occupation"
                disabled={!user}
                id="occupation"
                name="occupation"
                ref={(ref) => { this.occupation = ref; }}
                defaultValue={user && user.occupation}
              />
            </Card>

            <Card
              className="UserProfileEdit--Card"
              header={i18n.gettext('Your Biography')}
            >
              <label className="UserProfileEdit--label" htmlFor="biography">
                {i18n.gettext(`Introduce yourself to the community. This text
                  will appear on your user profile page.
                  (Some HTML supported)`)}
              </label>
              <Textarea
                className="UserProfileEdit-biography"
                disabled={!user}
                id="biography"
                name="biography"
                ref={(ref) => { this.biography = ref; }}
                defaultValue={user && user.biography}
              />
            </Card>

            <div className="UserProfileEdit-buttons-wrapper">
              <Button
                buttonType="action"
                className="UserProfileEdit-submit-button UserProfileEdit-button"
                disabled={!user || isEditing}
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

  return {
    currentUser,
    isEditing: state.users.isEditing,
    isEditingCurrentUser: currentUser && user && currentUser.id === user.id,
    user,
    username: user ? user.username : ownProps.params.username,
  };
}

export default compose(
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ name: 'UserProfileEdit' }),
)(UserProfileEditBase);
