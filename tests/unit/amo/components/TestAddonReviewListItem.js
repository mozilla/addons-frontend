import React from 'react';

import { denormalizeReview } from 'amo/actions/reviews';
import AddonReview from 'amo/components/AddonReview';
import AddonReviewListItem, {
  AddonReviewListItemBase,
} from 'amo/components/AddonReviewListItem';
import {
  dispatchClientMetadata, dispatchSignInActions, fakeReview,
} from 'tests/unit/amo/helpers';
import {
  createFakeEvent,
  getFakeI18nInst,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import LoadingText from 'ui/components/LoadingText';
import Rating from 'ui/components/Rating';


describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = (customProps = {}) => {
    const props = {
      i18n: getFakeI18nInst(),
      store,
      ...customProps,
    };
    return shallowUntilTarget(
      <AddonReviewListItem {...props} />, AddonReviewListItemBase
    );
  };

  const signInAndDispatchSavedReview = ({
    siteUserId = 123, reviewUserId = siteUserId,
  } = {}) => {
    dispatchSignInActions({ store, userId: siteUserId });
    return denormalizeReview({
      ...fakeReview,
      user: {
        ...fakeReview.user,
        id: reviewUserId,
      },
    });
  };

  it('renders a review', () => {
    const root = render({
      review: denormalizeReview({
        ...fakeReview, id: 1, rating: 2,
      }),
    });

    expect(root.find('h3'))
      .toHaveText(fakeReview.title);

    expect(root.find('p'))
      .toHaveHTML(`<p>${fakeReview.body}</p>`);

    expect(root.find('.AddonReviewListItem-by-line'))
      .toIncludeText(fakeReview.user.name);

    const rating = root.find(Rating);
    expect(rating).toHaveProp('rating', 2);
    expect(rating).toHaveProp('readOnly', true);
  });

  it('renders new lines in review bodies', () => {
    const fakeReviewWithNewLine = {
      ...fakeReview,
      body: "It's awesome \n isn't it?",
    };
    const root = render({
      review: denormalizeReview(fakeReviewWithNewLine),
    });

    expect(root.find('p').render().find('br'))
      .toHaveLength(1);
  });

  it('renders loading text for falsy reviews', () => {
    const root = render({ review: null });

    expect(root.find('h3').at(0).find(LoadingText))
      .toHaveLength(1);
    expect(root.find('p').at(0).find(LoadingText))
      .toHaveLength(1);
    expect(root.find('.AddonReviewListItem-by-line').at(0)
      .find(LoadingText)).toHaveLength(1);
  });

  it('does not render controls when signed in without a review', () => {
    dispatchSignInActions({ store });
    const root = render({ review: null });

    expect(root.find('.AddonReviewListItem-controls')).toHaveLength(0);
  });

  it('does not render controls for the wrong user', () => {
    const review = signInAndDispatchSavedReview({
      siteUserId: 123, reviewUserId: 987,
    });
    const root = render({ review });

    expect(root.find('.AddonReviewListItem-controls')).toHaveLength(0);
  });

  it('lets you edit your review', () => {
    const review = signInAndDispatchSavedReview();
    const root = render({ review });

    const editButton = root.find('.AddonReviewListItem-edit');
    editButton.simulate('click', createFakeEvent());

    const reviewComponent = root.find(AddonReview);
    expect(reviewComponent).toHaveLength(1);
    expect(reviewComponent).toHaveProp('review', review);
  });

  it('hides AddonReview when the overlay is escaped', () => {
    const review = signInAndDispatchSavedReview();
    const root = render({ review });
    root.setState({ editingReview: true });

    const reviewComponent = root.find(AddonReview);
    expect(reviewComponent).toHaveLength(1);

    const onEscapeOverlay = reviewComponent.prop('onEscapeOverlay');
    // Simulate escaping the review.
    onEscapeOverlay();

    expect(root.find(AddonReview)).toHaveLength(0);
  });

  it('hides AddonReview after a review has been submitted', () => {
    const review = signInAndDispatchSavedReview();
    const root = render({ review });
    root.setState({ editingReview: true });

    const reviewComponent = root.find(AddonReview);
    expect(reviewComponent).toHaveLength(1);

    const onReviewSubmitted = reviewComponent.prop('onReviewSubmitted');
    // Simulate submitting the review.
    onReviewSubmitted();

    expect(root.find(AddonReview)).toHaveLength(0);
  });
});
