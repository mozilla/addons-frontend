import { setAddonReviews, setReview } from 'amo/actions/reviews';
import reviews, { initialState } from 'amo/reducers/reviews';
import { fakeAddon, fakeReview } from 'tests/client/amo/helpers';

describe('amo.reducers.reviews', () => {
  function setFakeReview({
    userId = fakeReview.user.id,
    addonId = fakeReview.addon.id,
    versionId = fakeReview.version.id,
    ...overrides } = {}
  ) {
    return setReview({
      ...fakeReview,
      user: {
        ...fakeReview.user,
        id: userId,
      },
      addon: {
        ...fakeReview.addon,
        id: addonId,
      },
      version: {
        ...fakeReview.version,
        id: versionId,
      },
      ...overrides,
    });
  }

  it('defaults to an empty object', () => {
    assert.deepEqual(reviews(undefined, { type: 'SOME_OTHER_ACTION' }),
                     initialState);
  });

  it('stores a user review', () => {
    const action = setFakeReview();
    const state = reviews(undefined, action);
    const storedReview =
      state[fakeReview.user.id][fakeReview.addon.id][fakeReview.id];
    assert.deepEqual(storedReview, {
      id: fakeReview.id,
      addonId: fakeReview.addon.id,
      addonSlug: fakeReview.addon.slug,
      created: fakeReview.created,
      rating: fakeReview.rating,
      versionId: fakeReview.version.id,
      isLatest: fakeReview.is_latest,
      userId: fakeReview.user.id,
      userName: fakeReview.user.name,
      userUrl: fakeReview.user.url,
      body: fakeReview.body,
      title: fakeReview.title,
    });
  });

  it('preserves existing user rating data', () => {
    let state;

    state = reviews(state, setFakeReview({
      id: 1,
      userId: 1,
      addonId: 1,
      rating: 1,
    }));

    state = reviews(state, setFakeReview({
      id: 2,
      userId: 1,
      addonId: 2,
      rating: 5,
    }));

    state = reviews(state, setFakeReview({
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

    state = reviews(state, setFakeReview({
      id: 1,
      versionId: 1,
    }));

    state = reviews(state, setFakeReview({
      id: 2,
      versionId: 2,
    }));

    state = reviews(state, setFakeReview({
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
    state = reviews(state, setFakeReview());
    assert.equal(state.somethingUnrelated, 'erp');
  });

  it('only allows one review to be the latest', () => {
    const addonId = fakeReview.addon.id;
    const userId = fakeReview.user.id;
    let state;

    state = reviews(state, setFakeReview({
      id: 1,
      is_latest: true,
    }));

    state = reviews(state, setFakeReview({
      id: 2,
      is_latest: true,
    }));

    state = reviews(state, setFakeReview({
      id: 3,
      is_latest: true,
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

    state = reviews(state, setFakeReview({
      id: 1,
      is_latest: true,
    }));

    state = reviews(state, setFakeReview({
      id: 2,
      is_latest: false,
    }));

    assert.equal(state[userId][addonId][1].isLatest, true);
    assert.equal(state[userId][addonId][2].isLatest, false);
  });

  describe('setAddonReviews', () => {
    it('stores multiple user reviews for an add-on', () => {
      const review1 = fakeReview;
      const review2 = { ...fakeReview, id: 3 };
      const action = setAddonReviews({
        addonSlug: fakeAddon.slug, reviews: [review1, review2],
        reviewCount: 2,
      });
      const state = reviews(undefined, action);
      const storedReviews = state.byAddon[fakeAddon.slug].reviews;
      assert.equal(storedReviews.length, 2);
      assert.equal(storedReviews[0].id, review1.id);
      assert.equal(storedReviews[1].id, review2.id);
    });

    it('preserves existing add-on reviews', () => {
      const addon1 = fakeAddon;
      const review1 = fakeReview;
      const addon2 = { ...fakeAddon, slug: 'something-else' };
      const review2 = { ...fakeReview, id: 3 };
      const review3 = { ...fakeReview, id: 4 };

      let state;
      state = reviews(state, setAddonReviews({
        addonSlug: addon1.slug, reviews: [review1], reviewCount: 1,
      }));
      state = reviews(state, setAddonReviews({
        addonSlug: addon2.slug, reviews: [review2, review3],
        reviewCount: 2,
      }));

      assert.equal(state.byAddon[addon1.slug].reviews[0].id, review1.id);
      assert.equal(state.byAddon[addon2.slug].reviews[0].id, review2.id);
      assert.equal(state.byAddon[addon2.slug].reviews[1].id, review3.id);
    });
  });
});
