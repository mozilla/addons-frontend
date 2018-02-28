import * as React from 'react';

import { denormalizeReview } from 'amo/actions/reviews';
import UserRating, { UserRatingBase } from 'ui/components/UserRating';
import { logOutUser } from 'amo/reducers/users';
import {
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeReview,
} from 'tests/unit/amo/helpers';
import {
  fakeI18n,
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
  return denormalizeReview({
    ...fakeReview,
    user: {
      ...fakeReview.user,
      id: reviewUserId,
    },
  });
}

describe('ui/components/UserRating', () => {
  it('renders a Rating', () => {
    const props = {
      review: fakeReview,
      className: 'my-class',
      readOnly: true,
      styleSize: 'small',
    };
    const root = render(props);
    expect(root).toHaveProp('className', props.className);
    expect(root).toHaveProp('readOnly', props.readOnly);
    expect(root).toHaveProp('styleSize', props.styleSize);
  });

  it('passes the rating from the review to Rating', () => {
    const root = render({ review: fakeReview });
    expect(root).toHaveProp('rating', fakeReview.rating);
  });

  it('passes isOwned: true to Rating if you wrote the review', () => {
    const review = signInAndReturnReview({
      siteUserId: 123, reviewUserId: 123,
    });
    const root = render({ review });
    expect(root).toHaveProp('isOwner', true);
  });

  it('passes isOwned: false to Rating if you did not write the review', () => {
    const review = signInAndReturnReview({
      siteUserId: 123, reviewUserId: 456,
    });
    const root = render({ review });
    expect(root).toHaveProp('isOwner', false);
  });

  it('passes isOwned: false to Rating if no user is logged in', () => {
    store.dispatch(logOutUser());
    const root = render({ review: fakeReview });
    expect(root).toHaveProp('isOwner', false);
  });
});
