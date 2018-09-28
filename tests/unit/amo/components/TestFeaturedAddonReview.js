import NestedStatus from 'react-nested-status';
import * as React from 'react';

import { fetchReview, setReview } from 'amo/actions/reviews';
import FeaturedAddonReview, {
  FeaturedAddonReviewBase,
} from 'amo/components/FeaturedAddonReview';
import AddonReviewCard from 'amo/components/AddonReviewCard';
import { createApiError } from 'core/api';
import { ErrorHandler } from 'core/errorHandler';
import { dispatchClientMetadata, fakeReview } from 'tests/unit/amo/helpers';
import {
  createStubErrorHandler,
  fakeI18n,
  createFakeLocation,
  shallowUntilTarget,
  createContextWithFakeRouter,
  createFakeHistory,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const getProps = ({
    location = createFakeLocation(),
    params,
    ...customProps
  } = {}) => {
    return {
      errorHandler: createStubErrorHandler(),
      i18n: fakeI18n(),
      location,
      store,
      ...customProps,
    };
  };

  const render = ({ ...customProps } = {}) => {
    const props = getProps(customProps);

    return shallowUntilTarget(
      <FeaturedAddonReview {...props} />,
      FeaturedAddonReviewBase,
      {
        shallowOptions: createContextWithFakeRouter({
          history: createFakeHistory(),
        }),
      },
    );
  };

  it('fetches a review at construction', () => {
    const reviewId = 1;
    const dispatch = sinon.stub(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    render({
      errorHandler,
      reviewId,
    });

    sinon.assert.calledWith(
      dispatch,
      fetchReview({
        reviewId,
        errorHandlerId: errorHandler.id,
      }),
    );
  });

  it('fetches a review when the reviewId changes', () => {
    const firstReviewId = 1;
    const secondReviewId = 2;
    const errorHandler = createStubErrorHandler();

    store.dispatch(
      fetchReview({ errorHandlerId: errorHandler.id, reviewId: firstReviewId }),
    );
    store.dispatch(setReview({ ...fakeReview, id: firstReviewId }));
    const dispatch = sinon.stub(store, 'dispatch');

    const root = render({
      errorHandler,
      reviewId: firstReviewId,
    });

    dispatch.resetHistory();

    // This will trigger the componentWillReceiveProps() method.
    root.setProps({
      reviewId: secondReviewId,
    });

    sinon.assert.calledWith(
      dispatch,
      fetchReview({
        reviewId: secondReviewId,
        errorHandlerId: errorHandler.id,
      }),
    );
  });

  it('does not fetch a review if one is already loading', () => {
    const reviewId = 1;
    const errorHandler = createStubErrorHandler();
    store.dispatch(fetchReview({ errorHandlerId: errorHandler.id, reviewId }));

    const fakeDispatch = sinon.stub(store, 'dispatch');

    render({
      errorHandler,
      reviewId,
    });

    sinon.assert.neverCalledWith(
      fakeDispatch,
      fetchReview({
        reviewId,
        errorHandlerId: errorHandler.id,
      }),
    );
  });

  it('does not fetch a review if one is already loaded', () => {
    const reviewId = 1;
    const errorHandler = createStubErrorHandler();
    store.dispatch(setReview({ ...fakeReview, id: reviewId }));

    const fakeDispatch = sinon.stub(store, 'dispatch');

    render({
      errorHandler,
      reviewId,
    });

    sinon.assert.neverCalledWith(
      fakeDispatch,
      fetchReview({
        reviewId,
        errorHandlerId: errorHandler.id,
      }),
    );
  });

  it('displays a message if the review is not found', () => {
    const errorHandler = new ErrorHandler({
      id: 'some-error-handler-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(
      createApiError({
        response: { status: 404 },
        apiURL: 'https://some/api/endpoint',
        jsonResponse: { message: 'not found' },
      }),
    );

    const root = render({ errorHandler });
    expect(root.find('.FeaturedAddonReview-notfound')).toHaveLength(1);
    expect(root.find(NestedStatus)).toHaveProp('code', 404);
  });

  it('displays a featured review', () => {
    const reviewId = 123;
    store.dispatch(setReview({ ...fakeReview, id: reviewId }));

    const root = render({ reviewId });

    const card = root.find(AddonReviewCard);
    expect(card).toHaveLength(1);
    expect(card.prop('review').id).toEqual(reviewId);
  });

  it('displays the correct header for a review', () => {
    const reviewId = 123;
    store.dispatch(setReview({ ...fakeReview, id: reviewId }));

    const root = render({ reviewId });

    expect(root.find('.FeaturedAddonReview-card')).toHaveProp(
      'header',
      `Review by ${fakeReview.user.name}`,
    );
  });

  it('displays the correct header for a reply', () => {
    const reviewId = 123;
    store.dispatch(
      setReview({ ...fakeReview, id: reviewId, is_developer_reply: true }),
    );

    const root = render({ reviewId });

    expect(root.find('.FeaturedAddonReview-card')).toHaveProp(
      'header',
      `Response by ${fakeReview.user.name}`,
    );
  });
});
