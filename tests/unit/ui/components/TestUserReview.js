import { shallow } from 'enzyme';
import * as React from 'react';

import { setReview } from 'amo/actions/reviews';
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

  const getReviewFromState = (reviewId) => {
    const review = store.getState().reviews.byId[reviewId];
    expect(review).toBeDefined();
    return review;
  };

  const _setReview = (externalReview) => {
    store.dispatch(setReview(externalReview));
    return getReviewFromState(externalReview.id);
  };

  it('renders correctly', () => {
    const root = render();
    expect(root.find('.UserReview')).toHaveLength(1);
  });

  it('renders a review', () => {
    const review = _setReview({
      ...fakeReview,
      id: 1,
      rating: 2,
    });
    const root = render({ review });

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
        .find('p')
        .render()
        .find('br'),
    ).toHaveLength(1);
  });

  it('hides ratings for replies', () => {
    const root = render({ showRating: true });
    expect(root.find(UserRating)).toHaveLength(0);
  });
});
