/* @flow */
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Rating from 'ui/components/Rating';
import { setAddonReviews } from 'amo/actions/reviews';
import { getReviews } from 'amo/api';
import fallbackIcon from 'amo/img/icons/default-64.png';
import Paginate from 'core/components/Paginate';
import translate from 'core/i18n/translate';
import {
  isAllowedOrigin,
  findAddon,
  loadAddonIfNeeded,
  safeAsyncConnect,
} from 'core/utils';
import { parsePage } from 'core/searchUtils';
import Link from 'amo/components/Link';
import CardList from 'ui/components/CardList';
import type { UserReviewType } from 'amo/actions/reviews';
import type { ReviewState } from 'amo/reducers/reviews';
import type { AddonType } from 'core/types/addons';
import type { DispatchFunc, ReduxStore } from 'core/types/redux';
import type { ReactRouterLocation } from 'core/types/router';

import './styles.scss';

type ReviewListRouteParams = {|
  // eslint-disable-next-line react/no-unused-prop-types
  addonSlug: string,
|}

type ReviewListProps = {|
  i18n: Object,
  addon?: AddonType,
  location: ReactRouterLocation,
  params: ReviewListRouteParams,
  reviewCount?: number,
  reviews?: Array<UserReviewType>,
|};

export class ReviewListBase extends React.Component {
  props: ReviewListProps;

  addonURL() {
    const { addon } = this.props;
    if (!addon) {
      throw new Error('cannot access addonURL() with a falsey addon property');
    }
    return `/addon/${addon.slug}/`;
  }

  url() {
    return `${this.addonURL()}reviews/`;
  }

  renderReview(review: UserReviewType) {
    const { i18n } = this.props;
    const timestamp = i18n.moment(review.created).fromNow();
    return (
      <li className="ReviewList-li">
        <h3>{review.title}</h3>
        <p>{review.body}</p>
        <div className="ReviewList-by-line">
          <Rating styleName="small" rating={review.rating} readOnly />
          {/* L10n: Example: "from Jose, last week" */}
          {i18n.sprintf(i18n.gettext('from %(authorName)s, %(timestamp)s'),
                        { authorName: review.userName, timestamp })}
        </div>
      </li>
    );
  }

  render() {
    const { addon, location, params, i18n, reviewCount, reviews } = this.props;
    if (!params.addonSlug) {
      throw new Error('params.addonSlug cannot be falsey');
    }
    if (!reviews || !addon) {
      // TODO: add a spinner
      return <div>{i18n.gettext('Loading...')}</div>;
    }

    const allReviews = reviews || [];
    const iconUrl = isAllowedOrigin(addon.icon_url) ? addon.icon_url :
      fallbackIcon;

    return (
      <div className="ReviewList">
        <div className="ReviewList-header">
          <div className="ReviewList-header-icon">
            <Link to={this.addonURL()}>
              <img src={iconUrl} alt={i18n.gettext('Add-on icon')} />
            </Link>
          </div>
          <div className="ReviewList-header-text">
            <h1 className="visually-hidden">
              {i18n.sprintf(i18n.gettext('Reviews for %(addonName)s'),
                            { addonName: addon.name })}
            </h1>
            <h2>{i18n.gettext('All written reviews')}</h2>
            <h3><Link to={this.addonURL()}>{addon.name}</Link></h3>
          </div>
        </div>
        <CardList>
          <ul>
            {allReviews.map((review) => this.renderReview(review))}
          </ul>
        </CardList>
        <Paginate
          LinkComponent={Link}
          count={reviewCount}
          currentPage={parsePage(location.query.page)}
          pathname={this.url()}
        />
      </div>
    );
  }
}

export function loadAddonReviews(
  {
    addonId, addonSlug, dispatch, page = 1,
  }: {|
    addonId: number,
    addonSlug: string,
    dispatch: DispatchFunc,
    page?: number,
  |}
) {
  return getReviews({ addon: addonId, page })
    .then((response) => {
      const allReviews = response.results;
      // Ignore reviews with null bodies as those are incomplete.
      // For example, the user selected a star rating but hasn't submitted
      // review text yet.
      const reviews = allReviews.filter((review) => Boolean(review.body));
      dispatch(setAddonReviews({
        addonSlug, reviews, reviewCount: response.count,
      }));
    });
}

export function loadInitialData(
  {
    location, params, store,
  }: {|
    location: ReactRouterLocation,
    params: ReviewListRouteParams,
    store: ReduxStore,
  |}
) {
  const { addonSlug } = params;
  if (!addonSlug) {
    return Promise.reject(new Error('missing URL param addonSlug'));
  }
  let page;
  return new Promise((resolve) => {
    page = parsePage(location.query.page);
    return resolve();
  })
    .then(() => loadAddonIfNeeded({ store, params: { slug: addonSlug } }))
    .then(() => findAddon(store.getState(), addonSlug))
    .then((addon) => loadAddonReviews({
      addonId: addon.id, addonSlug, dispatch: store.dispatch, page,
    }));
}

export function mapStateToProps(
  state: {| reviews: ReviewState |}, ownProps: ReviewListProps,
) {
  if (!ownProps || !ownProps.params || !ownProps.params.addonSlug) {
    throw new Error('The component had a falsey params.addonSlug parameter');
  }
  const addonSlug = ownProps.params.addonSlug;
  const reviewData = state.reviews.byAddon[addonSlug];
  return {
    addon: findAddon(state, addonSlug),
    reviewCount: reviewData && reviewData.reviewCount,
    reviews: reviewData && reviewData.reviews,
  };
}

export default compose(
  safeAsyncConnect([{
    key: 'ReviewList',
    promise: loadInitialData,
  }]),
  connect(mapStateToProps),
  translate({ withRef: true }),
)(ReviewListBase);
