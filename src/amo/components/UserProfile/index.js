/* @flow */
import invariant from 'invariant';
import * as React from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { fetchUserReviews } from 'amo/actions/reviews';
import AddonsByAuthorsCard from 'amo/components/AddonsByAuthorsCard';
import Link from 'amo/components/Link';
import NotFound from 'amo/components/ErrorPage/NotFound';
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
  ADDON_TYPE_THEME,
  USERS_EDIT,
} from 'core/constants';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import { removeProtocolFromURL, sanitizeUserHTML } from 'core/utils';
import Button from 'ui/components/Button';
import Card from 'ui/components/Card';
import CardList from 'ui/components/CardList';
import DefinitionList, { Definition } from 'ui/components/DefinitionList';
import Icon from 'ui/components/Icon';
import LoadingText from 'ui/components/LoadingText';
import Rating from 'ui/components/Rating';
import UserAvatar from 'ui/components/UserAvatar';
import UserReview from 'ui/components/UserReview';
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
    params: {| username: string |},
  |},
|};

type InternalProps = {|
  ...Props,
  canEditProfile: boolean,
  currentUser: UserType | null,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  isOwner: boolean,
  pageSize: number | null,
  reviewCount: number | null,
  reviews: Array<UserReviewType> | null,
  user: UserType | null,
|};

export class UserProfileBase extends React.Component<InternalProps> {
  componentWillMount() {
    const {
      dispatch,
      errorHandler,
      isOwner,
      location,
      match,
      reviews,
      user,
    } = this.props;

    if (errorHandler.hasError()) {
      log.warn('Not loading data because of an error.');
      return;
    }

    if (!user) {
      dispatch(
        fetchUserAccount({
          errorHandlerId: errorHandler.id,
          username: match.params.username,
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

  componentWillReceiveProps({
    isOwner,
    location: newLocation,
    match: newMatch,
    reviews,
    user,
  }: InternalProps) {
    const {
      dispatch,
      errorHandler,
      location: oldLocation,
      match: oldMatch,
    } = this.props;

    if (oldMatch.params.username !== newMatch.params.username) {
      dispatch(
        fetchUserAccount({
          errorHandlerId: errorHandler.id,
          username: newMatch.params.username,
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

  getUsername() {
    const { match, user } = this.props;
    const { params } = match;

    return user ? user.username : params.username;
  }

  getURL() {
    return `/user/${this.getUsername()}/`;
  }

  getEditURL() {
    const { currentUser, user } = this.props;

    invariant(user, 'user is required');
    invariant(currentUser, 'currentUser is required');

    if (currentUser.id === user.id) {
      return `/users/edit`;
    }

    return `${this.getURL()}edit/`;
  }

  getReviewsPage(location: ReactRouterLocationType): number {
    const currentPage = parseInt(location.query.page, 10);

    return Number.isNaN(currentPage) || currentPage < 1 ? 1 : currentPage;
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
      reviewCount && pageSize && reviewCount > pageSize ? (
        <Paginate
          LinkComponent={Link}
          count={reviewCount}
          currentPage={this.getReviewsPage(location)}
          pathname={this.getURL()}
          perPage={pageSize}
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
            const byLine = (
              <Link
                title={i18n.gettext('Browse the reviews for this add-on')}
                to={`/addon/${review.addonSlug}/reviews/`}
              >
                {i18n.moment(review.created).fromNow()}
              </Link>
            );

            return (
              <li key={String(review.id)}>
                <UserReview review={review} byLine={byLine} />
              </li>
            );
          })}
        </ul>
      </CardList>
    );
  }

  render() {
    const {
      canEditProfile,
      errorHandler,
      i18n,
      isOwner,
      match,
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

    const { params } = match;

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
          </Card>

          {params &&
            params.username && (
              <div className="UserProfile-addons-and-reviews">
                <AddonsByAuthorsCard
                  addonType={ADDON_TYPE_EXTENSION}
                  authorDisplayName={user ? user.name : params.username}
                  authorUsernames={[this.getUsername()]}
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
                  addonType={ADDON_TYPE_THEME}
                  authorDisplayName={user ? user.name : params.username}
                  authorUsernames={[this.getUsername()]}
                  errorHandler={errorHandler}
                  numberOfAddons={THEMES_BY_AUTHORS_PAGE_SIZE}
                  pageParam="page_t"
                  paginate
                  pathname={this.getURL()}
                  showMore={false}
                />

                {this.renderReviews()}
              </div>
            )}
        </div>
      </div>
    );
  }
}

export function mapStateToProps(state: AppState, ownProps: Props) {
  const { username } = ownProps.match.params;

  const currentUser = getCurrentUser(state.users);

  // `getUserByUsername()` requires a string as second argument.
  let user = getUserByUsername(state.users, `${username}`);

  if (!user) {
    const userId = parseInt(username, 10);
    user = !Number.isNaN(userId) ? getUserById(state.users, userId) : undefined;
  }

  const isOwner = currentUser && user && currentUser.id === user.id;

  const canEditProfile =
    currentUser &&
    user &&
    (currentUser.id === user.id || hasPermission(state, USERS_EDIT));

  const reviews = user ? getReviewsByUserId(state.reviews, user.id) : null;

  return {
    canEditProfile,
    currentUser,
    isOwner,
    pageSize: reviews ? reviews.pageSize : null,
    reviewCount: reviews ? reviews.reviewCount : null,
    reviews: reviews ? reviews.reviews : null,
    user,
  };
}

export const extractId = (ownProps: Props) => {
  return ownProps.match.params.username;
};

const UserProfile: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(UserProfileBase);

export default UserProfile;
