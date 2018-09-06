/* @flow */
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AddonReview from 'amo/components/AddonReview';
import FlagReviewMenu from 'amo/components/FlagReviewMenu';
import { ADDONS_EDIT } from 'core/constants';
import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import { getCurrentUser, hasPermission } from 'amo/reducers/users';
import { isAddonAuthor } from 'core/utils';
import {
  deleteAddonReview,
  hideEditReviewForm,
  hideReplyToReviewForm,
  sendReplyToReview,
  showEditReviewForm,
  showReplyToReviewForm,
} from 'amo/actions/reviews';
import ConfirmButton from 'ui/components/ConfirmButton';
import DismissibleTextForm from 'ui/components/DismissibleTextForm';
import Icon from 'ui/components/Icon';
import LoadingText from 'ui/components/LoadingText';
import UserReview from 'ui/components/UserReview';
import type { UserReviewType } from 'amo/actions/reviews';
import type { UserType } from 'amo/reducers/users';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { AddonType } from 'core/types/addons';
import type { DispatchFunc } from 'core/types/redux';
import type { OnSubmitParams } from 'ui/components/DismissibleTextForm';
import type { I18nType } from 'core/types/i18n';
import type { ReactRouterLocationType } from 'core/types/router';

import './styles.scss';

type Props = {|
  addon?: AddonType | null,
  bodyFallback?: React.Node | string,
  className?: string,
  flaggable?: boolean,
  isReplyToReviewId?: number,
  location: ReactRouterLocationType,
  review?: UserReviewType | null,
  showRating?: boolean,
|};

type InternalProps = {|
  ...Props,
  deletingReview: boolean,
  dispatch: DispatchFunc,
  editingReview: boolean,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  replyingToReview: boolean,
  siteUser: UserType | null,
  siteUserHasReplyPerm: boolean,
  submittingReply: boolean,
|};

export class AddonReviewCardBase extends React.Component<InternalProps> {
  static defaultProps = {
    flaggable: true,
    showRating: true,
  };

  onClickToDeleteReview = (event: SyntheticEvent<HTMLElement>) => {
    const {
      addon,
      dispatch,
      errorHandler,
      isReplyToReviewId,
      review,
    } = this.props;
    event.preventDefault();

    invariant(addon, 'addon is required');
    invariant(review, 'review is required');
    dispatch(
      deleteAddonReview({
        addonId: addon.id,
        errorHandlerId: errorHandler.id,
        reviewId: review.id,
        isReplyToReviewId,
      }),
    );
  };

  onClickToEditReview = (event: SyntheticEvent<any>) => {
    const { dispatch, isReplyToReviewId, review } = this.props;
    event.preventDefault();

    if (isReplyToReviewId !== undefined) {
      dispatch(showReplyToReviewForm({ reviewId: isReplyToReviewId }));
    } else {
      if (!review) {
        log.debug('Cannot edit a review because no review has been loaded.');
        return;
      }
      dispatch(showEditReviewForm({ reviewId: review.id }));
    }
  };

  onEscapeReviewOverlay = () => {
    const { dispatch, review } = this.props;
    if (!review) {
      log.debug('Cannot hide review form because no review has been loaded.');
      return;
    }
    // Even though an escaped overlay will be hidden, we still have to
    // synchronize our show/hide state otherwise we won't be able to
    // show the overlay after it has been escaped.
    dispatch(hideEditReviewForm({ reviewId: review.id }));
  };

  onReviewSubmitted = () => {
    const { dispatch, review } = this.props;
    if (!review) {
      log.debug('Cannot hide review form because no review has been loaded.');
      return;
    }
    dispatch(hideEditReviewForm({ reviewId: review.id }));
  };

  onClickToBeginReviewReply = (event: SyntheticEvent<any>) => {
    event.preventDefault();
    const { dispatch, review } = this.props;
    if (!review) {
      log.debug('Cannot show review form because no review has been loaded.');
      return;
    }
    dispatch(showReplyToReviewForm({ reviewId: review.id }));
  };

  onDismissReviewReply = () => {
    const { dispatch, review } = this.props;
    if (!review) {
      log.debug('Cannot hide review form because no review has been loaded.');
      return;
    }
    dispatch(hideReplyToReviewForm({ reviewId: review.id }));
  };

  onSubmitReviewReply = (reviewData: OnSubmitParams) => {
    const { dispatch, errorHandler, review } = this.props;
    if (!review) {
      throw new Error(
        'The review property cannot be empty when replying to a review',
      );
    }

    dispatch(
      sendReplyToReview({
        errorHandlerId: errorHandler.id,
        originalReviewId: review.id,
        body: reviewData.text,
      }),
    );
  };

  isRatingOnly() {
    const { review } = this.props;
    // Return true if this review does not have any text.
    return review && !review.body;
  }

  isReply() {
    return this.props.isReplyToReviewId !== undefined;
  }

  editPrompt() {
    const { i18n } = this.props;

    if (this.isReply()) {
      return i18n.gettext('Edit my reply');
    }

    if (this.isRatingOnly()) {
      return i18n.gettext('Edit my rating');
    }

    return i18n.gettext('Edit my review');
  }

  deletePrompt() {
    const { i18n } = this.props;

    if (this.isReply()) {
      return i18n.gettext('Delete my reply');
    }

    if (this.isRatingOnly()) {
      return i18n.gettext('Delete my rating');
    }

    return i18n.gettext('Delete my review');
  }

  confirmDeletePrompt() {
    const { i18n } = this.props;

    if (this.isReply()) {
      return i18n.gettext('Do you really want to delete this reply?');
    }

    if (this.isRatingOnly()) {
      return i18n.gettext('Do you really want to delete this rating?');
    }

    return i18n.gettext('Do you really want to delete this review?');
  }

