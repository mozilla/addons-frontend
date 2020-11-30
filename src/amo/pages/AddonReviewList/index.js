/* @flow */
/* eslint-disable react/no-unused-prop-types */
import invariant from 'invariant';
import makeClassName from 'classnames';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { DEFAULT_API_PAGE_SIZE } from 'core/api';
import AddonReviewCard from 'amo/components/AddonReviewCard';
import AddonSummaryCard from 'amo/components/AddonSummaryCard';
import FeaturedAddonReview from 'amo/components/FeaturedAddonReview';
import Page from 'amo/components/Page';
import { fetchReviewPermissions, fetchReviews } from 'amo/actions/reviews';
import { setViewContext } from 'amo/actions/viewContext';
import {
  expandReviewObjects,
  reviewListURL,
  reviewsAreLoading,
  selectReviewPermissions,
  selectReviews,
} from 'amo/reducers/reviews';
import { getCurrentUser } from 'amo/reducers/users';
import { getAddonURL } from 'amo/utils';
import {
  fetchAddon,
  getAddonByIdInURL,
  isAddonLoading,
} from 'core/reducers/addons';
import Paginate from 'core/components/Paginate';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import Link from 'amo/components/Link';
import Card from 'ui/components/Card';
import CardList from 'ui/components/CardList';
import LoadingText from 'ui/components/LoadingText';
import Select from 'ui/components/Select';
import type { UserType } from 'amo/reducers/users';
import type { AppState } from 'amo/store';
import type { UserReviewType } from 'amo/actions/reviews';
import type { ErrorHandlerType } from 'core/types/errorHandler';
import type { AddonType } from 'core/types/addons';
import type { ElementEvent } from 'core/types/dom';
import type { DispatchFunc } from 'core/types/redux';
import type {
  ReactRouterHistoryType,
  ReactRouterLocationType,
  ReactRouterMatchType,
} from 'core/types/router';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

export const SHOW_ALL_REVIEWS: 'SHOW_ALL_REVIEWS' = 'SHOW_ALL_REVIEWS';

function getCurrentPage(location: ReactRouterLocationType) {
  return location.query.page || '1';
}

type Props = {|
  location: ReactRouterLocationType,
  match: {|
    ...ReactRouterMatchType,
    params: {
      addonSlug: string,
      reviewId?: number,
    },
  |},
|};

type InternalProps = {|
  ...Props,
  addon: AddonType | null,
  addonIsLoading: boolean,
  areReviewsLoading: boolean,
  checkingIfSiteUserCanReply: boolean,
  clientApp: ?string,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  history: ReactRouterHistoryType,
  i18n: I18nType,
  lang: ?string,
  pageSize: string | null,
  reviewCount: number | null,
  reviews: ?Array<UserReviewType>,
  siteUser: UserType | null,
  siteUserCanReplyToReviews: boolean | null,
|};

