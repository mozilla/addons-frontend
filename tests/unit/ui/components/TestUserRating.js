import * as React from 'react';

import { createInternalReview } from 'amo/actions/reviews';
import { logOutUser } from 'amo/reducers/users';
import Rating from 'ui/components/Rating';
import UserRating, { UserRatingBase } from 'ui/components/UserRating';
import {
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeI18n,
  fakeReview,
  shallowUntilTarget,
} from 'tests/unit/helpers';

let store;

beforeEach(() => {
  store = dispatchClientMetadata().store;
});

function render(customProps = {}) {
  const props = {
    i18n: fakeI18n(),
    store,
    ...customProps,
  };
  return shallowUntilTarget(<UserRating {...props} />, UserRatingBase);
}

function signInAndReturnReview({ siteUserId, reviewUserId }) {
  dispatchSignInActions({ store, userId: siteUserId });
  return createInternalReview({
    ...fakeReview,
    user: {
      ...fakeReview.user,
      id: reviewUserId,
    },
  });
}

describe(__filename, () => {
  it('renders a Rating', () => {
    const props = {
      review: fakeReview,
      className: 'my-class',
      readOnly: true,
      styleSize: 'small',
    };
    const root = render(props).find(Rating);
    expect(root).toHaveProp('className', props.className);
    expect(root).toHaveProp('readOnly', props.readOnly);
    expect(root).toHaveProp('styleSize', props.styleSize);
  });

  it('passes the rating from the review to Rating', () => {
    const root = render({ review: createInternalReview(fakeReview) });
    expect(root).toHaveProp('rating', fakeReview.score);
  });

  it('passes a null review to Rating', () => {
    expect(render({ review: null })).toHaveProp('rating', null);
  });

  it('passes an undefined review to Rating', () => {
    expect(render({ review: undefined })).toHaveProp('rating', undefined);
  });

  it('passes yellowStars: true to Rating if you wrote the review', () => {
    const review = signInAndReturnReview({
      siteUserId: 123,
      reviewUserId: 123,
    });
    const root = render({ review });
    expect(root).toHaveProp('yellowStars', true);
  });

  it('passes yellowStars: false to Rating if you did not write the review', () => {
    const review = signInAndReturnReview({
      siteUserId: 123,
      reviewUserId: 456,
    });
    const root = render({ review });
    expect(root).toHaveProp('yellowStars', false);
  });

  it('passes yellowStars: false to Rating if no user is logged in', () => {
    const review = signInAndReturnReview({
      siteUserId: 123,
      reviewUserId: 123,
    });
    store.dispatch(logOutUser());
    const root = render({ review });
    expect(root).toHaveProp('yellowStars', false);
  });
});
