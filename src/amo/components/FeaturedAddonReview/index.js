/* @flow */
import * as React from 'react';
import NestedStatus from 'react-nested-status';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { fetchReview } from 'amo/actions/reviews';
import AddonReviewCard from 'amo/components/AddonReviewCard';
import { selectReview } from 'amo/reducers/reviews';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import Card from 'ui/components/Card';
import type { UserReviewType } from 'amo/actions/reviews';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';
import type { DispatchFunc } from 'core/types/redux';

import './styles.scss';

type Props = {|
  addon: AddonType | null,
  reviewId: number,
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

  componentWillReceiveProps(nextProps: InternalProps) {
    this.loadDataIfNeeded(nextProps);
  }

  loadDataIfNeeded(nextProps?: InternalProps) {
    const {
      dispatch,
      errorHandler,
      featuredReview,
      loadingReview,
      reviewId,
    } = {
      ...this.props,
      ...nextProps,
    };

    if (errorHandler.hasError()) {
      log.warn('Not loading data because of an error');
      return;
    }

    if (
      (!featuredReview ||
        (nextProps && this.props.reviewId !== nextProps.reviewId)) &&
      !loadingReview
    ) {
      dispatch(fetchReview({ reviewId, errorHandlerId: errorHandler.id }));
    }
  }

  render() {
    const { addon, errorHandler, featuredReview, i18n } = this.props;

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
        <AddonReviewCard addon={addon} review={featuredReview} />
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

export function mapStateToProps(state: AppState, ownProps: InternalProps) {
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

export const extractId = (ownProps: InternalProps) => {
  return ownProps.reviewId;
};

const FeaturedAddonReview: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(FeaturedAddonReviewBase);

export default FeaturedAddonReview;