export class AddonReviewListBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    this.loadDataIfNeeded();
  }

  componentDidUpdate(prevProps: InternalProps) {
    this.loadDataIfNeeded(prevProps);
    this.dispatchFetchReviewPermissions();
  }

  loadDataIfNeeded(prevProps?: InternalProps) {
    const lastAddon = prevProps && prevProps.addon;
    const {
      addon,
      addonIsLoading,
      areReviewsLoading,
      dispatch,
      errorHandler,
      location,
      match: {
        params: { addonSlug },
      },
      reviews,
    } = this.props;

    if (errorHandler.hasError()) {
      log.warn('Not loading data because of an error');
      return;
    }

    if (!addon) {
      if (!addonIsLoading) {
        dispatch(fetchAddon({ slug: addonSlug, errorHandler }));
      }
    } else if (
      // This is the first time rendering the component.
      !prevProps ||
      // The component is getting updated with a new addon type.
      (addon && lastAddon && addon.type !== lastAddon.type)
    ) {
      dispatch(setViewContext(addon.type));
    }

    if (!areReviewsLoading && !reviews) {
      dispatch(
        fetchReviews({
          addonSlug,
          errorHandlerId: errorHandler.id,
          page: getCurrentPage(location),
          score: location.query.score || null,
        }),
      );
    }
  }

  componentDidMount() {
    // Permissions are fetched in componentDidMount because siteUser
    // is not reliable while server rendering.
    // https://github.com/mozilla/addons-frontend/issues/6717
    this.dispatchFetchReviewPermissions();
  }

  dispatchFetchReviewPermissions() {
    const {
      addon,
      checkingIfSiteUserCanReply,
      dispatch,
      errorHandler,
      siteUser,
      siteUserCanReplyToReviews,
    } = this.props;

    if (
      addon &&
      siteUser &&
      siteUserCanReplyToReviews === null &&
      !checkingIfSiteUserCanReply &&
      !errorHandler.hasError()
    ) {
      dispatch(
        fetchReviewPermissions({
          addonId: addon.id,
          errorHandlerId: errorHandler.id,
          userId: siteUser.id,
        }),
      );
    }
  }

  addonURL() {
    const { addon } = this.props;
    if (!addon) {
      throw new Error('cannot access addonURL() with a falsey addon property');
    }
    return getAddonURL(addon.slug);
  }

  getPageDescription() {
    const { addon, i18n } = this.props;

    invariant(addon, 'addon is required');

    return i18n.sprintf(
      i18n.gettext(`Reviews and ratings for %(addonName)s. Find out what other
        users think about %(addonName)s and add it to your Firefox Browser.`),
      { addonName: addon.name },
    );
  }

  onSelectOption = (event: ElementEvent<HTMLSelectElement>) => {
    const { addon, clientApp, history, lang, location } = this.props;
    invariant(addon, 'addon is required');

    event.preventDefault();
    const { value } = event.target;

    const listURL = reviewListURL({
      addonSlug: addon.slug,
      score: value === SHOW_ALL_REVIEWS ? undefined : value,
      location,
    });

    history.push(`/${lang || ''}/${clientApp || ''}${listURL}`);
  };

  filterByScoreSelector() {
    const { addon, i18n, location } = this.props;

    return (
      <Select
        className="AddonReviewList-filterByScoreSelector"
        disabled={!addon}
        onChange={this.onSelectOption}
        value={location.query.score || SHOW_ALL_REVIEWS}
      >
        <option value={SHOW_ALL_REVIEWS}>
          {i18n.gettext('Show all reviews')}
        </option>
        <option value={5}>{i18n.gettext('Show only five-star reviews')}</option>
        <option value={4}>{i18n.gettext('Show only four-star reviews')}</option>
        <option value={3}>
          {i18n.gettext('Show only three-star reviews')}
        </option>
        <option value={2}>{i18n.gettext('Show only two-star reviews')}</option>
        <option value={1}>{i18n.gettext('Show only one-star reviews')}</option>
      </Select>
    );
  }

  render() {
    const {
      addon,
      errorHandler,
      i18n,
      location,
      match: {
        params: { reviewId },
      },
      pageSize,
      reviewCount,
      reviews,
      siteUserCanReplyToReviews,
    } = this.props;

    const header = addon
      ? i18n.sprintf(i18n.gettext('Reviews for %(addonName)s'), {
          addonName: addon.name,
        })
      : '';

    let reviewCountText = null;
    if (reviewCount !== null) {
      reviewCountText =
        reviewCount > 0 &&
        i18n.sprintf(
          i18n.ngettext('%(total)s review', '%(total)s reviews', reviewCount),
          {
            total: i18n.formatNumber(reviewCount),
          },
        );
    } else {
      reviewCountText = <LoadingText width={40} />;
    }

    const reviewCountHTML = (
      <div className="AddonReviewList-cardListHeader">
        <div className="AddonReviewList-reviewCount">{reviewCountText}</div>
        <div className="AddonReviewList-filterByScore">
          {this.filterByScoreSelector()}
        </div>
      </div>
    );

    const addonReviewCount =
      addon && addon.ratings ? addon.ratings.count : null;
    let placeholderCount = addonReviewCount || 4;
    if (placeholderCount > DEFAULT_API_PAGE_SIZE) {
      placeholderCount = DEFAULT_API_PAGE_SIZE;
    }

    const allReviews = reviews
      ? // Remove the Featured Review from the array.
        // TODO: Remove this code and use the API to filter out the featured
        // review once https://github.com/mozilla/addons-server/issues/9424
        // is fixed.
        reviews.filter((review) => review.id.toString() !== reviewId)
      : Array(placeholderCount).fill(null);

    const paginator =
      addon && reviewCount && pageSize && reviewCount > Number(pageSize) ? (
        <Paginate
          LinkComponent={Link}
          count={reviewCount}
          currentPage={getCurrentPage(location)}
          pathname={reviewListURL({
            addonSlug: addon.slug,
            score: location.query.score,
            location,
          })}
          perPage={Number(pageSize)}
        />
      ) : null;

    return (
      <Page errorHandler={errorHandler}>
        <div
          className={makeClassName(
            'AddonReviewList',
            addon && addon.type ? [`AddonReviewList--${addon.type}`] : null,
          )}
        >
          {addon && (
            <Helmet>
              <title>{header}</title>
              <meta name="description" content={this.getPageDescription()} />
              {reviewId && <meta name="robots" content="noindex, follow" />}
            </Helmet>
          )}

          {errorHandler.renderErrorIfPresent()}

          <AddonSummaryCard addon={addon} headerText={header} />

          <div className="AddonReviewList-reviews">
            {reviewId && (
              <FeaturedAddonReview
                addon={addon}
                reviewId={reviewId}
                siteUserCanReply={siteUserCanReplyToReviews}
              />
            )}
            {allReviews.length ? (
              <CardList
                className="AddonReviewList-reviews-listing"
                footer={paginator}
                header={reviewCountHTML}
              >
                <ul>
                  {allReviews.map((review, index) => {
                    return (
                      <li key={String(index)}>
                        <AddonReviewCard
                          addon={addon}
                          review={review}
                          siteUserCanReply={siteUserCanReplyToReviews}
                        />
                      </li>
                    );
                  })}
                </ul>
              </CardList>
            ) : (
              <Card header={reviewCountHTML}>
                <p className="AddonReviewList-noReviews">
                  {i18n.gettext('There are no reviews')}
                </p>
              </Card>
            )}
          </div>
        </div>
      </Page>
    );
  }
}

