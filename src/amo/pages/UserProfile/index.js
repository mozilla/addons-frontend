/* @flow */
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { fetchUserReviews } from 'amo/actions/reviews';
import AddonsByAuthorsCard from 'amo/components/AddonsByAuthorsCard';
import AddonReviewCard from 'amo/components/AddonReviewCard';
import Link from 'amo/components/Link';
import NotFoundPage from 'amo/pages/ErrorPages/NotFoundPage';
import Page from 'amo/components/Page';
import UserProfileHead from 'amo/components/UserProfileHead';
import ReportUserAbuse from 'amo/components/ReportUserAbuse';
import {
  EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
  THEMES_BY_AUTHORS_PAGE_SIZE,
} from 'amo/reducers/addonsByAuthors';
import { getReviewsByUserId } from 'amo/reducers/reviews';
import {
  fetchUserAccount,
  getCurrentUser,
  getUserById,
  getUserByUsername,
  hasPermission,
  isDeveloper,
} from 'amo/reducers/users';
import Paginate from 'core/components/Paginate';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  ADMIN_TOOLS,
  USERS_EDIT,
} from 'core/constants';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import { sendServerRedirect } from 'core/reducers/redirectTo';
import { sanitizeUserHTML } from 'core/utils';
import Button from 'ui/components/Button';
import Card from 'ui/components/Card';
import CardList from 'ui/components/CardList';
import DefinitionList, { Definition } from 'ui/components/DefinitionList';
import Icon from 'ui/components/Icon';
import LoadingText from 'ui/components/LoadingText';
import Rating from 'ui/components/Rating';
import UserAvatar from 'ui/components/UserAvatar';
import type { AppState } from 'amo/store';
import type { UserReviewType } from 'amo/actions/reviews';
import type { UserType } from 'amo/reducers/users';
import type { DispatchFunc } from 'core/types/redux';
import type {
  ReactRouterLocationType,
  ReactRouterMatchType,
} from 'core/types/router';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  location: ReactRouterLocationType,
  match: {|
    ...ReactRouterMatchType,
    params: {| userId: string |},
  |},
|};

type InternalProps = {|
  ...Props,
  canAdminUser: boolean,
  canEditProfile: boolean,
  clientApp: string,
  currentUser: UserType | null,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  isOwner: boolean,
  lang: string,
  pageSize: string | null,
  reviewCount: number | null,
  reviews: Array<UserReviewType> | null,
  shouldRedirect: boolean,
  user: UserType | null,
|};

