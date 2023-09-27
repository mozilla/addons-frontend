/* @flow */
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';

import Link from 'amo/components/Link';
import AddonReviewManager from 'amo/components/AddonReviewManager';
import FlagReviewMenu from 'amo/components/FlagReviewMenu';
import { reviewListURL } from 'amo/reducers/reviews';
import { ADDONS_EDIT, USERS_EDIT } from 'amo/constants';
import { withErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import log from 'amo/logger';
import { normalizeFileNameId } from 'amo/utils';
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
import { replaceStringsWithJSX } from 'amo/i18n/utils';
import Button from 'amo/components/Button';
import ConfirmationDialog from 'amo/components/ConfirmationDialog';
import DismissibleTextForm from 'amo/components/DismissibleTextForm';
import Icon from 'amo/components/Icon';
import LoadingText from 'amo/components/LoadingText';
import UserReview from 'amo/components/UserReview';
import Notice from 'amo/components/Notice';
import type { UserReviewType } from 'amo/actions/reviews';
import type { OnSubmitParams } from 'amo/components/DismissibleTextForm';
import type { UserType } from 'amo/reducers/users';
import type { AppState } from 'amo/store';
import type { AddonType } from 'amo/types/addons';
import type { ElementEvent, HTMLElementEventHandler } from 'amo/types/dom';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { I18nType } from 'amo/types/i18n';
import type { DispatchFunc } from 'amo/types/redux';
import type { ReactRouterLocationType } from 'amo/types/router';

import './styles.scss';

type DefaultProps = {|
  flaggable?: boolean,
  shortByLine?: boolean,
  showControls?: boolean,
  showRating?: boolean,
  // When true, this renders things *bigger* because the container is
  // more slim than usual, like the Rate Your Experience card.
  //
  // When false (the default), it is to say that the container is wider,
  // like an add-on review listing or a user profile listing.
  slim?: boolean,
|};

type Props = {|
  ...DefaultProps,
  addon?: AddonType | null,
  className?: string,
  isReplyToReviewId?: number,
  review?: UserReviewType | null,
  siteUserCanReply: ?boolean,
  isUserProfile?: boolean,
|};

type PropsFromState = {|
  beginningToDeleteReview: boolean,
  deletingReview: boolean,
  editingReview: boolean,
  hasUsersEditPermission: boolean,
  replyingToReview: boolean,
  siteUser: UserType | null,
  siteUserCanManageReplies: boolean,
  submittingReply: boolean,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  location: ReactRouterLocationType,
|};

export class AddonReviewCardBase extends React.Component<InternalProps> {
  static defaultProps: DefaultProps = {
    flaggable: true,
    shortByLine: false,
    showControls: true,
    showRating: true,
    slim: false,
  };

  onBeginDeleteReview: HTMLElementEventHandler = (event: ElementEvent) => {
    const { dispatch, review } = this.props;
    event.preventDefault();

    invariant(review, 'review is required');
    dispatch(beginDeleteAddonReview({ reviewId: review.id }));
  };

  onCancelDeleteReview: HTMLElementEventHandler = (event: ElementEvent) => {
    const { dispatch, review } = this.props;
    event.preventDefault();

    invariant(review, 'review is required');
    dispatch(cancelDeleteAddonReview({ reviewId: review.id }));
  };

  onClickToDeleteReview: HTMLElementEventHandler = (event: ElementEvent) => {
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

  onClickToEditReview: HTMLElementEventHandler = (event: ElementEvent) => {
    const { dispatch, isReplyToReviewId, review } = this.props;
    event.preventDefault();

    if (isReplyToReviewId !== undefined) {
      dispatch(showReplyToReviewForm({ reviewId: isReplyToReviewId }));
    } else {
      invariant(review, 'A review must be loaded.');
      dispatch(showEditReviewForm({ reviewId: review.id }));
    }
  };

  onCancelEditReview: () => void = () => {
    const { dispatch, review } = this.props;
    invariant(review, 'review is required');

    dispatch(hideEditReviewForm({ reviewId: review.id }));
  };

  onClickToBeginReviewReply: HTMLElementEventHandler = (
    event: ElementEvent,
  ) => {
    event.preventDefault();
    const { dispatch, review } = this.props;
    invariant(
      review,
      'Cannot show review form because no review has been loaded.',
    );

    dispatch(showReplyToReviewForm({ reviewId: review.id }));
  };

  onDismissReviewReply: () => void = () => {
    const { dispatch, review } = this.props;
    invariant(
      review,
      'Cannot hide review form because no review has been loaded.',
    );

    dispatch(hideReplyToReviewForm({ reviewId: review.id }));
  };

  onSubmitReviewReply: (reviewData: OnSubmitParams) => void = (
    reviewData: OnSubmitParams,
  ) => {
    const { dispatch, errorHandler, review } = this.props;
    invariant(
      review,
      'The review property cannot be empty when replying to a review.',
    );

    dispatch(
      sendReplyToReview({
        errorHandlerId: errorHandler.id,
        originalReviewId: review.id,
        body: reviewData.text,
      }),
    );
  };

  isRatingOnly(): boolean {
    const { review } = this.props;
    // Return true if this review does not have any text.
    return Boolean(review && !review.body);
  }

  isReply(): boolean {
    const { isReplyToReviewId, review } = this.props;
    return (
      isReplyToReviewId !== undefined ||
      Boolean(review && review.isDeveloperReply)
    );
  }

  editPrompt(): string {
    const { i18n } = this.props;

    if (this.isReply()) {
      return i18n.gettext('Edit reply');
    }

    return i18n.gettext('Edit review');
  }

  deletePrompt(): string {
    const { i18n } = this.props;

    if (this.isReply()) {
      return i18n.gettext('Delete reply');
    }

    if (this.isRatingOnly()) {
      return i18n.gettext('Delete rating');
    }

    return i18n.gettext('Delete review');
  }

  confirmDeletePrompt(): string {
    const { i18n } = this.props;

    if (this.isReply()) {
      return i18n.gettext('Do you really want to delete this reply?');
    }

    if (this.isRatingOnly()) {
      return i18n.gettext('Do you really want to delete this rating?');
    }

    return i18n.gettext('Do you really want to delete this review?');
  }

  confirmDeleteButtonText(): string {
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

  cancelDeleteButtonText(): string {
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

  renderReply(): null | React.Node {
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

  render(): React.Node {
    const {
      beginningToDeleteReview,
      className,
      deletingReview,
      editingReview,
      errorHandler,
      flaggable,
      hasUsersEditPermission,
      i18n,
      location,
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
    const addonIconURL = review?.reviewAddon?.iconUrl || null;
    const addonName = review?.reviewAddon?.name || null;
    const noAuthor = shortByLine || this.isReply();
    const showUserProfileLink = !noAuthor && hasUsersEditPermission;

    if (review) {
      // eslint-disable-next-line no-nested-ternary
      const byLineString = noAuthor
        ? // translators: Example in English: "posted last week"
          i18n.gettext('posted %(linkStart)s%(timestamp)s%(linkEnd)s')
        : // translators: Example in English: "by UserName123, last week"
        showUserProfileLink
        ? i18n.gettext(
            'by %(linkUserProfileStart)s%(authorName)s%(linkUserProfileEnd)s, %(linkStart)s%(timestamp)s%(linkEnd)s',
          )
        : i18n.gettext(
            'by %(authorName)s, %(linkStart)s%(timestamp)s%(linkEnd)s',
          );

      // See https://github.com/mozilla/addons-frontend/issues/7322 for why we
      // need this code.
      const slugForReviewLink =
        review.reviewAddon.slug || review.reviewAddon.id;
      if (!review.reviewAddon.slug) {
        log.error(
          `The add-on for reviewId: ${review.id} has an falsey slug: ${review.reviewAddon.slug}`,
        );
      }
      if (!review.reviewAddon.id) {
        log.error(
          `The add-on for reviewId: ${review.id} has an falsey id: ${review.reviewAddon.id}`,
        );
      }

      const replacements = [
        [
          'linkStart',
          'linkEnd',
          (text) => {
            return slugForReviewLink ? (
              <Link
                title={i18n.moment(review.created).format('lll')}
                key={review.id}
                to={reviewListURL({
                  addonSlug: String(slugForReviewLink),
                  id: review.id,
                  location,
                })}
              >
                {text}
              </Link>
            ) : (
              text
            );
          },
        ],
      ];

      if (showUserProfileLink) {
        replacements.push([
          'linkUserProfileStart',
          'linkUserProfileEnd',
          (text) => (
            <Link
              key={`${review.id}-${review.userId}`}
              to={`/user/${review.userId}/`}
            >
              {text}
            </Link>
          ),
        ]);
      }

      const byLineLink = replaceStringsWithJSX({
        text: i18n.sprintf(byLineString, {
          authorName: review.userName,
          timestamp: i18n.moment(review.created).fromNow(),
          // Keep the link placeholders so that we can use them to inject a
          // `<Link />` using `replaceStringsWithJSX`.
          linkEnd: '%(linkEnd)s',
          linkStart: '%(linkStart)s',
          linkUserProfileStart: showUserProfileLink
            ? '%(linkUserProfileStart)s'
            : undefined,
          linkUserProfileEnd: showUserProfileLink
            ? '%(linkUserProfileEnd)s'
            : undefined,
        }),
        replacements,
      });

      byLine = (
        <span
          className={makeClassName({
            'AddonReviewCard-authorByLine': !noAuthor,
          })}
        >
          {byLineLink}
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
        {showEditControls ? (
          <>
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
          </>
        ) : null}

        {review &&
        !replyingToReview &&
        !review.reply &&
        !this.isReply() &&
        !this.isRatingOnly() &&
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

        {flaggable &&
        !this.isRatingOnly() &&
        review &&
        (!siteUser || siteUser.id !== review.userId) ? (
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
          {/* Div to display Addon's name and icon */}
          {this.props.isUserProfile &&
            addonName &&
            addonIconURL &&
            !this.isReply() && (
              <div className="AddonReviewCard-addonInfo">
                <img src={addonIconURL} alt={`Icon for ${addonName}`} />
                <span>
                  <span className="AddonReviewCard-addonReviewLabel">
                    Review of{' '}
                  </span>
                  <span className="AddonReviewCard-addonName">{addonName}</span>
                </span>
              </div>
            )}

          {review && review.isDeleted && (
            <Notice type="error" className="AddonReviewCard-non-public-notice">
              {i18n.gettext(
                'This rating or review has been deleted. You are only seeing it because of elevated permissions.',
              )}
            </Notice>
          )}
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
              showRating={Boolean(!this.isReply() && showRating)}
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

function mapStateToProps(state: AppState, ownProps: Props): PropsFromState {
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
    hasUsersEditPermission: hasPermission(state, USERS_EDIT),
    replyingToReview,
    siteUser: getCurrentUser(state.users),
    siteUserCanManageReplies: ownProps.siteUserCanReply || siteUserHasReplyPerm,
    submittingReply,
  };
}

export const extractId = (ownProps: InternalProps): string => {
  return ownProps.review ? String(ownProps.review.id) : '';
};

const AddonReviewCard: React.ComponentType<Props> = compose(
  withRouter,
  connect(mapStateToProps),
  withErrorHandler({ name: 'AddonReviewCard', extractId }),
  translate(),
)(AddonReviewCardBase);

export default AddonReviewCard;
