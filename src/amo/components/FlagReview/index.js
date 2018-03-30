/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { flagReview } from 'amo/actions/reviews';
import { withErrorHandler } from 'core/errorHandler';
import LoadingText from 'ui/components/LoadingText';
import type { UserReviewType } from 'amo/actions/reviews';
import type { FlagReviewReasonType } from 'amo/constants';
import type { FlagState, ReviewState } from 'amo/reducers/reviews';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { DispatchFunc } from 'core/types/redux';


type Props = {|
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  buttonText: string,
  reason: FlagReviewReasonType,
  review: UserReviewType,
  flagState: FlagState,
  wasFlaggedText: string,
|};

export class FlagReviewBase extends React.Component<Props> {
  onClick = (event: SyntheticEvent<any>) => {
    const { errorHandler, dispatch, review, reason } = this.props;
    event.preventDefault();

    dispatch(flagReview({
      errorHandlerId: errorHandler.id,
      reason,
      reviewId: review.id,
    }));
  }

  renderControls() {
    const {
      errorHandler, flagState, buttonText, wasFlaggedText,
    } = this.props;

    if (flagState) {
      if (flagState.inProgress && !errorHandler.hasError()) {
        return <LoadingText minWidth={60} />;
      } else if (flagState.wasFlagged) {
        return wasFlaggedText;
      }
    }

    return (
      <button
        className="FlagReview-button"
        onClick={this.onClick}
      >
        {buttonText}
      </button>
    );
  }

  render() {
    const { errorHandler } = this.props;

    return (
      <div>
        {errorHandler.renderErrorIfPresent()}
        {this.renderControls()}
      </div>
    );
  }
}

const mapStateToProps = (
  state: {| reviews: ReviewState |}, ownProps: Props,
) => {
  let flagState = {};
  if (ownProps.review) {
    const view = state.reviews.view[ownProps.review.id];
    if (view && view.flag && view.flag.reason === ownProps.reason) {
      flagState = view.flag;
    }
  }
  return {
    flagState,
  };
};

export default compose(
  connect(mapStateToProps),
  withErrorHandler({ name: 'FlagReview' }),
)(FlagReviewBase);
