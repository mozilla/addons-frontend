/* @flow */
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import AddonReviewManager from 'amo/components/AddonReviewManager';
import FlagReviewMenu from 'amo/components/FlagReviewMenu';
import { reviewListURL } from 'amo/reducers/reviews';
import { ADDONS_EDIT } from 'core/constants';
import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import { normalizeFileNameId } from 'core/utils';
import { getCurrentUser, hasPermission } from 'amo/reducers/users';
import {
  beginDeleteAddonReview,
  cancelDeleteAddonReview,
  deleteAddonReview,
  hideEditReviewForm,
  hideReplyToReviewForm,
  sendReplyToReview,
  showEditReviewForm,
  showReplyToReviewForm,
} from 'amo/actions/reviews';
import { getLocalizedTextWithLinkParts } from 'core/utils/i18n';
import Button from 'ui/components/Button';
import ConfirmationDialog from 'ui/components/ConfirmationDialog';
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

import './styles.scss';

type Props = {|
  addon?: AddonType | null,
  className?: string,
  flaggable?: boolean,
  isReplyToReviewId?: number,
  review?: UserReviewType | null,
  shortByLine?: boolean,
  showControls?: boolean,
  showRating?: boolean,
  siteUserCanReply: ?boolean,
  // When true, this renders things *bigger* because the container is
  // more slim than usual, like the Rate Your Experience card.
  //
  // When false (the default), it is to say that the container is wider,
  // like an add-on review listing or a user profile listing.
  slim?: boolean,
|};

type InternalProps = {|
  ...Props,
  beginningToDeleteReview: boolean,
  deletingReview: boolean,
  dispatch: DispatchFunc,
  editingReview: boolean,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  replyingToReview: boolean,
  siteUser: UserType | null,
  siteUserCanManageReplies: boolean,
  siteUserHasReplyPerm: boolean,
  submittingReply: boolean,
|};

export class AddonReviewCardBase extends React.Component<InternalProps> {
  static defaultProps = {
    flaggable: true,
    shortByLine: false,
    showControls: true,
    showRating: true,
    slim: false,
  };

  onBeginDeleteReview = (event: SyntheticEvent<HTMLElement>) => {
    const { dispatch, review } = this.props;
    event.preventDefault();

    invariant(review, 'review is required');
    dispatch(beginDeleteAddonReview({ reviewId: review.id }));
  };

  onCancelDeleteReview = (event: SyntheticEvent<HTMLElement>) => {
    const { dispatch, review } = this.props;
    event.preventDefault();

    invariant(review, 'review is required');
    dispatch(cancelDeleteAddonReview({ reviewId: review.id }));
  };

