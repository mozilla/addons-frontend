import { setUserRating } from 'amo/actions/ratingActions';
import ratingsReducer, { initialState } from 'amo/reducers/ratings';

import { fakeAddon } from '../components/TestAddonDetail';
import { createRatingResponse } from '../components/TestOverallRating';

describe('ratingsReducer', () => {
  it('defaults to an empty object', () => {
    assert.deepEqual(ratingsReducer(undefined, { type: 'SOME_OTHER_ACTION' }),
                     initialState);
  });

  it('adds a user ratings map', () => {
    const addonID = 321;
    const versionID = 12345;
    const action = setUserRating({
      addonID,
      userRating: createRatingResponse({
        rating: 5,
        version: { ...fakeAddon.current_version, id: versionID },
      }),
    });
    const state = ratingsReducer(undefined, action);
    assert.deepEqual(state.userRatings[addonID],
                     { rating: 5, versionID });
  });

  it('preserves existing user rating data', () => {
    let state = {};

    state = ratingsReducer(state, setUserRating({
      addonID: 1,
      userRating: createRatingResponse({
        rating: 1,
      }),
    }));

    state = ratingsReducer(state, setUserRating({
      addonID: 2,
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

    state = ratingsReducer(state, setUserRating({
      addonID: 1,
      userRating: createRatingResponse({
        rating: 1,
      }),
    }));

    assert.equal(state.somethingUnrelated, 'erp');
  });
});
