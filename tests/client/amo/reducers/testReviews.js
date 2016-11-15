import {
  setReview as defaultReviewSetter,
} from 'amo/actions/reviews';
import reviews, { initialState } from 'amo/reducers/reviews';

describe('amo.reducers.reviews', () => {
  function setReview(overrides) {
    return defaultReviewSetter({
      addonId: 321,
      versionId: 54321,
      rating: 3,
      userId: 9123,
      ...overrides,
    });
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
    const action = setReview({
      id,
      addonId,
      userId,
      rating: 5,
      versionId,
    });
    const state = reviews(undefined, action);
    assert.deepEqual(state[userId][addonId],
                     { id, rating: 5, versionId });
  });

  it('preserves existing user rating data', () => {
    let state;

    state = reviews(state, setReview({
      userId: 1,
      addonId: 1,
      rating: 1,
    }));

    state = reviews(state, setReview({
      userId: 1,
      addonId: 2,
      rating: 5,
    }));

    state = reviews(state, setReview({
      userId: 2,
      addonId: 2,
      rating: 4,
    }));

    // Make sure all reviews co-exist by user and add-on.
    assert.equal(state[1][1].rating, 1);
    assert.equal(state[1][2].rating, 5);
    assert.equal(state[2][2].rating, 4);
  });

  it('preserves unrelated state', () => {
    let state = { ...initialState, somethingUnrelated: 'erp' };
    state = reviews(state, setReview());
    assert.equal(state.somethingUnrelated, 'erp');
  });
});