export class UserProfileBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    const {
      clientApp,
      dispatch,
      errorHandler,
      isOwner,
      lang,
      location,
      match: { params },
      reviews,
      shouldRedirect,
      user,
    } = props;

    if (shouldRedirect && user) {
      dispatch(
        sendServerRedirect({
          status: 301,
          url: `/${lang}/${clientApp}/user/${user.id}/`,
        }),
      );
      return;
    }

    if (errorHandler.hasError()) {
      log.warn('Not loading data because of an error.');
      return;
    }

    if (!user) {
      dispatch(
        fetchUserAccount({
          errorHandlerId: errorHandler.id,
          // We should use `Number()` here but we need to fetch users by
          // username in order to send a server redirect (to support previous
          // URLs with usernames). That is why we have to ignore the Flow error
          // here.
          // $FLOW_IGNORE
          userId: params.userId,
        }),
      );
    } else if (isOwner && !reviews) {
      dispatch(
        fetchUserReviews({
          errorHandlerId: errorHandler.id,
          page: this.getReviewsPage(location),
          userId: user.id,
        }),
      );
    }
  }

  componentDidUpdate(prevProps: InternalProps) {
    const {
      location: oldLocation,
      match: { params: oldParams },
    } = prevProps;
    const {
      dispatch,
      errorHandler,
      isOwner,
      location: newLocation,
      match: { params: newParams },
      reviews,
      user,
    } = this.props;

    if (oldParams.userId !== newParams.userId) {
      dispatch(
        fetchUserAccount({
          errorHandlerId: errorHandler.id,
          userId: Number(newParams.userId),
        }),
      );
    } else if (
      user &&
      isOwner &&
      (oldLocation.query.page !== newLocation.query.page || !reviews)
    ) {
      dispatch(
        fetchUserReviews({
          errorHandlerId: errorHandler.id,
          page: this.getReviewsPage(newLocation),
          userId: user.id,
        }),
      );
    }
  }

  getUserId() {
    const {
      match: { params },
      user,
    } = this.props;

    return user ? user.id : params.userId;
  }

  getURL() {
    return `/user/${this.getUserId()}/`;
  }

  getEditURL() {
    const {
      currentUser,
      match: { params },
    } = this.props;

    invariant(currentUser, 'currentUser is required');

    if (String(currentUser.id) === params.userId) {
      return `/users/edit`;
    }

    return `${this.getURL()}edit/`;
  }

  getReviewsPage(location: ReactRouterLocationType): string {
    return (location.query && location.query.page) || '1';
  }

  renderReviews() {
    const {
      location,
      i18n,
      isOwner,
      pageSize,
      reviews,
      reviewCount,
    } = this.props;

    if (!isOwner || !reviews || reviews.length < 1) {
      return null;
    }

    const paginator =
      reviewCount && pageSize && reviewCount > Number(pageSize) ? (
        <Paginate
          LinkComponent={Link}
          count={reviewCount}
          currentPage={this.getReviewsPage(location)}
          pathname={this.getURL()}
          perPage={Number(pageSize)}
          queryParams={location.query}
        />
      ) : null;

    return (
      <CardList
        className="UserProfile-reviews"
        footer={paginator}
        header={i18n.gettext('My reviews')}
      >
        <ul>
          {reviews.map((review) => {
            return (
              <li key={String(review.id)}>
                <AddonReviewCard
                  review={review}
                  shortByLine
                  siteUserCanReply={false}
                />
              </li>
            );
          })}
        </ul>
      </CardList>
    );
  }

  getMetaDescription() {
    const { i18n, user } = this.props;

    if (!user) {
      return null;
    }

    let description;
    if (user.is_addon_developer && user.is_artist) {
      description = i18n.gettext(`The profile of %(user)s, a Firefox extension
        and theme author. Find other apps by %(user)s, including average
        ratings, tenure, and the option to report issues.`);
    } else if (user.is_addon_developer) {
      description = i18n.gettext(`The profile of %(user)s, Firefox extension
        author. Find other extensions by %(user)s, including average ratings,
        tenure, and the option to report issues.`);
    } else if (user.is_artist) {
      description = i18n.gettext(`The profile of %(user)s, Firefox theme
        author. Find other themes by %(user)s, including average ratings,
        tenure, and the option to report issues.`);
    } else {
      return null;
    }

    return i18n.sprintf(description, { user: user.name });
  }

  render() {
    const {
      canAdminUser,
      canEditProfile,
      errorHandler,
      i18n,
      isOwner,
      user,
    } = this.props;

    let errorMessage;
    if (errorHandler.hasError()) {
      log.warn(`Captured API Error: ${errorHandler.capturedError.messages}`);

      if (errorHandler.capturedError.responseStatusCode === 404) {
        return <NotFoundPage />;
      }

      errorMessage = errorHandler.renderError();
    }

    const userProfileHeader = (
      <div className="UserProfile-header">
        <UserAvatar className="UserProfile-avatar" user={user} />

        {user && isDeveloper(user) && (
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

    const userProfileTitle = user
      ? i18n.sprintf(i18n.gettext('User Profile for %(user)s'), {
          user: user.name,
        })
      : i18n.gettext('User Profile');

    return (
      <Page>
        <div className="UserProfile">
          <UserProfileHead
            title={userProfileTitle}
            description={this.getMetaDescription()}
          />

          {errorMessage}

          <div className="UserProfile-wrapper">
            <Card className="UserProfile-user-info" header={userProfileHeader}>
              <DefinitionList className="UserProfile-dl">
                {user && user.homepage ? (
                  <Definition
                    className="UserProfile-homepage"
                    term={i18n.gettext('Homepage')}
                  >
                    <a href={user.homepage}>{i18n.gettext('Homepage')}</a>
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
                      styleSize="small"
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
                    <div
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

              {canAdminUser && user ? (
                <Button
                  className="UserProfile-admin-link"
                  buttonType="neutral"
                  href={`/admin/models/users/userprofile/${user.id}/`}
                  puffy
                >
                  {// translators: This action allows an admin to maintain a user.
                  i18n.gettext('Admin user')}
                </Button>
              ) : null}
            </Card>

            <div className="UserProfile-addons-and-reviews">
              <AddonsByAuthorsCard
                addonType={ADDON_TYPE_EXTENSION}
                authorDisplayName={user ? user.name : null}
                authorIds={user ? [user.id] : null}
                errorHandler={errorHandler}
                numberOfAddons={EXTENSIONS_BY_AUTHORS_PAGE_SIZE}
                pageParam="page_e"
                paginate
                pathname={this.getURL()}
                showMore={false}
                showSummary
                type="vertical"
              />

              <AddonsByAuthorsCard
                addonType={ADDON_TYPE_STATIC_THEME}
                authorDisplayName={user ? user.name : null}
                authorIds={user ? [user.id] : null}
                errorHandler={errorHandler}
                numberOfAddons={THEMES_BY_AUTHORS_PAGE_SIZE}
                pageParam="page_t"
                paginate
                pathname={this.getURL()}
                showMore={false}
              />

              {this.renderReviews()}
            </div>
          </div>
        </div>
      </Page>
    );
  }
}

export function mapStateToProps(state: AppState, ownProps: Props) {
  const { params } = ownProps.match;

  const { clientApp, lang } = state.api;

  let canAdminUser = false;
  let canEditProfile = false;
  let currentUser = null;
  let isOwner = false;
  let reviews = null;
  let shouldRedirect = false;
  let user = null;
  let userId;

  if (/^\d+$/.test(params.userId)) {
    userId = Number(params.userId);
    user = getUserById(state.users, userId) || null;

    currentUser = getCurrentUser(state.users);
    isOwner = currentUser && currentUser.id === userId;

    canEditProfile =
      currentUser &&
      (currentUser.id === userId || hasPermission(state, USERS_EDIT));

    canAdminUser =
      currentUser &&
      user &&
      hasPermission(state, ADMIN_TOOLS) &&
      hasPermission(state, USERS_EDIT);

    reviews = getReviewsByUserId(state.reviews, userId);
  } else {
    userId = params.userId;
    user = getUserByUsername(state.users, userId);
    shouldRedirect = true;
  }

  return {
    canAdminUser,
    canEditProfile,
    clientApp,
    currentUser,
    isOwner,
    lang,
    pageSize: reviews ? reviews.pageSize : null,
    reviewCount: reviews ? reviews.reviewCount : null,
    reviews: reviews ? reviews.reviews : null,
    shouldRedirect,
    user,
  };
}

export const extractId = (ownProps: Props) => {
  return ownProps.match.params.userId;
};

const UserProfile: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(UserProfileBase);

export default UserProfile;
