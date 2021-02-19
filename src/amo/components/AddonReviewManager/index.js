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
import AddonReviewManagerRating from 'amo/components/AddonReviewManagerRating';
import Link from 'amo/components/Link';
import RatingManagerNotice from 'amo/components/RatingManagerNotice';
import { withFixedErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import { normalizeFileNameId } from 'amo/utils';
import { replaceStringsWithJSX } from 'amo/i18n/utils';
import DismissibleTextForm from 'amo/components/DismissibleTextForm';
import type { AppState } from 'amo/store';
import type { DispatchFunc } from 'amo/types/redux';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { FlashMessageType, UserReviewType } from 'amo/actions/reviews';
import type { I18nType } from 'amo/types/i18n';
import type { OnSubmitParams } from 'amo/components/DismissibleTextForm';

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

export const extractId = (props: Props | InternalProps): string => {
  return props.review.id.toString();
};

export class AddonReviewManagerBase extends React.Component<InternalProps> {
  static defaultProps: {|puffyButtons: boolean|} = {
    puffyButtons: false,
  };

  onSubmitRating: ((score: number) => void) = (score: number) => {
    const { errorHandler, dispatch, review } = this.props;

    dispatch(
      updateAddonReview({
        score,
        errorHandlerId: errorHandler.id,
        reviewId: review.id,
      }),
    );
  };

  onSubmitReview: ((OnSubmitParams) => void) = ({ text }: OnSubmitParams) => {
    const { errorHandler, dispatch, review } = this.props;

    dispatch(
      updateAddonReview({
        body: text,
        errorHandlerId: errorHandler.id,
        reviewId: review.id,
      }),
    );
  };

  render(): React.Element<"div"> {
    const {
      errorHandler,
      i18n,
      onCancel,
      review,
      flashMessage,
      puffyButtons,
    } = this.props;

    const isReply = review.isDeveloperReply;

    const formFoterLink = replaceStringsWithJSX({
      text: i18n.gettext(
        'Please follow our %(linkStart)sreview guidelines%(linkEnd)s.',
      ),
      replacements: [
        [
          'linkStart',
          'linkEnd',
          (text) => (
            <Link
              key="review-guide"
              prependClientApp={false}
              to="/review_guide"
            >
              {text}
            </Link>
          ),
        ],
      ],
    });

    const formFooter = !isReply ? <div>{formFoterLink}</div> : undefined;

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
          <AddonReviewManagerRating
            onSelectRating={this.onSubmitRating}
            rating={
              flashMessage === STARTED_SAVE_RATING ? undefined : review.score
            }
          >
            <RatingManagerNotice
              className="AddonReviewManager-savedRating"
              hideMessage={
                flashMessage !== STARTED_SAVE_RATING &&
                flashMessage !== SAVED_RATING
              }
              message={
                flashMessage === STARTED_SAVE_RATING
                  ? i18n.gettext('Saving')
                  : i18n.gettext('Saved')
              }
            />
          </AddonReviewManagerRating>
        )}
        <DismissibleTextForm
          dismissButtonText={i18n.gettext('Cancel')}
          formFooter={formFooter}
          id={`${normalizeFileNameId(__filename)}-${extractId(this.props)}`}
          isSubmitting={flashMessage === STARTED_SAVE_REVIEW}
          onDismiss={onCancel}
          onSubmit={this.onSubmitReview}
          placeholder={placeholder}
          puffyButtons={puffyButtons}
          reverseButtonOrder
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

const AddonReviewManager: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  withFixedErrorHandler({ fileName: __filename, extractId }),
  translate(),
)(AddonReviewManagerBase);

export default AddonReviewManager;
