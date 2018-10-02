/* @flow */
import makeClassName from 'classnames';
import config from 'config';
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import AddonReview from 'amo/components/AddonReview';
import AddonReviewManager from 'amo/components/AddonReviewManager';
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
import Button from 'ui/components/Button';
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

import './styles.scss';

type Props = {|
  addon?: AddonType | null,
  className?: string,
  flaggable?: boolean,
  isReplyToReviewId?: number,
  smallerWriteReviewButton?: boolean,
  review?: UserReviewType | null,
  shortByLine?: boolean,
  showControls?: boolean,
  showRating?: boolean,
  verticalButtons?: boolean,
|};

type InternalProps = {|
  ...Props,
  _config: typeof config,
  _siteUserCanManageReplies?: () => boolean,
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
    _config: config,
    flaggable: true,
    smallerWriteReviewButton: true,
    shortByLine: false,
    showControls: true,
    showRating: true,
    verticalButtons: false,
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

  onCancelEditReview = () => {
    const { dispatch, review } = this.props;
    invariant(review, 'review is required');

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

  confirmButtonText() {
    const { i18n } = this.props;

    if (this.isReply()) {
      return i18n.gettext('Delete reply');
    }

    if (this.isRatingOnly()) {
      return i18n.gettext('Delete rating');
    }

    return i18n.gettext('Delete review');
  }

  cancelButtonText() {
    const { i18n } = this.props;

    if (this.isReply()) {
      return i18n.gettext('Keep reply');
    }

    if (this.isRatingOnly()) {
      return i18n.gettext('Keep rating');
    }

    return i18n.gettext('Keep review');
  }

  siteUserCanManageReplies() {
    const {
      addon,
      siteUser,
      siteUserHasReplyPerm,
      _siteUserCanManageReplies,
    } = this.props;
    if (_siteUserCanManageReplies) {
      // Return a stub implementation for testing.
      return _siteUserCanManageReplies();
    }
    if (!siteUser) {
      return false;
    }
    return (
      isAddonAuthor({ addon, userId: siteUser.id }) || siteUserHasReplyPerm
    );
  }

  renderReply() {
    const {
      addon,
      errorHandler,
      i18n,
      replyingToReview,
      review,
      submittingReply,
    } = this.props;

    if (!review || (!review.reply && !replyingToReview)) {
      return null;
    }

    return (
      <div className="AddonReviewCard-reply">
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
            review={review.reply}
          />
        )}
      </div>
    );
  }

  render() {
    const {
      _config,
      className,
      deletingReview,
      editingReview,
      errorHandler,
      flaggable,
      i18n,
      smallerWriteReviewButton,
      replyingToReview,
      review,
      shortByLine,
      showControls,
      showRating,
      siteUser,
      verticalButtons,
    } = this.props;

    let byLine;
    const noAuthor = shortByLine || this.isReply();

    if (review) {
      const url = `/addon/${review.reviewAddon.slug}/reviews/${review.id}/`;
      const timestamp = (
        <Link key={review.id} to={url}>
          {i18n.moment(review.created).fromNow()}
        </Link>
      );

      const byLineString = noAuthor
        ? // translators: Example in English: "posted last week"
          i18n.gettext('posted %(timestamp)s')
        : // translators: Example in English: "by UserName123, last week"
          i18n.gettext('by %(authorName)s, %(timestamp)s');

      // This somewhat odd code is needed because we want to wrap the timestamp
      // inside a Link component, and the whole thing is inside a string that
      // needs to be localized, so we localize the string first and then
      // inject the timestamp, wrapped in a Link, inside the string.
      const localized = i18n.sprintf(byLineString, {
        authorName: review.userName,
        timestamp: '__timestamp__',
      });

      const parts = localized.split('__timestamp__');
      const allParts = [parts.shift(), timestamp, ...parts];

      byLine = (
        <span
          className={makeClassName('', {
            'AddonReviewCard-authorByLine': !noAuthor,
          })}
        >
          {allParts}
        </span>
      );
    } else {
      byLine = <LoadingText />;
    }

    const confirmButtonClassName = 'AddonReviewCard-delete';

    const showEditControls =
      review &&
      siteUser &&
      (review.userId === siteUser.id ||
        (this.isReply() && this.siteUserCanManageReplies()));

    const controls = showControls ? (
      <div className="AddonReviewCard-allControls">
        {review && showEditControls ? (
          <React.Fragment>
            {editingReview &&
              !_config.get('enableFeatureInlineAddonReview') && (
                // This will render an overlay to edit the review
                <AddonReview
                  onEscapeOverlay={this.onEscapeReviewOverlay}
                  onReviewSubmitted={this.onReviewSubmitted}
                  review={review}
                />
              )}
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
              <ConfirmButton
                buttonType="cancel"
                cancelButtonText={this.cancelButtonText()}
                cancelButtonType="neutral"
                className={makeClassName(
                  'AddonReviewCard-control',
                  confirmButtonClassName,
                )}
                confirmButtonText={this.confirmButtonText()}
                id={`${confirmButtonClassName}-${review.id}`}
                onConfirm={this.onClickToDeleteReview}
                puffyButtons={verticalButtons}
              >
                {this.deletePrompt()}
              </ConfirmButton>
            )}
          </React.Fragment>
        ) : null}

        {review &&
        !replyingToReview &&
        !review.reply &&
        !this.isReply() &&
        this.siteUserCanManageReplies() &&
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

        {flaggable && review ? (
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
          'AddonReviewCard-ratingOnly': this.isRatingOnly(),
          'AddonReviewCard-viewOnly': !editingReview,
          'AddonReviewCard-verticalButtons': verticalButtons,
        })}
      >
        {review &&
        editingReview &&
        _config.get('enableFeatureInlineAddonReview') ? (
          <AddonReviewManager
            onCancel={this.onCancelEditReview}
            puffyButtons={Boolean(verticalButtons)}
            review={review}
          />
        ) : (
          <React.Fragment>
            <UserReview
              controls={controls}
              review={review}
              byLine={byLine}
              showRating={!this.isReply() && showRating}
              isReply={this.isReply()}
            />
            {siteUser &&
              review &&
              review.userId === siteUser.id &&
              this.isRatingOnly() && (
                <Button
                  className="AddonReviewCard-writeReviewButton"
                  onClick={this.onClickToEditReview}
                  href="#writeReview"
                  buttonType="action"
                  puffy={!smallerWriteReviewButton}
                >
                  {i18n.gettext('Write a review')}
                </Button>
              )}
          </React.Fragment>
        )}
        {errorHandler.renderErrorIfPresent()}
        {this.renderReply()}
      </div>
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
    replyingToReview,
    siteUser: getCurrentUser(state.users),
    siteUserHasReplyPerm: hasPermission(state, ADDONS_EDIT),
    submittingReply,
  };
}

const AddonReviewCard: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  withErrorHandler({ name: 'AddonReviewCard' }),
  translate(),
)(AddonReviewCardBase);

export default AddonReviewCard;
