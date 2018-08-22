/* @flow */
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
import type { DispatchFunc } from 'core/types/redux';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { FlashMessageType, UserReviewType } from 'amo/actions/reviews';
import type { I18nType } from 'core/types/i18n';
import type { OnSubmitParams } from 'ui/components/DismissibleTextForm';

import './styles.scss';

type Props = {|
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
  onSubmitRating = (rating: number) => {
    const { errorHandler, dispatch, review } = this.props;

    dispatch(
      updateAddonReview({
        rating,
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
    const { errorHandler, i18n, review, flashMessage } = this.props;

    const reviewGuide = i18n.sprintf(
      i18n.gettext(
        'Please follow our %(linkStart)sreview guidelines%(linkEnd)s.',
      ),
      {
        linkStart: '<a href="/review_guide">',
        linkEnd: '</a>',
      },
    );

    /* eslint-disable react/no-danger */
    const formFooter = (
      <span dangerouslySetInnerHTML={sanitizeHTML(reviewGuide, ['a'])} />
    );
    /* eslint-enable react/no-danger */

    const placeholder = i18n.gettext(
      'Write about your experience with this add-on.',
    );

    return (
      <div className="AddonReviewManager">
        {errorHandler.renderErrorIfPresent()}
        <div className="AddonReviewManager-starRating">
          <span>{i18n.gettext('Your star rating:')}</span>
          <Rating
            className="AddonReviewManager-Rating"
            onSelectRating={this.onSubmitRating}
            rating={review.rating}
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
        <DismissibleTextForm
          formFooter={formFooter}
          isSubmitting={flashMessage === STARTED_SAVE_REVIEW}
          onSubmit={this.onSubmitReview}
          placeholder={placeholder}
          puffyButtons
          submitButtonText={i18n.gettext('Submit review')}
          submitButtonInProgressText={i18n.gettext('Submitting review')}
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
  connect(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
  translate(),
)(AddonReviewManagerBase);

export default AddonReviewManager;
