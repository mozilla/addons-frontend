import { shallow } from 'enzyme';
import * as React from 'react';

import { createInternalReview, setReview } from 'amo/actions/reviews';
import LoadingText from 'ui/components/LoadingText';
import UserRating from 'ui/components/UserRating';
import UserReview from 'ui/components/UserReview';
import { dispatchClientMetadata, fakeReview } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = (otherProps = {}) => {
    const props = {
      byLine: null,
      review: fakeReview,
      ...otherProps,
    };

    return shallow(<UserReview {...props} />);
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

  it('accepts a class name', () => {
    const className = 'custom-css-class';
    const root = render({ className });

    expect(root).toHaveClassName('UserReview');
    expect(root).toHaveClassName(className);
  });
});
