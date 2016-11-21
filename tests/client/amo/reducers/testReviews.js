import { setReview } from 'amo/actions/reviews';
import reviews, { initialState } from 'amo/reducers/reviews';
import { fakeReview } from 'tests/client/amo/helpers';

describe('amo.reducers.reviews', () => {
  it('defaults to an empty object', () => {
    assert.deepEqual(reviews(undefined, { type: 'SOME_OTHER_ACTION' }),
                     initialState);
  });

  it('stores a user review', () => {
    const action = setReview(fakeReview);
    const state = reviews(undefined, action);
    const storedReview =
      state[fakeReview.user.id][fakeReview.addon.id][fakeReview.id];
    assert.deepEqual(storedReview, {
      id: fakeReview.id,
      addonId: fakeReview.addon.id,
      rating: fakeReview.rating,
      versionId: fakeReview.version.id,
      isLatest: fakeReview.is_latest,
      userId: fakeReview.user.id,
      body: fakeReview.body,
    });
  });

  it('preserves existing user rating data', () => {
    let state;

    state = reviews(state, setReview(fakeReview, {
      id: 1,
      userId: 1,
      addonId: 1,
      rating: 1,
    }));

    state = reviews(state, setReview(fakeReview, {
      id: 2,
      userId: 1,
      addonId: 2,
      rating: 5,
    }));

    state = reviews(state, setReview(fakeReview, {
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
    const userId = fakeReview.user.id;
    const addonId = fakeReview.addon.id;

    state = reviews(state, setReview(fakeReview, {
      id: 1,
      versionId: 1,
    }));

    state = reviews(state, setReview(fakeReview, {
      id: 2,
      versionId: 2,
    }));

    state = reviews(state, setReview(fakeReview, {
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
    state = reviews(state, setReview(fakeReview));
    assert.equal(state.somethingUnrelated, 'erp');
  });

  it('only allows one review to be the latest', () => {
    const addonId = fakeReview.addon.id;
    const userId = fakeReview.user.id;
    let state;

    state = reviews(state, setReview(fakeReview, {
      id: 1,
      isLatest: true,
    }));

    state = reviews(state, setReview(fakeReview, {
      id: 2,
      isLatest: true,
    }));

    state = reviews(state, setReview(fakeReview, {
      id: 3,
      isLatest: true,
    }));

    // Make sure only the newest submitted one is the latest:
    assert.equal(state[userId][addonId][1].isLatest, false);
    assert.equal(state[userId][addonId][2].isLatest, false);
    assert.equal(state[userId][addonId][3].isLatest, true);
  });

  it('preserves an older latest review', () => {
    const addonId = fakeReview.addon.id;
    const userId = fakeReview.user.id;
    let state;

    state = reviews(state, setReview(fakeReview, {
      id: 1,
      isLatest: true,
    }));

    state = reviews(state, setReview(fakeReview, {
      id: 2,
      isLatest: false,
    }));

    assert.equal(state[userId][addonId][1].isLatest, true);
    assert.equal(state[userId][addonId][2].isLatest, false);
  });
});
