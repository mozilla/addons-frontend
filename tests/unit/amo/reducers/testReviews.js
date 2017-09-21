import {
  denormalizeReview, setAddonReviews, setReview,
} from 'amo/actions/reviews';
import reviewsReducer, {
  expandReviewObjects, initialState, storeReviewObjects,
} from 'amo/reducers/reviews';
import { fakeAddon, fakeReview } from 'tests/unit/amo/helpers';

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
    expect(reviewsReducer(undefined, { type: 'SOME_OTHER_ACTION' })).toEqual(initialState);
  });

  it('stores a user review', () => {
    const action = setFakeReview();
    const state = reviewsReducer(undefined, action);
    const storedReview =
      state[fakeReview.user.id][fakeReview.addon.id][fakeReview.id];
    expect(storedReview).toEqual({
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

  it('stores a review object', () => {
    const review = { ...fakeReview, id: 1 };
    const action = setReview(review);
    const state = reviewsReducer(undefined, action);
    expect(state.byId[review.id]).toEqual(denormalizeReview(review));
  });

  it('preserves existing user rating data', () => {
    let state;

    state = reviewsReducer(state, setFakeReview({
      id: 1,
      userId: 1,
      addonId: 1,
      rating: 1,
    }));

    state = reviewsReducer(state, setFakeReview({
      id: 2,
      userId: 1,
      addonId: 2,
      rating: 5,
    }));

    state = reviewsReducer(state, setFakeReview({
      id: 3,
      userId: 2,
      addonId: 2,
      rating: 4,
    }));

    // Make sure all reviews co-exist by userId, addonId, review ID.
    expect(state[1][1][1].rating).toEqual(1);
    expect(state[1][2][2].rating).toEqual(5);
    expect(state[2][2][3].rating).toEqual(4);
  });

  it('preserves existing add-on reviews', () => {
    let state;
    const userId = fakeReview.user.id;
    const addonId = fakeReview.addon.id;

    state = reviewsReducer(state, setFakeReview({
      id: 1,
      versionId: 1,
    }));

    state = reviewsReducer(state, setFakeReview({
      id: 2,
      versionId: 2,
    }));

    state = reviewsReducer(state, setFakeReview({
      id: 3,
      versionId: 3,
    }));

    // Make sure all reviews co-exist by userId, addonId, review ID.
    expect(state[userId][addonId][1].id).toEqual(1);
    expect(state[userId][addonId][2].id).toEqual(2);
    expect(state[userId][addonId][3].id).toEqual(3);
  });

  it('preserves unrelated state', () => {
    let state = { ...initialState, somethingUnrelated: 'erp' };
    state = reviewsReducer(state, setFakeReview());
    expect(state.somethingUnrelated).toEqual('erp');
  });

  it('only allows one review to be the latest', () => {
    const addonId = fakeReview.addon.id;
    const userId = fakeReview.user.id;
    let state;

    state = reviewsReducer(state, setFakeReview({
      id: 1,
      is_latest: true,
    }));

    state = reviewsReducer(state, setFakeReview({
      id: 2,
      is_latest: true,
    }));

    state = reviewsReducer(state, setFakeReview({
      id: 3,
      is_latest: true,
    }));

    // Make sure only the newest submitted one is the latest:
    expect(state[userId][addonId][1].isLatest).toEqual(false);
    expect(state[userId][addonId][2].isLatest).toEqual(false);
    expect(state[userId][addonId][3].isLatest).toEqual(true);
  });

  it('preserves an older latest review', () => {
    const addonId = fakeReview.addon.id;
    const userId = fakeReview.user.id;
    let state;

    state = reviewsReducer(state, setFakeReview({
      id: 1,
      is_latest: true,
    }));

    state = reviewsReducer(state, setFakeReview({
      id: 2,
      is_latest: false,
    }));

    expect(state[userId][addonId][1].isLatest).toEqual(true);
    expect(state[userId][addonId][2].isLatest).toEqual(false);
  });

  describe('setAddonReviews', () => {
    it('stores multiple user reviews for an add-on', () => {
      const review1 = fakeReview;
      const review2 = { ...fakeReview, id: 3 };
      const action = setAddonReviews({
        addonSlug: fakeAddon.slug, reviews: [review1, review2], reviewCount: 2,
      });
      const state = reviewsReducer(undefined, action);
      const storedReviews = state.byAddon[fakeAddon.slug].reviews;
      expect(storedReviews.length).toEqual(2);
      expect(storedReviews[0]).toEqual(review1.id);
      expect(storedReviews[1]).toEqual(review2.id);
    });

    it('preserves existing add-on reviews', () => {
      const addon1 = fakeAddon;
      const review1 = fakeReview;
      const addon2 = { ...fakeAddon, slug: 'something-else' };
      const review2 = { ...fakeReview, id: 3 };
      const review3 = { ...fakeReview, id: 4 };

      let state;
      state = reviewsReducer(state, setAddonReviews({
        addonSlug: addon1.slug, reviews: [review1], reviewCount: 1,
      }));
      state = reviewsReducer(state, setAddonReviews({
        addonSlug: addon2.slug, reviews: [review2, review3], reviewCount: 2,
      }));

      expect(state.byAddon[addon1.slug].reviews[0]).toEqual(review1.id);
      expect(state.byAddon[addon2.slug].reviews[0]).toEqual(review2.id);
      expect(state.byAddon[addon2.slug].reviews[1]).toEqual(review3.id);
    });

    it('stores review objects', () => {
      const review1 = fakeReview;
      const review2 = { ...fakeReview, id: 3 };
      const action = setAddonReviews({
        addonSlug: fakeAddon.slug, reviews: [review1, review2], reviewCount: 2,
      });
      const state = reviewsReducer(undefined, action);
      expect(state.byId[review1.id]).toEqual(denormalizeReview(review1));
      expect(state.byId[review2.id]).toEqual(denormalizeReview(review2));
    });

    it('stores review counts', () => {
      const state = reviewsReducer(undefined, setAddonReviews({
        addonSlug: 'slug1', reviews: [fakeReview], reviewCount: 1,
      }));
      const newState = reviewsReducer(state, setAddonReviews({
        addonSlug: 'slug2', reviews: [fakeReview, fakeReview], reviewCount: 2,
      }));

      expect(newState.byAddon.slug1.reviewCount).toEqual(1);
      expect(newState.byAddon.slug2.reviewCount).toEqual(2);
    });
  });

  describe('expandReviewObjects', () => {
    it('expands IDs into objects', () => {
      const review1 = { ...fakeReview, id: 1 };
      const review2 = { ...fakeReview, id: 2 };
      const action = setAddonReviews({
        addonSlug: fakeAddon.slug,
        reviews: [review1, review2],
        reviewCount: 2,
      });
      const state = reviewsReducer(undefined, action);

      const expanded = expandReviewObjects({
        state,
        reviews: state.byAddon[fakeAddon.slug].reviews,
      });

      expect(expanded[0]).toEqual(denormalizeReview(review1));
      expect(expanded[1]).toEqual(denormalizeReview(review2));
    });

    it('throws an error if the review does not exist', () => {
      const nonExistantIds = [99678];
      expect(() => {
        expandReviewObjects({
          state: initialState, reviews: nonExistantIds,
        });
      }).toThrow(/No stored review exists for ID 99678/);
    });
  });

  describe('storeReviewObjects', () => {
    it('stores review objects by ID', () => {
      const reviews = [
        denormalizeReview({ ...fakeReview, id: 1 }),
        denormalizeReview({ ...fakeReview, id: 2 }),
      ];
      expect(storeReviewObjects({ state: initialState, reviews })).
        toEqual({
          [reviews[0].id]: reviews[0],
          [reviews[1].id]: reviews[1],
        });
    });

    it('preserves existing reviews', () => {
      const review1 = denormalizeReview({ ...fakeReview, id: 1 });
      const review2 = denormalizeReview({ ...fakeReview, id: 2 });

      const state = initialState;
      const byId = storeReviewObjects({ state, reviews: [review1] });

      expect(storeReviewObjects({
        state: { ...state, byId },
        reviews: [review2],
      })).toEqual({
        [review1.id]: review1,
        [review2.id]: review2,
      });
    });
  });
});
