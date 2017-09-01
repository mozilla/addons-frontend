import { setAddonReviews, setReview } from 'amo/actions/reviews';
import reviews, { initialState } from 'amo/reducers/reviews';
import { fakeAddon, fakeReview } from 'tests/unit/amo/helpers';

describe('amo.reducers.reviews', () => {
  function setFakeReview(
    {
      userId = fakeReview.user.id,
      addonId = fakeReview.addon.id,
      versionId = fakeReview.version.id,
      ...overrides
    } = {}
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
    expect(reviews(undefined, { type: 'SOME_OTHER_ACTION' })).toEqual(
      initialState
    );
  });

  it('stores a user review', () => {
    const action = setFakeReview();
    const state = reviews(undefined, action);
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

  it('preserves existing user rating data', () => {
    let state;

    state = reviews(
      state,
      setFakeReview({
        id: 1,
        userId: 1,
        addonId: 1,
        rating: 1,
      })
    );

    state = reviews(
      state,
      setFakeReview({
        id: 2,
        userId: 1,
        addonId: 2,
        rating: 5,
      })
    );

    state = reviews(
      state,
      setFakeReview({
        id: 3,
        userId: 2,
        addonId: 2,
        rating: 4,
      })
    );

    // Make sure all reviews co-exist by userId, addonId, review ID.
    expect(state[1][1][1].rating).toEqual(1);
    expect(state[1][2][2].rating).toEqual(5);
    expect(state[2][2][3].rating).toEqual(4);
  });

  it('preserves existing add-on reviews', () => {
    let state;
    const userId = fakeReview.user.id;
    const addonId = fakeReview.addon.id;

    state = reviews(
      state,
      setFakeReview({
        id: 1,
        versionId: 1,
      })
    );

    state = reviews(
      state,
      setFakeReview({
        id: 2,
        versionId: 2,
      })
    );

    state = reviews(
      state,
      setFakeReview({
        id: 3,
        versionId: 3,
      })
    );

    // Make sure all reviews co-exist by userId, addonId, review ID.
    expect(state[userId][addonId][1].id).toEqual(1);
    expect(state[userId][addonId][2].id).toEqual(2);
    expect(state[userId][addonId][3].id).toEqual(3);
  });

  it('preserves unrelated state', () => {
    let state = { ...initialState, somethingUnrelated: 'erp' };
    state = reviews(state, setFakeReview());
    expect(state.somethingUnrelated).toEqual('erp');
  });

  it('only allows one review to be the latest', () => {
    const addonId = fakeReview.addon.id;
    const userId = fakeReview.user.id;
    let state;

    state = reviews(
      state,
      setFakeReview({
        id: 1,
        is_latest: true,
      })
    );

    state = reviews(
      state,
      setFakeReview({
        id: 2,
        is_latest: true,
      })
    );

    state = reviews(
      state,
      setFakeReview({
        id: 3,
        is_latest: true,
      })
    );

    // Make sure only the newest submitted one is the latest:
    expect(state[userId][addonId][1].isLatest).toEqual(false);
    expect(state[userId][addonId][2].isLatest).toEqual(false);
    expect(state[userId][addonId][3].isLatest).toEqual(true);
  });

  it('preserves an older latest review', () => {
    const addonId = fakeReview.addon.id;
    const userId = fakeReview.user.id;
    let state;

    state = reviews(
      state,
      setFakeReview({
        id: 1,
        is_latest: true,
      })
    );

    state = reviews(
      state,
      setFakeReview({
        id: 2,
        is_latest: false,
      })
    );

    expect(state[userId][addonId][1].isLatest).toEqual(true);
    expect(state[userId][addonId][2].isLatest).toEqual(false);
  });

  describe('setAddonReviews', () => {
    it('stores multiple user reviews for an add-on', () => {
      const review1 = fakeReview;
      const review2 = { ...fakeReview, id: 3 };
      const action = setAddonReviews({
        addonSlug: fakeAddon.slug,
        reviews: [review1, review2],
        reviewCount: 2,
      });
      const state = reviews(undefined, action);
      const storedReviews = state.byAddon[fakeAddon.slug].reviews;
      expect(storedReviews.length).toEqual(2);
      expect(storedReviews[0].id).toEqual(review1.id);
      expect(storedReviews[1].id).toEqual(review2.id);
    });

    it('preserves existing add-on reviews', () => {
      const addon1 = fakeAddon;
      const review1 = fakeReview;
      const addon2 = { ...fakeAddon, slug: 'something-else' };
      const review2 = { ...fakeReview, id: 3 };
      const review3 = { ...fakeReview, id: 4 };

      let state;
      state = reviews(
        state,
        setAddonReviews({
          addonSlug: addon1.slug,
          reviews: [review1],
          reviewCount: 1,
        })
      );
      state = reviews(
        state,
        setAddonReviews({
          addonSlug: addon2.slug,
          reviews: [review2, review3],
          reviewCount: 2,
        })
      );

      expect(state.byAddon[addon1.slug].reviews[0].id).toEqual(review1.id);
      expect(state.byAddon[addon2.slug].reviews[0].id).toEqual(review2.id);
      expect(state.byAddon[addon2.slug].reviews[1].id).toEqual(review3.id);
    });

    it('stores review counts', () => {
      const state = reviews(
        undefined,
        setAddonReviews({
          addonSlug: 'slug1',
          reviews: [fakeReview],
          reviewCount: 1,
        })
      );
      const newState = reviews(
        state,
        setAddonReviews({
          addonSlug: 'slug2',
          reviews: [fakeReview, fakeReview],
          reviewCount: 2,
        })
      );

      expect(newState.byAddon.slug1.reviewCount).toEqual(1);
      expect(newState.byAddon.slug2.reviewCount).toEqual(2);
    });
  });
});
