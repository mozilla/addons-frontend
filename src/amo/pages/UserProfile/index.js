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
import Paginate from 'amo/components/Paginate';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  USERS_EDIT,
  VIEW_CONTEXT_HOME,
} from 'amo/constants';
import { withFixedErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import log from 'amo/logger';
import { sendServerRedirect } from 'amo/reducers/redirectTo';
import { sanitizeUserHTML } from 'amo/utils';
import Button from 'amo/components/Button';
import Card from 'amo/components/Card';
import CardList from 'amo/components/CardList';
import DefinitionList, { Definition } from 'amo/components/DefinitionList';
import Icon from 'amo/components/Icon';
import LoadingText from 'amo/components/LoadingText';
import Rating from 'amo/components/Rating';
import UserAvatar from 'amo/components/UserAvatar';
import type { AppState } from 'amo/store';
import type { UserReviewType } from 'amo/actions/reviews';
import type { UserId, UserType } from 'amo/reducers/users';
import type { DispatchFunc } from 'amo/types/redux';
import type {
  ReactRouterLocationType,
  ReactRouterMatchType,
} from 'amo/types/router';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { I18nType } from 'amo/types/i18n';
import { setViewContext } from 'amo/actions/viewContext';

import './styles.scss';

type Props = {|
  location: ReactRouterLocationType,
  match: {|
    ...ReactRouterMatchType,
    params: {| userId: string |},
  |},
|};

type PropsFromState = {|
  canAdminUser: boolean | null,
  canEditProfile: boolean | null,
  clientApp: string,
  currentUser: UserType | null,
  isOwner: boolean | null,
  lang: string,
  pageSize: string | null,
  reviewCount: number | null,
  reviews: Array<UserReviewType> | null,
  shouldRedirect: boolean,
  user: UserType | null,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
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

    dispatch(setViewContext(VIEW_CONTEXT_HOME));

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
          // $FlowIgnore
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

  getUserId(): UserId | string {
    const {
      match: { params },
      user,
    } = this.props;

    return user ? user.id : params.userId;
  }

  getURL(): string {
    return `/user/${this.getUserId()}/`;
  }

  getEditURL(): string {
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

  renderReviews(): null | React.Node {
    const { location, i18n, isOwner, pageSize, reviews, reviewCount } =
      this.props;

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

  getMetaDescription(): null | string {
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

  render(): React.Node {
    const { canAdminUser, canEditProfile, errorHandler, i18n, isOwner, user } =
      this.props;

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
        <UserAvatar
          className="UserProfile-avatar"
          user={user}
          altText={i18n.gettext('User Avatar')}
        />

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

    const userCreatedDate =
      user && user.created !== undefined
        ? i18n.moment(user.created).format('ll')
        : null;

    return (
      <Page errorHandler={errorHandler}>
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
                    <a href={user.homepage} rel="nofollow">
                      {i18n.gettext('Homepage')}
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
                {userCreatedDate ? (
                  <Definition
                    className="UserProfile-user-since"
                    term={i18n.gettext('User since')}
                  >
                    {userCreatedDate}
                  </Definition>
                ) : null}
                {user && user.num_addons_listed !== undefined ? (
                  <Definition
                    className="UserProfile-number-of-addons"
                    term={i18n.gettext('Number of add-ons')}
                  >
                    {user.num_addons_listed}
                  </Definition>
                ) : null}
                {user && user.average_addon_rating ? (
                  <Definition
                    className="UserProfile-rating-average"
                    term={i18n.gettext('Average rating of developer’s add-ons')}
                  >
                    <Rating
                      rating={user.average_addon_rating}
                      readOnly
                      styleSize="small"
                    />
                  </Definition>
                ) : null}
                {user && user.biography && user.biography.length ? (
                  <Definition
                    className="UserProfile-biography"
                    term={i18n.gettext('Biography')}
                  >
                    <div
                      // eslint-disable-next-line react/no-danger
                      dangerouslySetInnerHTML={sanitizeUserHTML(
                        user.biography,
                        { allowLinks: false },
                      )}
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
                  {
                    // L10n: This action allows an admin to maintain a user.
                    i18n.gettext('Admin user')
                  }
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

function mapStateToProps(state: AppState, ownProps: Props): PropsFromState {
  const { params } = ownProps.match;

  const { clientApp, lang } = state.api;

  let canAdminUser: null | boolean = false;
  let canEditProfile: null | boolean = false;
  let currentUser = null;
  let isOwner: null | boolean = false;
  let reviews = null;
  let shouldRedirect = false;
  let user = null;

  if (/^\d+$/.test(params.userId)) {
    const userId: UserId = Number(params.userId);
    user = getUserById(state.users, userId) || null;

    currentUser = getCurrentUser(state.users);
    isOwner = currentUser && currentUser.id === userId;

    canEditProfile =
      currentUser &&
      (currentUser.id === userId || hasPermission(state, USERS_EDIT));

    canAdminUser = currentUser && user && hasPermission(state, USERS_EDIT);

    reviews = getReviewsByUserId(state.reviews, userId);
  } else {
    const { userId } = params;
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

export const extractId = (ownProps: Props): string => {
  return ownProps.match.params.userId;
};

const UserProfile: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(UserProfileBase);

export default UserProfile;
