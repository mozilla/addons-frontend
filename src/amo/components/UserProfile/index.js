/* @flow */
import invariant from 'invariant';
import * as React from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AddonsByAuthorsCard from 'amo/components/AddonsByAuthorsCard';
import NotFound from 'amo/components/ErrorPage/NotFound';
import ReportUserAbuse from 'amo/components/ReportUserAbuse';
import {
  EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
  THEMES_BY_AUTHORS_PAGE_SIZE,
} from 'amo/reducers/addonsByAuthors';
import {
  fetchUserAccount,
  getCurrentUser,
  getUserByUsername,
  hasPermission,
  isDeveloper,
} from 'amo/reducers/users';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  USERS_EDIT,
} from 'core/constants';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import { removeProtocolFromURL, sanitizeUserHTML } from 'core/utils';
import Button from 'ui/components/Button';
import Card from 'ui/components/Card';
import DefinitionList, { Definition } from 'ui/components/DefinitionList';
import Icon from 'ui/components/Icon';
import LoadingText from 'ui/components/LoadingText';
import Rating from 'ui/components/Rating';
import UserAvatar from 'ui/components/UserAvatar';
import type { UsersStateType, UserType } from 'amo/reducers/users';
import type { DispatchFunc } from 'core/types/redux';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  currentUser: UserType | null,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  canEditProfile: boolean,
  i18n: I18nType,
  isOwner: boolean,
  params: {| username: string |},
  user: UserType | null,
|};

export class UserProfileBase extends React.Component<Props> {
  componentWillMount() {
    const { dispatch, errorHandler, params, user } = this.props;

    if (errorHandler.hasError()) {
      log.warn('Not loading data because of an error.');
      return;
    }

    if (!user) {
      dispatch(
        fetchUserAccount({
          errorHandlerId: errorHandler.id,
          username: params.username,
        }),
      );
    }
  }

  componentWillReceiveProps({ params: newParams }: Props) {
    const { dispatch, errorHandler, params: oldParams } = this.props;

    if (oldParams.username !== newParams.username) {
      dispatch(
        fetchUserAccount({
          errorHandlerId: errorHandler.id,
          username: newParams.username,
        }),
      );
    }
  }

  getURL() {
    const { user } = this.props;

    invariant(user, 'user is required');

    return `/user/${user.username}/`;
  }

  getEditURL() {
    const { currentUser, user } = this.props;

    invariant(user, 'user is required');
    invariant(currentUser, 'currentUser is required');

    if (currentUser.id === user.id) {
      return `/users/edit`;
    }

    return `/user/${user.username}/edit/`;
  }

