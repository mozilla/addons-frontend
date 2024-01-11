/* @flow */
import invariant from 'invariant';
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

type PropsFromState = {|
  featuredReview: ?UserReviewType,
  loadingReview: boolean,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
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
    const { dispatch, errorHandler, featuredReview, loadingReview, reviewId } =
      this.props;

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

  render(): React.Node {
    const { addon, errorHandler, featuredReview, i18n, siteUserCanReply } =
      this.props;

    let featuredReviewHeader = null;

    if (featuredReview) {
      const featuredReviewPlaceholders = {
        userName: featuredReview.userName,
      };

      if (featuredReview.isDeveloperReply) {
        featuredReviewHeader = i18n.sprintf(
          i18n.gettext('Response by %(userName)s'),
          featuredReviewPlaceholders,
        );
      } else {
        featuredReviewHeader = i18n.sprintf(
          i18n.gettext('Review by %(userName)s'),
          featuredReviewPlaceholders,
        );
      }
    }

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

function mapStateToProps(
  state: AppState,
  ownProps: InternalProps,
): PropsFromState {
  const { reviewId } = ownProps;
  invariant(reviewId, 'Cannot render a FeaturedAddonReview without a reviewId');

  const featuredReview = selectReview(state.reviews, reviewId);

  return {
    featuredReview,
    loadingReview:
      state.reviews.view[reviewId] &&
      state.reviews.view[reviewId].loadingReview,
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
