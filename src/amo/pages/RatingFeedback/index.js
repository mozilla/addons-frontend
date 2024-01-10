/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Helmet } from 'react-helmet';
import invariant from 'invariant';

import { fetchReview, sendRatingAbuseReport } from 'amo/actions/reviews';
import { selectReview } from 'amo/reducers/reviews';
import FeedbackForm, {
  CATEGORY_HATEFUL_VIOLENT_DECEPTIVE,
  CATEGORY_ILLEGAL,
  CATEGORY_SOMETHING_ELSE,
} from 'amo/components/FeedbackForm';
import LoadingText from 'amo/components/LoadingText';
import Card from 'amo/components/Card';
import UserReview from 'amo/components/UserReview';
import log from 'amo/logger';
import translate from 'amo/i18n/translate';
import NotFoundPage from 'amo/pages/ErrorPages/NotFoundPage';
import Page from 'amo/components/Page';
import { withFixedErrorHandler } from 'amo/errorHandler';
import fallbackIcon from 'amo/img/icons/default.svg';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { DispatchFunc } from 'amo/types/redux';
import type { ReactRouterMatchType } from 'amo/types/router';
import type { I18nType } from 'amo/types/i18n';
import type { FeedbackFormValues } from 'amo/components/FeedbackForm';
import type { UserReviewType } from 'amo/actions/reviews';

import './styles.scss';

type Props = {|
  match: {|
    ...ReactRouterMatchType,
    params: {| ratingId: number |},
  |},
|};

type PropsFromState = {|
  review: UserReviewType | null,
  reviewIsLoading: boolean,
  hasSubmitted: boolean,
  isSubmitting: boolean,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  i18n: I18nType,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
|};

export class RatingFeedbackBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    const { dispatch, errorHandler, match, review, reviewIsLoading } = props;
    const { params } = match;

    if (errorHandler.hasError()) {
      log.warn('Not loading data because of an error.');
      return;
    }

    if (!review && !reviewIsLoading) {
      dispatch(
        fetchReview({
          reviewId: params.ratingId,
          errorHandlerId: errorHandler.id,
        }),
      );
    }
  }

  onFormSubmitted: (values: FeedbackFormValues) => void = (values) => {
    const { dispatch, errorHandler, review } = this.props;
    const { anonymous, email, name, text, category } = values;

    invariant(review, 'review is required');

    dispatch(
      sendRatingAbuseReport({
        // Only authenticate the API call when the report isn't submitted
        // anonymously.
        auth: anonymous === false,
        errorHandlerId: errorHandler.id,
        message: text,
        ratingId: review.id,
        reason: category,
        reporterEmail: anonymous ? '' : email,
        reporterName: anonymous ? '' : name,
      }),
    );
  };

  render(): React.Node {
    const { errorHandler, i18n, review, isSubmitting, hasSubmitted } =
      this.props;

    if (
      errorHandler.hasError() &&
      errorHandler.capturedError.responseStatusCode === 404
    ) {
      return <NotFoundPage />;
    }

    return (
      <Page>
        <div className="RatingFeedback-page">
          <Helmet>
            <title>
              {i18n.t('Submit feedback or report a review to Mozilla')}
            </title>
            <meta name="robots" content="noindex, follow" />
          </Helmet>

          <FeedbackForm
            errorHandler={errorHandler}
            contentHeader={
              <Card className="RatingFeedback-header">
                <div className="RatingFeedback-header-icon">
                  <div className="RatingFeedback-header-icon-wrapper">
                    <img
                      className="RatingFeedback-header-icon-image"
                      src={review?.reviewAddon.iconUrl || fallbackIcon}
                      alt=""
                    />
                  </div>
                </div>
                <h1 className="RatingFeedback-header-title">
                  {review ? review.reviewAddon.name : <LoadingText />}
                </h1>
                <UserReview
                  review={review}
                  // Even if a review is a (developer) reply, we do not want to
                  // show the special UI for it on the rating feedback form
                  // page.
                  isReply={false}
                  byLine={
                    review ? (
                      i18n.t('by %(userName)s, %(timestamp)s', {
                        userName: review.userName,
                        timestamp: i18n.moment(review.created).fromNow(),
                      })
                    ) : (
                      <LoadingText />
                    )
                  }
                  showRating={!review?.isDeveloperReply}
                />
              </Card>
            }
            abuseIsLoading={isSubmitting}
            abuseSubmitted={hasSubmitted}
            categoryHeader={i18n.t('Report this review to Mozilla')}
            // This title isn't used because we didn't select any of the
            // "feedback" categories.
            feedbackTitle=""
            reportTitle={i18n.t(
              'Report the review because it is illegal or incompliant',
            )}
            categories={[
              CATEGORY_HATEFUL_VIOLENT_DECEPTIVE,
              CATEGORY_ILLEGAL,
              CATEGORY_SOMETHING_ELSE,
            ]}
            showLocation={false}
            onSubmit={this.onFormSubmitted}
          />
        </div>
      </Page>
    );
  }
}

function mapStateToProps(
  state: AppState,
  ownProps: InternalProps,
): PropsFromState {
  const { ratingId } = ownProps.match.params;
  const review = selectReview(state.reviews, ratingId) || null;
  const view = state.reviews.view[ratingId];
  const reviewIsLoading = view?.loadingReview;
  const { inProgress: isSubmitting, wasFlagged: hasSubmitted } =
    view?.flag || {};

  return {
    review,
    reviewIsLoading,
    isSubmitting,
    hasSubmitted,
  };
}

export const extractId = (ownProps: InternalProps): string => {
  return String(ownProps.match.params.ratingId);
};

const RatingFeedback: React.ComponentType<Props> = compose(
  translate(),
  connect(mapStateToProps),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(RatingFeedbackBase);

export default RatingFeedback;
