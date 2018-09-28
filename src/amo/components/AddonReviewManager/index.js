/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import {
  SAVED_RATING,
  STARTED_SAVE_RATING,
  STARTED_SAVE_REVIEW,
  updateAddonReview,
} from 'amo/actions/reviews';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import DismissibleTextForm from 'ui/components/DismissibleTextForm';
import Rating from 'ui/components/Rating';
import type { AppState } from 'amo/store';
import type { DispatchFunc } from 'core/types/redux';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { FlashMessageType, UserReviewType } from 'amo/actions/reviews';
import type { I18nType } from 'core/types/i18n';
import type { OnSubmitParams } from 'ui/components/DismissibleTextForm';

import './styles.scss';

type Props = {|
  onCancel?: () => void,
  puffyButtons?: boolean,
  review: UserReviewType,
|};

type InternalProps = {|
  ...Props,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  flashMessage?: FlashMessageType | void,
|};

export class AddonReviewManagerBase extends React.Component<InternalProps> {
  static defaultProps = {
    puffyButtons: false,
  };

  onSubmitRating = (score: number) => {
    const { errorHandler, dispatch, review } = this.props;

    dispatch(
      updateAddonReview({
        score,
        errorHandlerId: errorHandler.id,
        reviewId: review.id,
      }),
    );
  };

  onSubmitReview = ({ text }: OnSubmitParams) => {
    const { errorHandler, dispatch, review } = this.props;

    dispatch(
      updateAddonReview({
        body: text,
        errorHandlerId: errorHandler.id,
        reviewId: review.id,
      }),
    );
  };

  render() {
    const {
      errorHandler,
      i18n,
      onCancel,
      review,
      flashMessage,
      puffyButtons,
    } = this.props;

    const isReply = review.isDeveloperReply;
    const reviewGuideLink = i18n.sprintf(
      i18n.gettext(
        'Please follow our %(linkStart)sreview guidelines%(linkEnd)s.',
      ),
      {
        linkStart: '<a href="/review_guide">',
        linkEnd: '</a>',
      },
    );

    /* eslint-disable react/no-danger */
    const formFooter = !isReply ? (
      <span dangerouslySetInnerHTML={sanitizeHTML(reviewGuideLink, ['a'])} />
    ) : (
      undefined
    );
    /* eslint-enable react/no-danger */

    const placeholder = i18n.gettext(
      'Write about your experience with this add-on.',
    );

    let submitButtonText = i18n.gettext('Submit review');
    let submitButtonInProgressText = i18n.gettext('Submitting review');
    if (review.body) {
      submitButtonText = isReply
        ? i18n.gettext('Update reply')
        : i18n.gettext('Update review');
      submitButtonInProgressText = isReply
        ? i18n.gettext('Updating reply')
        : i18n.gettext('Updating review');
    }

    return (
      <div className="AddonReviewManager">
        {errorHandler.renderErrorIfPresent()}
        {!isReply && (
          <div className="AddonReviewManager-starRating">
            <span>{i18n.gettext('Your star rating:')}</span>
            <Rating
              className="AddonReviewManager-Rating"
              onSelectRating={this.onSubmitRating}
              rating={
                flashMessage === STARTED_SAVE_RATING ? undefined : review.score
              }
              styleSize="small"
              yellowStars
            />
            <span
              className={makeClassName('AddonReviewManager-savedRating', {
                'AddonReviewManager-savedRating-hidden':
                  flashMessage !== STARTED_SAVE_RATING &&
                  flashMessage !== SAVED_RATING,
              })}
            >
              {flashMessage === STARTED_SAVE_RATING
                ? i18n.gettext('Saving')
                : i18n.gettext('Saved')}
            </span>
          </div>
        )}
        <DismissibleTextForm
          dismissButtonText={i18n.gettext('Cancel')}
          formFooter={formFooter}
          isSubmitting={flashMessage === STARTED_SAVE_REVIEW}
          onDismiss={onCancel}
          onSubmit={this.onSubmitReview}
          placeholder={placeholder}
          puffyButtons={puffyButtons}
          submitButtonText={submitButtonText}
          submitButtonInProgressText={submitButtonInProgressText}
          text={review.body}
        />
      </div>
    );
  }
}

const mapStateToProps = (state: AppState) => {
  return {
    flashMessage: state.reviews.flashMessage,
  };
};

export const extractId = (props: Props): string => {
  return props.review.id.toString();
};

const AddonReviewManager: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  withFixedErrorHandler({ fileName: __filename, extractId }),
  translate(),
)(AddonReviewManagerBase);

export default AddonReviewManager;
