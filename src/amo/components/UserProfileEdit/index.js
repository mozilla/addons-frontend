import * as React from 'react';
import Textarea from 'react-textarea-autosize';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

// import { setViewContext } from 'amo/actions/viewContext';
// import CategoryIcon from 'amo/components/CategoryIcon';
// import HomeHeroBanner from 'amo/components/HomeHeroBanner';
// import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import Link from 'amo/components/Link';
import {
  editUserAccount,
  fetchUserAccount,
  getCurrentUser,
  getUserByUsername,
} from 'amo/reducers/users';
// import {
//   ADDON_TYPE_EXTENSION,
//   ADDON_TYPE_THEME,
//   SEARCH_SORT_TRENDING,
//   VIEW_CONTEXT_HOME,
// } from 'core/constants';
import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import Button from 'ui/components/Button';
import Card from 'ui/components/Card';
import Icon from 'ui/components/Icon';
import LoadingText from 'ui/components/LoadingText';

import './styles.scss';


export class UserProfileEditBase extends React.Component {
  componentWillMount() {
    const { dispatch, errorHandler, params, user } = this.props;

    if (!user) {
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

  onSubmit = (event) => {
    event.preventDefault();

    const { dispatch, errorHandler, user } = this.props;

    dispatch(editUserAccount({
      errorHandlerId: errorHandler.id,
      userFields: {
        biography: this.biography.value,
        display_name: this.displayName.value,
        homepage: this.homepage.value,
        location: this.location.value,
        occupation: this.occupation.value,
        username: this.username.value,
      },
      userId: user.id,
    }));
  }

  render() {
    const { errorHandler, i18n, isEditingCurrentUser, user, username } = this.props;

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
            {/*
            <li>
              <Link to={`/collections/${currentUser.username}/`}>
                {i18n.gettext('View my collections')}
              </Link>
            </li>
            */}
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
                  username: username,
                })
              )}
            >
              <p className="UserProfileEdit-aside">
                {i18n.gettext(`Manage basic account information, such as your
                  username and Firefox Accounts settings.`)}
              </p>

              <div>
                <label className="UserProfileEdit--label" htmlFor="username">
                  {i18n.gettext('Username')}
                </label>
                {user ? (
                  <input
                    id="username"
                    name="username"
                    ref={(ref) => { this.username = ref; }}
                    defaultValue={user.username}
                  />
                ) : <LoadingText maxWidth={60} />}
              </div>

              <div title={i18n.gettext('Email address cannot be changed')}>
                <label className="UserProfileEdit--label" htmlFor="email">
                  {i18n.gettext('Email address')}
                </label>
                {user ? (
                  <input disabled defaultValue={user.email} type="email" />
                ) : <LoadingText maxWidth={60} />}
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

              <div>
                <label className="UserProfileEdit--label" htmlFor="displayName">
                  {i18n.gettext('Display Name')}
                </label>
                {user ? (
                  <input
                    name="displayName"
                    ref={(ref) => { this.displayName = ref; }}
                    defaultValue={user.displayName}
                  />
                ) : <LoadingText maxWidth={60} />}
              </div>

              {/*
                TODO: Don't show these to users who don't have a public-facing
                user profile page (eg are developers). It's just noise and may
                encourage them to enter a lot of text (especially the bio) which
                no one will see. It also gets in the way of settings,
                like notifications, below.
              */}
              <div>
                <label className="UserProfileEdit--label" htmlFor="homepage">
                  {i18n.gettext('Homepage')}
                </label>
                {user ? (
                  <input
                    id="homepage"
                    name="homepage"
                    ref={(ref) => { this.homepage = ref; }}
                    defaultValue={user.homepage}
                  />
                ) : <LoadingText maxWidth={60} />}
              </div>

              <div>
                <label className="UserProfileEdit--label" htmlFor="location">
                  {i18n.gettext('Location')}
                </label>
                {user ? (
                  <input
                    name="location"
                    ref={(ref) => { this.location = ref; }}
                    defaultValue={user.location}
                  />
                ) : <LoadingText maxWidth={60} />}
              </div>

              <div>
                <label className="UserProfileEdit--label" htmlFor="occupation">
                  {i18n.gettext('Occupation')}
                </label>
                {user ? (
                  <input
                    className="UserProfileEdit-occupation"
                    name="occupation"
                    ref={(ref) => { this.occupation = ref; }}
                    defaultValue={user.occupation}
                  />
                ) : <LoadingText maxWidth={60} />}
              </div>
            </Card>

            <Card
              className="UserProfileEdit--Card"
              header={i18n.gettext('Your Biography')}
            >
              <div>
                <label className="UserProfileEdit--label" htmlFor="biography">
                  {i18n.gettext(`Introduce yourself to the community. This text
                    will appear on your user profile page.
                    (Some HTML supported)`)}
                </label>
                {user ? (
                  <Textarea
                    className="UserProfileEdit-biography"
                    name="biography"
                    ref={(ref) => { this.biography = ref; }}
                    defaultValue={user.biography}
                  />
                ) : <Textarea className="UserProfileEdit-biography" disabled />}
              </div>
            </Card>

            {/*
            <Card
              className="UserProfileEdit--Card"
              header={i18n.gettext('Notification Settings')}
            >
              <p>
                {i18n.gettext(`From time to time, Mozilla may send you email about
                  upcoming releases and add-on events. Please select the topics
                  you are interested in.`)}
              </p>

              <div>
                <label className="UserProfileEdit--label" htmlFor="notify">
                  {i18n.gettext('… when an add-on author responds to my review')}
                </label>
                <input selece={!!user.notifyReview} value="1" type="checkbox" />
              </div>
            </Card>
            */}
            <div className="UserProfileEdit-buttons-wrapper">
              <Button
                buttonType="action"
                className="UserProfileEdit-submit-button UserProfileEdit-button"
                disabled={!user}
                puffy
                type="submit"
              >
                {i18n.gettext('Update my profile')}
              </Button>

              <Button
                buttonType="neutral"
                className="UserProfileEdit-delete-button UserProfileEdit-button"
                disabled={!user}
                type="button"
              >
                {i18n.gettext('Delete my account')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

export function mapStateToProps(state, ownProps) {
  const currentUser = getCurrentUser(state.users);
  // const user = null;
  const user = ownProps.params.username ?
    getUserByUsername(state.users, ownProps.params.username) : currentUser;

  return {
    currentUser,
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