  renderReply() {
    const {
      addon,
      errorHandler,
      i18n,
      location,
      replyingToReview,
      review,
      submittingReply,
    } = this.props;

    if (!review || (!review.reply && !replyingToReview)) {
      return null;
    }

    return (
      <div className="AddonReviewCard-reply">
        <h4 className="AddonReviewCard-reply-header">
          <Icon name="reply-arrow" />
          {i18n.gettext('Developer response')}
        </h4>
        {replyingToReview ? (
          <DismissibleTextForm
            className="AddonReviewCard-reply-form"
            isSubmitting={submittingReply && !errorHandler.hasError()}
            onDismiss={this.onDismissReviewReply}
            onSubmit={this.onSubmitReviewReply}
            placeholder={i18n.gettext('Write a reply to this review.')}
            submitButtonText={
              review.reply
                ? i18n.gettext('Update reply')
                : i18n.gettext('Publish reply')
            }
            submitButtonInProgressText={
              review.reply
                ? i18n.gettext('Updating reply')
                : i18n.gettext('Publishing reply')
            }
            text={review.reply && review.reply.body}
          />
        ) : (
          <AddonReviewCard
            addon={addon}
            isReplyToReviewId={review.id}
            location={location}
            review={review.reply}
          />
        )}
      </div>
    );
  }

  render() {
    const {
      addon,
      bodyFallback,
      className,
      deletingReview,
      editingReview,
      errorHandler,
      flaggable,
      i18n,
      siteUserHasReplyPerm,
      location,
      replyingToReview,
      review,
      showRating,
      siteUser,
    } = this.props;

    let byLine;

    if (review) {
      const timestamp = i18n.moment(review.created).fromNow();
      if (this.isReply()) {
        // translators: Example in English: "posted last week"
        byLine = i18n.sprintf(i18n.gettext('posted %(timestamp)s'), {
          timestamp,
        });
      } else {
        byLine = (
          <span className="AddonReviewCard-authorByLine">
            {/* translators: Example in English: "from UserName123, last week" */}
            {i18n.sprintf(i18n.gettext('by %(authorName)s, %(timestamp)s'), {
              authorName: review.userName,
              timestamp,
            })}
          </span>
        );
      }
    } else {
      byLine = <LoadingText />;
    }

    const confirmButtonClassName = 'AddonReviewCard-delete';

    const controls = (
      <div className="AddonReviewCard-allControls">
        {siteUser && review && review.userId === siteUser.id ? (
          <React.Fragment>
            {/* This will render an overlay to edit the review */}
            {editingReview ? (
              <AddonReview
                onEscapeOverlay={this.onEscapeReviewOverlay}
                onReviewSubmitted={this.onReviewSubmitted}
                review={review}
              />
            ) : null}
            <a
              href="#edit"
              onClick={this.onClickToEditReview}
              className="AddonReviewCard-edit AddonReviewCard-control"
            >
              {this.editPrompt()}
            </a>
            {deletingReview && !errorHandler.hasError() ? (
              <span className="AddonReviewCard-control AddonReviewCard-deleting">
                {i18n.gettext('Deleting…')}
              </span>
            ) : (
              <ConfirmButton
                buttonType="cancel"
                cancelButtonType="neutral"
                className={makeClassName(
                  'AddonReviewCard-control',
                  confirmButtonClassName,
                )}
                confirmButtonText={i18n.gettext('Delete')}
                id={`${confirmButtonClassName}-${review.id}`}
                message={this.confirmDeletePrompt()}
                onConfirm={this.onClickToDeleteReview}
              >
                {this.deletePrompt()}
              </ConfirmButton>
            )}
          </React.Fragment>
        ) : null}

        {review &&
        addon &&
        siteUser &&
        !replyingToReview &&
        !review.reply &&
        !this.isReply() &&
        (isAddonAuthor({ addon, userId: siteUser.id }) ||
          siteUserHasReplyPerm) &&
        review.userId !== siteUser.id ? (
          <a
            href="#reply"
            onClick={this.onClickToBeginReviewReply}
            className="AddonReviewCard-begin-reply AddonReviewCard-control"
          >
            <Icon name="reply-arrow" />
            {i18n.gettext('Reply to this review')}
          </a>
        ) : null}

        {flaggable && review ? (
          <FlagReviewMenu
            isDeveloperReply={this.isReply()}
            location={location}
            openerClass="AddonReviewCard-control"
            review={review}
          />
        ) : null}
      </div>
    );

    return (
      <UserReview
        bodyFallback={bodyFallback}
        className={makeClassName('AddonReviewCard', className)}
        controls={controls}
        review={review}
        byLine={byLine}
        showRating={!this.isReply() && showRating}
      >
        {errorHandler.renderErrorIfPresent()}
        {this.renderReply()}
      </UserReview>
    );
  }
}

export function mapStateToProps(state: AppState, ownProps: Props) {
  let deletingReview = false;
  let editingReview = false;
  let replyingToReview = false;
  let submittingReply = false;
  if (ownProps.review) {
    const view = state.reviews.view[ownProps.review.id];
    if (view) {
      deletingReview = view.deletingReview;
      editingReview = view.editingReview;
      replyingToReview = view.replyingToReview;
      submittingReply = view.submittingReply;
    }
  }
  return {
    deletingReview,
    editingReview,
    siteUserHasReplyPerm: hasPermission(state, ADDONS_EDIT),
    replyingToReview,
    siteUser: getCurrentUser(state.users),
    submittingReply,
  };
}

const AddonReviewCard: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  withErrorHandler({ name: 'AddonReviewCard' }),
  translate(),
)(AddonReviewCardBase);

export default AddonReviewCard;
