import * as React from 'react';

import {
  createInternalReview,
  flagReview,
  setReviewWasFlagged,
} from 'amo/actions/reviews';
import {
  REVIEW_FLAG_REASON_BUG_SUPPORT,
  REVIEW_FLAG_REASON_SPAM,
} from 'amo/constants';
import FlagReview, { FlagReviewBase } from 'amo/components/FlagReview';
import { ErrorHandler } from 'amo/errorHandler';
import {
  createFakeEvent,
  createStubErrorHandler,
  dispatchSignInActions,
  fakeI18n,
  fakeReview,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import ErrorList from 'ui/components/ErrorList';
import LoadingText from 'ui/components/LoadingText';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchSignInActions().store;
  });

  const render = (customProps = {}) => {
    const props = {
      buttonText: 'flag the thing',
      i18n: fakeI18n(),
      reason: REVIEW_FLAG_REASON_SPAM,
      review: createInternalReview(fakeReview),
      store,
      wasFlaggedText: 'the thing was flagged',
      ...customProps,
    };
    return shallowUntilTarget(<FlagReview {...props} />, FlagReviewBase);
  };

  it('can flag a review', () => {
    const reason = REVIEW_FLAG_REASON_BUG_SUPPORT;
    const review = createInternalReview({ ...fakeReview, id: 3321 });
    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ reason, review });

    const event = createFakeEvent();
    root.find('.FlagReview-button').simulate('click', event);

    sinon.assert.calledWith(
      fakeDispatch,
      flagReview({
        errorHandlerId: root.instance().props.errorHandler.id,
        reason,
        reviewId: review.id,
      }),
    );

    sinon.assert.called(event.preventDefault);
  });

  it('renders loading text while in progress', () => {
    const reason = REVIEW_FLAG_REASON_BUG_SUPPORT;
    const review = createInternalReview(fakeReview);
    store.dispatch(
      flagReview({
        errorHandlerId: createStubErrorHandler().id,
        reason,
        reviewId: review.id,
      }),
    );
    const root = render({ reason, review });

    expect(root.find(LoadingText)).toHaveLength(1);
  });

  it('renders a prompt', () => {
    const buttonText = 'flag this review';
    const root = render({ buttonText });

    expect(root).toHaveText(buttonText);
  });

  it('renders post-flagged text', () => {
    const wasFlaggedText = 'The review was flagged';
    const reason = REVIEW_FLAG_REASON_BUG_SUPPORT;
    const review = createInternalReview(fakeReview);
    store.dispatch(
      setReviewWasFlagged({
        reason,
        reviewId: review.id,
      }),
    );

    const root = render({ wasFlaggedText, reason, review });

    expect(root).toHaveText(wasFlaggedText);
  });

  it('renders an error', () => {
    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: store.dispatch,
    });

    // The user flags a review:
    const reason = REVIEW_FLAG_REASON_BUG_SUPPORT;
    const review = createInternalReview(fakeReview);
    store.dispatch(
      flagReview({
        errorHandlerId: errorHandler.id,
        reason,
        reviewId: review.id,
      }),
    );

    // The user triggers an error:
    errorHandler.handle(new Error('Unexpected API error'));

    const root = render({ errorHandler, reason });
    expect(root.find(ErrorList)).toHaveLength(1);

    // It should still display a button so they can try again.
    expect(root.find('.FlagReview-button')).toHaveLength(1);
  });
});
