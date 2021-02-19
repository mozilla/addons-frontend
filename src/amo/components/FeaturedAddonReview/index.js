/* @flow */
import * as React from 'react';
import NestedStatus from 'react-nested-status';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { fetchReview } from 'amo/actions/reviews';
import AddonReviewCard from 'amo/components/AddonReviewCard';
import { selectReview } from 'amo/reducers/reviews';
import { withFixedErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import log from 'amo/logger';
import Card from 'amo/components/Card';
import type { UserReviewType } from 'amo/actions/reviews';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { AddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';
import type { DispatchFunc } from 'amo/types/redux';

import './styles.scss';

type Props = {|
  addon: AddonType | null,
  reviewId: number,
  siteUserCanReply: ?boolean,
|};

type InternalProps = {|
  ...Props,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  featuredReview?: UserReviewType,
  i18n: I18nType,
  loadingReview: boolean,
|};

export class FeaturedAddonReviewBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    this.loadDataIfNeeded();
  }

  componentDidUpdate(prevProps: InternalProps) {
    this.loadDataIfNeeded(prevProps);
  }

  loadDataIfNeeded(prevProps?: InternalProps) {
    const {
      dispatch,
      errorHandler,
      featuredReview,
      loadingReview,
      reviewId,
    } = this.props;

    if (errorHandler.hasError()) {
      log.warn('Not loading data because of an error');
      return;
    }

    if (
      (!featuredReview || (prevProps && prevProps.reviewId !== reviewId)) &&
      !loadingReview
    ) {
      dispatch(fetchReview({ reviewId, errorHandlerId: errorHandler.id }));
    }
  }

  render(): React.Element<"div"> {
    const {
      addon,
      errorHandler,
      featuredReview,
      i18n,
      siteUserCanReply,
    } = this.props;

    const featuredReviewHeader = featuredReview
      ? i18n.sprintf(
          featuredReview.isDeveloperReply
            ? i18n.gettext('Response by %(userName)s')
            : i18n.gettext('Review by %(userName)s'),
          {
            userName: featuredReview.userName,
          },
        )
      : null;

    const featuredReviewCard =
      errorHandler.hasError() &&
      errorHandler.capturedError.responseStatusCode === 404 ? (
        <NestedStatus code={404}>
          <div className="FeaturedAddonReview-notfound">
            {i18n.gettext('The review was not found.')}
          </div>
        </NestedStatus>
      ) : (
        <AddonReviewCard
          addon={addon}
          review={featuredReview}
          siteUserCanReply={siteUserCanReply}
        />
      );

    return (
      <div className="FeaturedAddonReview">
        <Card
          header={featuredReviewHeader}
          className="FeaturedAddonReview-card"
        >
          {featuredReviewCard}
        </Card>
      </div>
    );
  }
}

export function mapStateToProps(state: AppState, ownProps: InternalProps): {|featuredReview: ?UserReviewType, loadingReview: boolean|} {
  const { reviewId } = ownProps;
  const featuredReview = reviewId
    ? selectReview(state.reviews, reviewId)
    : null;

  return {
    featuredReview,
    loadingReview: reviewId
      ? state.reviews.view[reviewId] &&
        state.reviews.view[reviewId].loadingReview
      : false,
  };
}

export const extractId = (ownProps: InternalProps): number => {
  return ownProps.reviewId;
};

const FeaturedAddonReview: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(FeaturedAddonReviewBase);

export default FeaturedAddonReview;
