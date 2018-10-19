/* @flow */
/* eslint-disable react/no-unused-prop-types */
import makeClassName from 'classnames';
import * as React from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AddonReviewCard from 'amo/components/AddonReviewCard';
import AddonSummaryCard from 'amo/components/AddonSummaryCard';
import FeaturedAddonReview from 'amo/components/FeaturedAddonReview';
import { fetchReviews } from 'amo/actions/reviews';
import { setViewContext } from 'amo/actions/viewContext';
import { expandReviewObjects, reviewsAreLoading } from 'amo/reducers/reviews';
import {
  fetchAddon,
  getAddonBySlug,
  isAddonLoading,
} from 'core/reducers/addons';
import Paginate from 'core/components/Paginate';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import Link from 'amo/components/Link';
import NotFound from 'amo/components/ErrorPage/NotFound';
import CardList from 'ui/components/CardList';
import LoadingText from 'ui/components/LoadingText';
import type { AppState } from 'amo/store';
import type { UserReviewType } from 'amo/actions/reviews';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { AddonType } from 'core/types/addons';
import type { DispatchFunc } from 'core/types/redux';
import type {
  ReactRouterHistoryType,
  ReactRouterLocationType,
  ReactRouterMatchType,
} from 'core/types/router';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  location: ReactRouterLocationType,
|};

type InternalProps = {|
  ...Props,
  addon: AddonType | null,
  addonIsLoading: boolean,
  clientApp: string,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  history: ReactRouterHistoryType,
  i18n: I18nType,
  lang: string,
  match: {|
    ...ReactRouterMatchType,
    params: {
      addonSlug: string,
      reviewId?: number,
    },
  |},
  pageSize: number | null,
  reviewCount?: number,
  reviews?: Array<UserReviewType>,
  areReviewsLoading: boolean,
|};

export class AddonReviewListBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    this.loadDataIfNeeded();
  }

  componentWillReceiveProps(nextProps: InternalProps) {
    this.loadDataIfNeeded(nextProps);
  }

  loadDataIfNeeded(nextProps?: InternalProps) {
    const lastAddon = this.props.addon;
    const nextAddon = nextProps && nextProps.addon;
    const {
      addon,
      addonIsLoading,
      dispatch,
      errorHandler,
      match: {
        params: { addonSlug },
      },
      reviews,
      areReviewsLoading,
    } = {
      ...this.props,
      ...nextProps,
    };

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
      !nextProps ||
      // The component is getting updated with a new addon type.
      (nextAddon && lastAddon && nextAddon.type !== lastAddon.type)
    ) {
      dispatch(setViewContext(addon.type));
    }

    let { location } = this.props;
    let locationChanged = false;
    if (nextProps && nextProps.location) {
      if (nextProps.location !== location) {
        locationChanged = true;
      }
      location = nextProps.location;
    }

    if (!areReviewsLoading && (!reviews || locationChanged)) {
      dispatch(
        fetchReviews({
          addonSlug,
          errorHandlerId: errorHandler.id,
          // TODO: so, there is a test case (`it dispatches fetchReviews with
          // an invalid page variable`) that conflicts with `fetchReviews()`
          // requiring a page of type `number`. We should decide whether `page`
          // can be anything OR restrict to integer values.
          // $FLOW_FIXME: https://github.com/mozilla/addons-frontend/issues/5737
          page: this.getCurrentPage(location),
        }),
      );
    }
  }

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

  getCurrentPage(location: ReactRouterLocationType) {
    return location.query.page || '1';
  }

  render() {
    const {
      addon,
      errorHandler,
      location,
      match: {
        params: { reviewId },
      },
      i18n,
      pageSize,
      reviewCount,
      reviews,
    } = this.props;

    if (errorHandler.hasError()) {
      log.warn('Captured API Error:', errorHandler.capturedError);
      // The following code attempts to recover from a 401 returned
      // by fetchAddon() but may accidentally catch a 401 from
      // fetchReviews(). Oh well.
      // TODO: support multiple error handlers, see
      // https://github.com/mozilla/addons-frontend/issues/3101
      //
      // 401 and 403 are for an add-on lookup is made to look like a 404 on purpose.
      // See https://github.com/mozilla/addons-frontend/issues/3061
      if (
        errorHandler.capturedError.responseStatusCode === 401 ||
        errorHandler.capturedError.responseStatusCode === 403 ||
        errorHandler.capturedError.responseStatusCode === 404
      ) {
        return <NotFound />;
      }
    }

    // When reviews have not loaded yet, make a list of 4 empty reviews
    // as a placeholder.
    const allReviews = reviews
      ? // Remove the Featured Review from the array.
        // TODO: Remove this code and use the API to filter out the featured
        // review once https://github.com/mozilla/addons-server/issues/9424
        // is fixed.
        reviews.filter((review) => review.id.toString() !== reviewId)
      : Array(4).fill(null);

    const header = addon
      ? i18n.sprintf(i18n.gettext('Reviews for %(addonName)s'), {
          addonName: addon.name,
        })
      : '';

    const addonReviewCount =
      addon && addon.ratings ? addon.ratings.text_count : null;
    const reviewCountHTML =
      addon && addonReviewCount !== null ? (
        i18n.sprintf(
          i18n.ngettext(
            '%(total)s review for this add-on',
            '%(total)s reviews for this add-on',
            addonReviewCount,
          ),
          {
            total: i18n.formatNumber(addonReviewCount),
          },
        )
      ) : (
        <LoadingText />
      );

    const paginator =
      addon && reviewCount && pageSize && reviewCount > pageSize ? (
        <Paginate
          LinkComponent={Link}
          count={reviewCount}
          currentPage={this.getCurrentPage(location)}
          pathname={this.url()}
          perPage={pageSize}
        />
      ) : null;

    return (
      <div
        className={makeClassName(
          'AddonReviewList',
          addon && addon.type ? [`AddonReviewList--${addon.type}`] : null,
        )}
      >
        {addon && (
          <Helmet>
            <title>{header}</title>
            {reviewId && <meta name="robots" content="noindex, follow" />}
          </Helmet>
        )}

        {errorHandler.renderErrorIfPresent()}

        <AddonSummaryCard addon={addon} headerText={header} />

        <div className="AddonReviewList-reviews">
          {reviewId && (
            <FeaturedAddonReview addon={addon} reviewId={reviewId} />
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
                      <AddonReviewCard addon={addon} review={review} />
                    </li>
                  );
                })}
              </ul>
            </CardList>
          ) : null}
        </div>
      </div>
    );
  }
}

export function mapStateToProps(state: AppState, ownProps: InternalProps) {
  const { addonSlug } = ownProps.match.params;
  const reviewData = state.reviews.byAddon[addonSlug];

  return {
    addon: getAddonBySlug(state, addonSlug),
    addonIsLoading: isAddonLoading(state, addonSlug),
    clientApp: state.api.clientApp,
    lang: state.api.lang,
    pageSize: reviewData ? reviewData.pageSize : null,
    reviewCount: reviewData && reviewData.reviewCount,
    reviews:
      reviewData &&
      expandReviewObjects({
        state: state.reviews,
        reviews: reviewData.reviews,
      }),
    areReviewsLoading: reviewsAreLoading(state, addonSlug),
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
