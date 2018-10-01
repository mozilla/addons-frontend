import * as React from 'react';

import { createInternalReview, setReview } from 'amo/actions/reviews';
import Icon from 'ui/components/Icon';
import LoadingText from 'ui/components/LoadingText';
import UserRating from 'ui/components/UserRating';
import UserReview, { UserReviewBase } from 'ui/components/UserReview';
import { dispatchClientMetadata, fakeReview } from 'tests/unit/amo/helpers';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = (otherProps = {}) => {
    const props = {
      byLine: null,
      i18n: fakeI18n(),
      review: fakeReview,
      ...otherProps,
    };

    return shallowUntilTarget(<UserReview {...props} />, UserReviewBase);
  };

  const _setReview = (externalReview) => {
    store.dispatch(setReview(externalReview));
    return createInternalReview(externalReview);
  };

  it('renders LoadingText without a review', () => {
    const root = render({ review: undefined });

    expect(root.find('.UserReview-body').find(LoadingText)).toHaveLength(1);
  });

  it('renders a review', () => {
    const review = _setReview({
      ...fakeReview,
      id: 1,
      rating: 2,
    });
    const root = render({ review, showRating: true });

    expect(root.find('.UserReview-body').html()).toContain(fakeReview.body);

    const rating = root.find(UserRating);
    expect(rating).toHaveProp('readOnly', true);
    expect(rating).toHaveProp('styleSize', 'small');
    expect(rating).toHaveProp('review', review);
  });

  it('renders newlines in review bodies', () => {
    const fakeReviewWithNewLine = {
      ...fakeReview,
      body: "It's awesome \n isn't it?",
    };
    const root = render({
      review: _setReview(fakeReviewWithNewLine),
    });

    expect(
      root
        .find('.UserReview-body')
        .render()
        .find('br'),
    ).toHaveLength(1);
  });

  it('does not render an empty review body', () => {
    const root = render({
      review: _setReview({ ...fakeReview, body: undefined }),
    });

    expect(root.find('.UserReview-body')).toHaveText('');
  });

  it('adds UserReview-emptyBody for an empty body', () => {
    const root = render({
      review: _setReview({ ...fakeReview, body: undefined }),
    });

    const body = root.find('.UserReview-body');
    expect(body).toHaveClassName('UserReview-emptyBody');
  });

  it('does not add UserReview-emptyBody when there is a body', () => {
    const root = render({
      review: _setReview({
        ...fakeReview,
        body: 'This add-on is fantastic',
      }),
    });

    const body = root.find('.UserReview-body');
    expect(body).not.toHaveClassName('UserReview-emptyBody');
  });

  it('can hide ratings', () => {
    const root = render({ showRating: false });

    expect(root.find(UserRating)).toHaveLength(0);
  });

  it('adds a developer response header to replies', () => {
    const root = render({ isReply: true });

    const replyHeader = root.find('.UserReview-reply-header');
    expect(replyHeader).toHaveLength(1);
    expect(replyHeader.find(Icon)).toHaveProp('name', 'reply-arrow');
  });

  it('does not show a developer response header by default', () => {
    const root = render();

    expect(root.find('.UserReview-reply-header')).toHaveLength(0);
  });

  it('does not show a developer response header for non-replies', () => {
    const root = render({ isReply: false });

    expect(root.find('.UserReview-reply-header')).toHaveLength(0);
  });

  it('accepts a class name', () => {
    const className = 'custom-css-class';
    const root = render({ className });

    expect(root).toHaveClassName('UserReview');
    expect(root).toHaveClassName(className);
  });
});
