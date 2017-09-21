import React from 'react';

import { denormalizeReview } from 'amo/actions/reviews';
import AddonReviewListItem, {
  AddonReviewListItemBase,
} from 'amo/components/AddonReviewListItem';
import createStore from 'amo/store';
import {
  dispatchSignInActions, fakeReview,
} from 'tests/unit/amo/helpers';
import {
  getFakeI18nInst,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import LoadingText from 'ui/components/LoadingText';
import Rating from 'ui/components/Rating';


describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = createStore().store;
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
    const reviewUserId = 123;
    const otherUserId = 987;

    dispatchSignInActions({ store, userId: otherUserId });
    const review = denormalizeReview({
      ...fakeReview,
      user: {
        ...fakeReview.user,
        id: reviewUserId,
      },
    });
    const root = render({ review });

    expect(root.find('.AddonReviewListItem-controls')).toHaveLength(0);
  });
});
