import {
  setUserRating as defaultUserRatingSetter,
} from 'amo/actions/ratings';
import ratings, { initialState } from 'amo/reducers/ratings';
import { createRatingResponse, fakeAddon } from 'tests/client/amo/helpers';

describe('amo.reducers.ratings', () => {
  function setUserRating(overrides) {
    return defaultUserRatingSetter({
      addonId: 321,
      userRating: createRatingResponse(),
      userId: 9123,
      ...overrides,
    });
  }

  it('defaults to an empty object', () => {
    assert.deepEqual(ratings(undefined, { type: 'SOME_OTHER_ACTION' }),
                     initialState);
  });

  it('adds a user ratings map', () => {
    const addonId = 5321;
    const userId = 91234;
    const versionId = 12345;
    const action = setUserRating({
      addonId,
      userId,
      userRating: createRatingResponse({
        rating: 5,
        version: { ...fakeAddon.current_version, id: versionId },
      }),
    });
    const state = ratings(undefined, action);
    assert.deepEqual(state.userRatings[userId][addonId],
                     { rating: 5, versionId });
  });

  it('preserves existing user rating data', () => {
    let state;

    state = ratings(state, setUserRating({
      userId: 1,
      addonId: 1,
      userRating: createRatingResponse({
        rating: 1,
      }),
    }));

    state = ratings(state, setUserRating({
      userId: 1,
      addonId: 2,
      userRating: createRatingResponse({
        rating: 5,
      }),
    }));

    state = ratings(state, setUserRating({
      userId: 2,
      addonId: 2,
      userRating: createRatingResponse({
        rating: 4,
      }),
    }));

    // Make sure all ratings co-exist by user and add-on.
    assert.equal(state.userRatings[1][1].rating, 1);
    assert.equal(state.userRatings[1][2].rating, 5);
    assert.equal(state.userRatings[2][2].rating, 4);
  });

  it('preserves unrelated state', () => {
    let state = { ...initialState, somethingUnrelated: 'erp' };
    state = ratings(state, setUserRating());
    assert.equal(state.somethingUnrelated, 'erp');
  });
});