export function mapStateToProps(
  state: AppState,
  ownProps: Props,
): $Shape<InternalProps> {
  const { addonSlug } = ownProps.match.params;
  const addon = getAddonByIdInURL(state.addons, addonSlug);
  const reviewData = selectReviews({
    page: getCurrentPage(ownProps.location),
    reviewsState: state.reviews,
    addonSlug,
    score: ownProps.location.query.score || null,
  });

  const siteUser = getCurrentUser(state.users);
  let checkingIfSiteUserCanReply = false;
  let siteUserCanReplyToReviews = null;
  if (addon && siteUser) {
    const permissions = selectReviewPermissions({
      reviewsState: state.reviews,
      addonId: addon.id,
      userId: siteUser.id,
    });
    if (permissions) {
      checkingIfSiteUserCanReply = permissions.loading;
      siteUserCanReplyToReviews = permissions.canReplyToReviews;
    }
  }

  return {
    addon,
    addonIsLoading: isAddonLoading(state, addonSlug),
    areReviewsLoading: reviewsAreLoading(state, addonSlug),
    checkingIfSiteUserCanReply,
    clientApp: state.api.clientApp,
    lang: state.api.lang,
    pageSize: reviewData ? reviewData.pageSize : null,
    reviewCount: reviewData ? reviewData.reviewCount : null,
    reviews:
      reviewData &&
      expandReviewObjects({
        state: state.reviews,
        reviews: reviewData.reviews,
      }),
    siteUserCanReplyToReviews,
    siteUser,
  };
}

export const extractId = (ownProps: InternalProps) => {
  const {
    location,
    match: { params },
  } = ownProps;

  return `${params.addonSlug}-${location.query.page || ''}`;
};

const AddonReviewList: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(AddonReviewListBase);

export default AddonReviewList;
