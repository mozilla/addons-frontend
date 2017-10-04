/* @flow */
/* eslint-disable react/sort-comp */
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AddonReview from 'amo/components/AddonReview';
import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import { isAuthenticated } from 'core/reducers/user';
import { isAddonAuthor, nl2br, sanitizeHTML } from 'core/utils';
import {
  hideEditReviewForm,
  hideReplyToReviewForm,
  sendReplyToReview,
  showEditReviewForm,
  showReplyToReviewForm,
} from 'amo/actions/reviews';
import LoadingText from 'ui/components/LoadingText';
import Rating from 'ui/components/Rating';
import DismissibleTextForm from 'ui/components/DismissibleTextForm';
import type { UserReviewType } from 'amo/actions/reviews';
import type { ReviewState } from 'amo/reducers/reviews';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { UserStateType } from 'core/reducers/user';
import type { AddonType } from 'core/types/addons';
import type { DispatchFunc } from 'core/types/redux';
import type { OnSubmitParams } from 'ui/components/DismissibleTextForm';

import './styles.scss';

type PropsType = {|
  addon?: AddonType,
  editingReview: boolean,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  isAuthenticated: boolean,
  i18n: Object,
  review?: UserReviewType,
  replyingToReview: boolean,
  siteUser: UserStateType,
  submittingReply: boolean,
|};

export class AddonReviewListItemBase extends React.Component {
  props: PropsType;

  onClickToEditReview = (event: SyntheticEvent) => {
    const { dispatch, review } = this.props;
    event.preventDefault();
    if (!review) {
      log.debug(
        'Cannot edit a review because no review has been loaded.');
      return;
    }
    dispatch(showEditReviewForm({ reviewId: review.id }));
  }

  onEscapeReviewOverlay = () => {
    const { dispatch, review } = this.props;
    if (!review) {
      log.debug(
        'Cannot hide review form because no review has been loaded.');
      return;
    }
    // Even though an escaped overlay will be hidden, we still have to
    // synchronize our show/hide state otherwise we won't be able to
    // show the overlay after it has been escaped.
    dispatch(hideEditReviewForm({ reviewId: review.id }));
  }

  onReviewSubmitted = () => {
    const { dispatch, review } = this.props;
    if (!review) {
      log.debug(
        'Cannot hide review form because no review has been loaded.');
      return;
    }
    dispatch(hideEditReviewForm({ reviewId: review.id }));
  }

  onClickToBeginReviewReply = (event: SyntheticEvent) => {
    event.preventDefault();
    const { dispatch, review } = this.props;
    if (!review) {
      log.debug(
        'Cannot show review form because no review has been loaded.');
      return;
    }
    dispatch(showReplyToReviewForm({ reviewId: review.id }));
  }

  onDismissReviewReply = () => {
    const { dispatch, review } = this.props;
    if (!review) {
      log.debug(
        'Cannot hide review form because no review has been loaded.');
      return;
    }
    dispatch(hideReplyToReviewForm({ reviewId: review.id }));
  }

  onSubmitReviewReply = (reviewData: OnSubmitParams) => {
    const { dispatch, errorHandler, review } = this.props;
    if (!review) {
      throw new Error(
        'The review property cannot be empty when replying to a review');
    }

    dispatch(sendReplyToReview({
      errorHandlerId: errorHandler.id,
      originalReviewId: review.id,
      body: reviewData.text,
    }));
  }

  render() {
    const {
      addon,
      editingReview,
      errorHandler,
      isAuthenticated: userIsAuthenticated,
      i18n,
      replyingToReview,
      review,
      siteUser,
      submittingReply,
    } = this.props;

    let byLine;
    let reviewBody;
    if (review) {
      const timestamp = i18n.moment(review.created).fromNow();
      // translators: Example: "from Jose, last week"
      byLine = i18n.sprintf(
        i18n.gettext('from %(authorName)s, %(timestamp)s'),
        { authorName: review.userName, timestamp });

      const reviewBodySanitized = sanitizeHTML(
        nl2br(review.body), ['br']
      );
      // eslint-disable-next-line react/no-danger
      reviewBody = <p dangerouslySetInnerHTML={reviewBodySanitized} />;
    } else {
      byLine = <LoadingText />;
      reviewBody = <p><LoadingText /></p>;
    }

    return (
      <div className="AddonReviewListItem">
        {errorHandler.renderErrorIfPresent()}
        <h3>{review ? review.title : <LoadingText />}</h3>
        {reviewBody}
        <div className="AddonReviewListItem-by-line">
          {review ?
            <Rating styleName="small" rating={review.rating} readOnly />
            : null
          }
          {byLine}
        </div>
        <div className="AddonReviewListItem-controls">
          {
            userIsAuthenticated && review &&
            review.userId === siteUser.id ?
              (
                <div>
                  {/* This will render an overlay to edit the review */}
                  {editingReview ?
                    <AddonReview
                      onEscapeOverlay={this.onEscapeReviewOverlay}
                      onReviewSubmitted={this.onReviewSubmitted}
                      review={review}
                    />
                    : null
                  }
                  <a
                    href="#edit"
                    onClick={this.onClickToEditReview}
                    className="AddonReviewListItem-edit"
                  >
                    {i18n.gettext('Edit my review')}
                  </a>
                </div>
              ) : null
          }
          {
            !replyingToReview && userIsAuthenticated &&
            review && !review.reply &&
            addon && isAddonAuthor({ addon, userId: siteUser.id }) ?
              <a
                href="#reply"
                onClick={this.onClickToBeginReviewReply}
                className="AddonReviewListItem-begin-reply"
              >
                {i18n.gettext('Reply to this review')}
              </a>
              : null
          }
        </div>
        {replyingToReview ?
          <DismissibleTextForm
            className="AddonReviewListItem-reply-form"
            isSubmitting={submittingReply}
            onDismiss={this.onDismissReviewReply}
            onSubmit={this.onSubmitReviewReply}
            placeholder={i18n.gettext(
              'Write a reply to this review.'
            )}
            submitButtonText={i18n.gettext('Submit reply')}
            submitButtonInProgressText={i18n.gettext('Submitting reply')}
          />
          : null
        }
      </div>
    );
  }
}

export function mapStateToProps(
  state: {| user: UserStateType, reviews: ReviewState |},
  ownProps: PropsType,
) {
  let editingReview = false;
  let replyingToReview = false;
  let submittingReply = false;
  if (ownProps.review) {
    const view = state.reviews.view[ownProps.review.id];
    if (view) {
      editingReview = view.editingReview;
      replyingToReview = view.replyingToReview;
      submittingReply = view.submittingReply;
    }
  }
  return {
    editingReview,
    isAuthenticated: isAuthenticated(state),
    replyingToReview,
    siteUser: state.user,
    submittingReply,
  };
}

export default compose(
  connect(mapStateToProps),
  withErrorHandler({ name: 'AddonReviewListItem' }),
  translate({ withRef: true }),
)(AddonReviewListItemBase);
