/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { flagReview } from 'amo/actions/reviews';
import { withErrorHandler } from 'core/errorHandler';
import LoadingText from 'ui/components/LoadingText';
import type { AppState } from 'amo/store';
import type { UserReviewType } from 'amo/actions/reviews';
import type { FlagReviewReasonType } from 'amo/constants';
import type { FlagState } from 'amo/reducers/reviews';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { DispatchFunc } from 'core/types/redux';

type Props = {|
  buttonText: string,
  reason: FlagReviewReasonType,
  review: UserReviewType,
  wasFlaggedText: string,
|};

type InternalProps = {|
  ...Props,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  flagState: FlagState,
|};

export class FlagReviewBase extends React.Component<InternalProps> {
  onClick = (event: SyntheticEvent<any>) => {
    const { dispatch, errorHandler, reason, review } = this.props;
    event.preventDefault();

    dispatch(
      flagReview({
        errorHandlerId: errorHandler.id,
        reason,
        reviewId: review.id,
      }),
    );
  };

  renderControls() {
    const { buttonText, errorHandler, flagState, wasFlaggedText } = this.props;

    if (flagState) {
      if (flagState.inProgress && !errorHandler.hasError()) {
        return <LoadingText minWidth={60} />;
      } else if (flagState.wasFlagged) {
        return wasFlaggedText;
      }
    }

    return (
      <button className="FlagReview-button" onClick={this.onClick}>
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

const mapStateToProps = (state: AppState, ownProps: Props) => {
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

const FlagReview: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  withErrorHandler({ name: 'FlagReview' }),
)(FlagReviewBase);

export default FlagReview;
