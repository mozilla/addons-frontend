/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { updateAddonReview } from 'amo/actions/reviews';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import DismissibleTextForm from 'ui/components/DismissibleTextForm';
import Rating from 'ui/components/Rating';
import type { DispatchFunc } from 'core/types/redux';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { UserReviewType } from 'amo/actions/reviews';
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
    const { errorHandler, i18n, review } = this.props;

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
          {i18n.gettext('Your star rating:')}
          <Rating
            className="AddonReviewManager-Rating"
            onSelectRating={this.onSubmitRating}
            rating={review.rating}
            styleSize="small"
            yellowStars
          />
        </div>
        <DismissibleTextForm
          formFooter={formFooter}
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

export const extractId = (props: Props): string => {
  return props.review.id.toString();
};

const AddonReviewManager: React.ComponentType<Props> = compose(
  connect(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
  translate(),
)(AddonReviewManagerBase);

export default AddonReviewManager;
