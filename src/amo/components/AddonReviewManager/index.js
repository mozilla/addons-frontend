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

type DefaultProps = {|
  puffyButtons?: boolean,
|};

type Props = {|
  ...DefaultProps,
  onCancel?: () => void,
  review: UserReviewType,
|};

type PropsFromState = {|
  flashMessage?: FlashMessageType | void,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
|};

export const extractId = (props: Props | InternalProps): string => {
  return props.review.id.toString();
};

// Note: This is only ever used for editing a review, but not a reply.
export class AddonReviewManagerBase extends React.Component<InternalProps> {
  static defaultProps: DefaultProps = {
    puffyButtons: false,
  };

  onSubmitRating: (score: number) => void = (score: number) => {
    const { errorHandler, dispatch, review } = this.props;

    dispatch(
      updateAddonReview({
        score,
        errorHandlerId: errorHandler.id,
        reviewId: review.id,
      }),
    );
  };

  onSubmitReview: (OnSubmitParams) => void = ({ text }: OnSubmitParams) => {
    const { errorHandler, dispatch, review } = this.props;

    dispatch(
      updateAddonReview({
        body: text,
        errorHandlerId: errorHandler.id,
        reviewId: review.id,
      }),
    );
  };

  render(): React.Node {
    const { errorHandler, i18n, onCancel, review, flashMessage, puffyButtons } =
      this.props;

    const formFoterLink = replaceStringsWithJSX({
      text: i18n.t(
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

    const formFooter = <div>{formFoterLink}</div>;

    const placeholder = i18n.t('Write about your experience with this add-on.');

    let submitButtonText = i18n.t('Submit review');
    let submitButtonInProgressText = i18n.t('Submitting review');
    if (review.body) {
      submitButtonText = i18n.t('Update review');
      submitButtonInProgressText = i18n.t('Updating review');
    }

    return (
      <div className="AddonReviewManager">
        {errorHandler.renderErrorIfPresent()}
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
                ? i18n.t('Saving')
                : i18n.t('Saved')
            }
          />
        </AddonReviewManagerRating>
        <DismissibleTextForm
          dismissButtonText={i18n.t('Cancel')}
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

const mapStateToProps = (state: AppState): PropsFromState => {
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
