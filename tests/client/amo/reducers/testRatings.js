import { setUserRating } from 'amo/actions/ratings';
import ratings, { initialState } from 'amo/reducers/ratings';
import { createRatingResponse, fakeAddon } from 'tests/client/amo/helpers';

describe('amo.reducers.ratings', () => {
  it('defaults to an empty object', () => {
    assert.deepEqual(ratings(undefined, { type: 'SOME_OTHER_ACTION' }),
                     initialState);
  });

  it('adds a user ratings map', () => {
    const addonId = 321;
    const versionId = 12345;
    const action = setUserRating({
      addonId,
      userRating: createRatingResponse({
        rating: 5,
        version: { ...fakeAddon.current_version, id: versionId },
      }),
    });
    const state = ratings(undefined, action);
    assert.deepEqual(state.userRatings[addonId],
                     { rating: 5, versionId });
  });

  it('preserves existing user rating data', () => {
    let state = {};

    state = ratings(state, setUserRating({
      addonId: 1,
      userRating: createRatingResponse({
        rating: 1,
      }),
    }));

    state = ratings(state, setUserRating({
      addonId: 2,
      userRating: createRatingResponse({
        rating: 5,
      }),
    }));

    // Make sure both ratings co-exist.
    assert.equal(state.userRatings[1].rating, 1);
    assert.equal(state.userRatings[2].rating, 5);
  });

  it('preserves unrelated state', () => {
    let state = { somethingUnrelated: 'erp' };

    state = ratings(state, setUserRating({
      addonId: 1,
      userRating: createRatingResponse({
        rating: 1,
      }),
    }));

    assert.equal(state.somethingUnrelated, 'erp');
  });
});