  render() {
    const {
      errorHandler,
      canEditProfile,
      i18n,
      isOwner,
      params,
      user,
    } = this.props;

    let errorMessage;
    if (errorHandler.hasError()) {
      log.warn('Captured API Error:', errorHandler.capturedError);

      if (errorHandler.capturedError.responseStatusCode === 404) {
        return <NotFound errorCode={errorHandler.capturedError.code} />;
      }

      errorMessage = errorHandler.renderError();
    }

    const userProfileHeader = (
      <div className="UserProfile-header">
        <UserAvatar className="UserProfile-avatar" user={user} />

        {user &&
          isDeveloper(user) && (
            <div className="UserProfile-tags">
              {user.is_addon_developer && (
                <p className="UserProfile-developer">
                  {i18n.gettext('Add-ons developer')}
                  <Icon name="developer" />
                </p>
              )}
              {user.is_artist && (
                <p className="UserProfile-artist">
                  {i18n.gettext('Theme artist')}
                  <Icon name="artist" />
                </p>
              )}
            </div>
          )}

        <h1 className="UserProfile-name">
          {user ? user.name : <LoadingText />}
        </h1>
      </div>
    );
    const userProfileTitle = i18n.sprintf(
      i18n.gettext('User Profile for %(user)s'),
      {
        user: user ? user.name : params.username,
      },
    );

    return (
      <div className="UserProfile">
        <Helmet>
          <title>{userProfileTitle}</title>
        </Helmet>

        {errorMessage}

        <div className="UserProfile-wrapper">
          <Card className="UserProfile-user-info" header={userProfileHeader}>
            <DefinitionList className="UserProfile-dl">
              {user && user.homepage ? (
                <Definition
                  className="UserProfile-homepage"
                  term={i18n.gettext('Homepage')}
                >
                  <a href={user.homepage}>
                    {removeProtocolFromURL(user.homepage)}
                  </a>
                </Definition>
              ) : null}
              {user && user.location ? (
                <Definition
                  className="UserProfile-location"
                  term={i18n.gettext('Location')}
                >
                  {user.location}
                </Definition>
              ) : null}
              {user && user.occupation ? (
                <Definition
                  className="UserProfile-occupation"
                  term={i18n.gettext('Occupation')}
                >
                  {user.occupation}
                </Definition>
              ) : null}
              <Definition
                className="UserProfile-user-since"
                term={i18n.gettext('User since')}
              >
                {user ? (
                  i18n.moment(user.created).format('ll')
                ) : (
                  <LoadingText />
                )}
              </Definition>
              <Definition
                className="UserProfile-number-of-addons"
                term={i18n.gettext('Number of add-ons')}
              >
                {user ? user.num_addons_listed : <LoadingText />}
              </Definition>
              <Definition
                className="UserProfile-rating-average"
                term={i18n.gettext('Average rating of developer’s add-ons')}
              >
                {user ? (
                  <Rating
                    rating={user.average_addon_rating}
                    readOnly
                    styleName="small"
                  />
                ) : (
                  <LoadingText />
                )}
              </Definition>
              {user && user.biography && user.biography.length ? (
                <Definition
                  className="UserProfile-biography"
                  term={i18n.gettext('Biography')}
                >
                  <p
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={sanitizeUserHTML(user.biography)}
                  />
                </Definition>
              ) : null}
            </DefinitionList>

            {!isOwner && (
              <ReportUserAbuse
                className="UserProfile-abuse-button"
                user={user}
              />
            )}

            {canEditProfile ? (
              <Button
                className="UserProfile-edit-link"
                buttonType="neutral"
                to={this.getEditURL()}
                puffy
              >
                {i18n.gettext('Edit profile')}
              </Button>
            ) : null}
          </Card>

          {user &&
            user.username && (
              <div className="UserProfile-addons-by-author">
                <AddonsByAuthorsCard
                  addonType={ADDON_TYPE_EXTENSION}
                  authorDisplayName={user.name}
                  authorUsernames={[user.username]}
                  numberOfAddons={EXTENSIONS_BY_AUTHORS_PAGE_SIZE}
                  pageParam="page_e"
                  paginate
                  pathname={this.getURL()}
                  showMore={false}
                  showSummary
                  type="vertical"
                />

                <AddonsByAuthorsCard
                  addonType={ADDON_TYPE_THEME}
                  authorDisplayName={user.name}
                  authorUsernames={[user.username]}
                  numberOfAddons={THEMES_BY_AUTHORS_PAGE_SIZE}
                  pageParam="page_t"
                  paginate
                  pathname={this.getURL()}
                  showMore={false}
                />
              </div>
            )}
        </div>
      </div>
    );
  }
}

export function mapStateToProps(
  state: {| users: UsersStateType |},
  ownProps: Props,
) {
  const currentUser = getCurrentUser(state.users);
  const user = getUserByUsername(state.users, ownProps.params.username);
  const isOwner = currentUser && user && currentUser.id === user.id;

  const canEditProfile =
    currentUser &&
    user &&
    (currentUser.id === user.id || hasPermission(state, USERS_EDIT));

  return {
    currentUser,
    canEditProfile,
    isOwner,
    user,
  };
}

export const extractId = (ownProps: Props) => {
  return ownProps.params.username;
};

const UserProfile: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(UserProfileBase);

export default UserProfile;
