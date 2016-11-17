import {
  setReview as defaultReviewSetter,
} from 'amo/actions/reviews';
import reviews, { initialState } from 'amo/reducers/reviews';
import { fakeReview } from 'tests/client/amo/helpers';

describe('amo.reducers.reviews', () => {
  function setReview(overrides) {
    return defaultReviewSetter(fakeReview, overrides);
  }

  it('defaults to an empty object', () => {
    assert.deepEqual(reviews(undefined, { type: 'SOME_OTHER_ACTION' }),
                     initialState);
  });

  it('adds a user reviews map', () => {
    const id = 96644;
    const addonId = 5321;
    const userId = 91234;
    const versionId = 12345;
    const isLatest = true;
    const action = setReview({
      id,
      addonId,
      userId,
      rating: 5,
      versionId,
      isLatest,
    });
    const state = reviews(undefined, action);
    assert.deepEqual(state[userId][addonId][id],
                     { id, rating: 5, versionId, isLatest });
  });

  it('preserves existing user rating data', () => {
    let state;

    state = reviews(state, setReview({
      id: 1,
      userId: 1,
      addonId: 1,
      rating: 1,
    }));

    state = reviews(state, setReview({
      id: 2,
      userId: 1,
      addonId: 2,
      rating: 5,
    }));

    state = reviews(state, setReview({
      id: 3,
      userId: 2,
      addonId: 2,
      rating: 4,
    }));

    // Make sure all reviews co-exist by userId, addonId, review ID.
    assert.equal(state[1][1][1].rating, 1);
    assert.equal(state[1][2][2].rating, 5);
    assert.equal(state[2][2][3].rating, 4);
  });

  it('preserves existing add-on reviews', () => {
    let state;
    const userId = 1;
    const addonId = 1;
    const reviewBase = {
      userId,
      addonId,
      rating: 1,
    };

    state = reviews(state, setReview({
      ...reviewBase,
      id: 1,
      versionId: 1,
    }));

    state = reviews(state, setReview({
      ...reviewBase,
      id: 2,
      versionId: 2,
    }));

    state = reviews(state, setReview({
      ...reviewBase,
      id: 3,
      versionId: 3,
    }));

    // Make sure all reviews co-exist by userId, addonId, review ID.
    assert.equal(state[userId][addonId][1].id, 1);
    assert.equal(state[userId][addonId][2].id, 2);
    assert.equal(state[userId][addonId][3].id, 3);
  });

  it('preserves unrelated state', () => {
    let state = { ...initialState, somethingUnrelated: 'erp' };
    state = reviews(state, setReview());
    assert.equal(state.somethingUnrelated, 'erp');
  });
});