  onClickToDeleteReview = (event: SyntheticEvent<HTMLElement>) => {
    const { dispatch, errorHandler, isReplyToReviewId, review } = this.props;
    event.preventDefault();

    invariant(review, 'review is required');
    dispatch(
      deleteAddonReview({
        addonId: review.reviewAddon.id,
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

  onCancelEditReview = () => {
    const { dispatch, review } = this.props;
    invariant(review, 'review is required');

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
    const { isReplyToReviewId, review } = this.props;
    return (
      isReplyToReviewId !== undefined ||
      Boolean(review && review.isDeveloperReply)
    );
  }

  editPrompt() {
    const { i18n } = this.props;

    if (this.isReply()) {
      return i18n.gettext('Edit reply');
    }

    return i18n.gettext('Edit review');
  }

  deletePrompt() {
    const { i18n } = this.props;

    if (this.isReply()) {
      return i18n.gettext('Delete reply');
    }

    if (this.isRatingOnly()) {
      return i18n.gettext('Delete rating');
    }

    return i18n.gettext('Delete review');
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

  confirmDeleteButtonText() {
    const { i18n, slim } = this.props;

    if (!slim) {
      return i18n.gettext('Delete');
    }

    if (this.isReply()) {
      return i18n.gettext('Delete reply');
    }

    if (this.isRatingOnly()) {
      return i18n.gettext('Delete rating');
    }

    return i18n.gettext('Delete review');
  }

  cancelDeleteButtonText() {
    const { i18n, slim } = this.props;

    if (!slim) {
      return i18n.gettext('Cancel');
    }

    if (this.isReply()) {
      return i18n.gettext('Keep reply');
    }

    if (this.isRatingOnly()) {
      return i18n.gettext('Keep rating');
    }

    return i18n.gettext('Keep review');
  }

  renderReply() {
    const {
      addon,
      errorHandler,
      i18n,
      replyingToReview,
      review,
      slim,
      siteUserCanReply,
      submittingReply,
    } = this.props;

    if (!review || (!review.reply && !replyingToReview)) {
      return null;
    }

    const formId = [
      normalizeFileNameId(__filename),
      'addon',
      addon ? addon.id.toString() : 'no-addon',
      'review',
      review ? review.id.toString() : 'unsaved-review',
    ].join('-');

    return (
      <div className="AddonReviewCard-reply">
        {replyingToReview ? (
          <DismissibleTextForm
            className="AddonReviewCard-reply-form"
            id={formId}
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
            review={review.reply}
            slim={slim}
            siteUserCanReply={siteUserCanReply}
          />
        )}
      </div>
    );
  }

  render() {
    const {
      beginningToDeleteReview,
      className,
      deletingReview,
      editingReview,
      errorHandler,
      flaggable,
      i18n,
      replyingToReview,
      review,
      shortByLine,
      showControls,
      showRating,
      siteUser,
      siteUserCanManageReplies,
      slim,
    } = this.props;

    let byLine;
    const noAuthor = shortByLine || this.isReply();

    if (review) {
      const byLineString = noAuthor
        ? // translators: Example in English: "posted last week"
          i18n.gettext('posted %(linkStart)s%(timestamp)s%(linkEnd)s')
        : // translators: Example in English: "by UserName123, last week"
          i18n.gettext(
            'by %(authorName)s, %(linkStart)s%(timestamp)s%(linkEnd)s',
          );

      const linkParts = getLocalizedTextWithLinkParts({
        i18n,
        text: byLineString,
        otherVars: {
          authorName: review.userName,
          timestamp: i18n.moment(review.created).fromNow(),
        },
      });

      byLine = (
        <span
          className={makeClassName('', {
            'AddonReviewCard-authorByLine': !noAuthor,
          })}
        >
          {linkParts.beforeLinkText}
          <Link
            key={review.id}
            to={reviewListURL({
              addonSlug: review.reviewAddon.slug,
              id: review.id,
            })}
          >
            {linkParts.innerLinkText}
          </Link>
          {linkParts.afterLinkText}
        </span>
      );
    } else {
      byLine = <LoadingText />;
    }

    let controlsAreVisible = showControls;
    if (beginningToDeleteReview) {
      controlsAreVisible = false;
    }

    const showEditControls =
      review &&
      siteUser &&
      (review.userId === siteUser.id ||
        (this.isReply() && siteUserCanManageReplies));

    const controls = controlsAreVisible ? (
      <div className="AddonReviewCard-allControls">
        {review && showEditControls ? (
          <React.Fragment>
            {!this.isRatingOnly() && (
              <a
                href="#edit"
                onClick={this.onClickToEditReview}
                className="AddonReviewCard-edit AddonReviewCard-control"
              >
                {this.editPrompt()}
              </a>
            )}
            {deletingReview && !errorHandler.hasError() ? (
              <span className="AddonReviewCard-control AddonReviewCard-deleting">
                {i18n.gettext('Deleting…')}
              </span>
            ) : (
              <Button
                buttonType="neutral"
                className={makeClassName(
                  'AddonReviewCard-control',
                  'AddonReviewCard-delete',
                )}
                onClick={this.onBeginDeleteReview}
              >
                {this.deletePrompt()}
              </Button>
            )}
          </React.Fragment>
        ) : null}

        {review &&
        !replyingToReview &&
        !review.reply &&
        !this.isReply() &&
        siteUserCanManageReplies &&
        siteUser &&
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

        {/* Do not render the "flag" button for reviews made by the current user */}
        {flaggable && review && (!siteUser || siteUser.id !== review.userId) ? (
          <FlagReviewMenu
            isDeveloperReply={this.isReply()}
            openerClass="AddonReviewCard-control"
            review={review}
          />
        ) : null}
      </div>
    ) : null;

    return (
      <div
        className={makeClassName('AddonReviewCard', className, {
          'AddonReviewCard-isReply': this.isReply(),
          'AddonReviewCard-ratingOnly': this.isRatingOnly(),
          'AddonReviewCard-viewOnly': !editingReview,
          'AddonReviewCard-slim': slim,
        })}
      >
        <div className="AddonReviewCard-container">
          {errorHandler.renderErrorIfPresent()}
          {review && editingReview ? (
            <AddonReviewManager
              onCancel={this.onCancelEditReview}
              puffyButtons={slim}
              review={review}
            />
          ) : (
            <UserReview
              controls={controls}
              review={review}
              byLine={byLine}
              showRating={!this.isReply() && showRating}
              isReply={this.isReply()}
            />
          )}
        </div>
        {beginningToDeleteReview && (
          <ConfirmationDialog
            className="AddonReviewCard-confirmDeleteDialog"
            cancelButtonText={this.cancelDeleteButtonText()}
            cancelButtonType="neutral"
            confirmButtonText={this.confirmDeleteButtonText()}
            onCancel={this.onCancelDeleteReview}
            onConfirm={this.onClickToDeleteReview}
            message={slim ? undefined : this.confirmDeletePrompt()}
            puffyButtons={slim}
          />
        )}
        {this.renderReply()}
        {siteUser &&
          review &&
          review.userId === siteUser.id &&
          this.isRatingOnly() &&
          !beginningToDeleteReview &&
          !editingReview && (
            <Button
              className="AddonReviewCard-writeReviewButton"
              onClick={this.onClickToEditReview}
              buttonType="action"
              puffy={slim}
            >
              {i18n.gettext('Write a review')}
            </Button>
          )}
      </div>
    );
  }
}

export function mapStateToProps(state: AppState, ownProps: Props) {
  let beginningToDeleteReview = false;
  let deletingReview = false;
  let editingReview = false;
  let replyingToReview = false;
  let submittingReply = false;
  if (ownProps.review) {
    const view = state.reviews.view[ownProps.review.id];
    if (view) {
      beginningToDeleteReview = view.beginningToDeleteReview;
      deletingReview = view.deletingReview;
      editingReview = view.editingReview;
      replyingToReview = view.replyingToReview;
      submittingReply = view.submittingReply;
    }
  }

  const siteUserHasReplyPerm = hasPermission(state, ADDONS_EDIT);

  return {
    beginningToDeleteReview,
    deletingReview,
    editingReview,
    replyingToReview,
    siteUser: getCurrentUser(state.users),
    siteUserCanManageReplies: ownProps.siteUserCanReply || siteUserHasReplyPerm,
    siteUserHasReplyPerm,
    submittingReply,
  };
}

const AddonReviewCard: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  withErrorHandler({ name: 'AddonReviewCard' }),
  translate(),
)(AddonReviewCardBase);

export default AddonReviewCard;
