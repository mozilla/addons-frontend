import {
  clearAddonReviews,
  denormalizeReview,
  flagReview,
  hideEditReviewForm,
  hideReplyToReviewForm,
  sendReplyToReview,
  setAddonReviews,
  setLatestReview,
  setReview,
  setReviewReply,
  setReviewWasFlagged,
  setUserReviews,
  showEditReviewForm,
  showReplyToReviewForm,
} from 'amo/actions/reviews';
import { REVIEW_FLAG_REASON_SPAM } from 'amo/constants';
import reviewsReducer, {
  changeViewState,
  expandReviewObjects,
  getReviewsByUserId,
  initialState,
  latestByAddonVersionKey,
  storeReviewObjects,
} from 'amo/reducers/reviews';
import { DEFAULT_API_PAGE_SIZE } from 'core/api';
import { fakeAddon, fakeReview } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  function setFakeReview({
    userId = fakeReview.user.id,
    addonId = fakeReview.addon.id,
    reply = null,
    versionId = fakeReview.version.id,
    ...overrides
  } = {}) {
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
      reply: reply
        ? {
            ...fakeReview,
            ...reply,
          }
        : null,
      version: {
        ...fakeReview.version,
        id: versionId,
      },
      ...overrides,
    });
  }

  it('defaults to an empty object', () => {
    expect(reviewsReducer(undefined, { type: 'SOME_OTHER_ACTION' })).toEqual(
      initialState,
    );
  });

  it('stores a user review', () => {
    const action = setFakeReview();
    const state = reviewsReducer(undefined, action);
    const storedReview = state.byId[fakeReview.id];

    expect(storedReview).toEqual({
      addonId: fakeReview.addon.id,
      addonSlug: fakeReview.addon.slug,
      body: fakeReview.body,
      created: fakeReview.created,
      id: fakeReview.id,
      isLatest: fakeReview.is_latest,
      rating: fakeReview.rating,
      reply: null,
      title: fakeReview.title,
      userId: fakeReview.user.id,
      userName: fakeReview.user.name,
      userUrl: fakeReview.user.url,
      versionId: fakeReview.version.id,
    });
  });

  it('stores a user review with a reply', () => {
    const replyBody = 'This is a developer reply';
    const action = setFakeReview({
      reply: {
        body: replyBody,
      },
    });
    const state = reviewsReducer(undefined, action);
    const storedReview = state.byId[fakeReview.id];

    expect(storedReview.reply.body).toEqual(replyBody);
  });

  it('stores a review object', () => {
    const review = { ...fakeReview, id: 1 };
    const action = setReview(review);
    const state = reviewsReducer(undefined, action);
    expect(state.byId[review.id]).toEqual(denormalizeReview(review));
  });

  it('resets the byUserId data when adding a new review', () => {
    const userId = 123;

    const prevState = reviewsReducer(
      undefined,
      setUserReviews({
        pageSize: DEFAULT_API_PAGE_SIZE,
        reviews: [fakeReview],
        reviewCount: 1,
        userId,
      }),
    );
    expect(prevState.byUserId[userId]).toBeDefined();

    const state = reviewsReducer(prevState, setFakeReview({ userId }));
    expect(state.byUserId[userId]).not.toBeDefined();
  });

  it('stores a review reply object', () => {
    const review = { ...fakeReview, id: 1, body: 'Original review body' };
    const state = reviewsReducer(undefined, setReview(review));

    const reply = { ...review, id: 2, body: 'A developer reply' };
    const newState = reviewsReducer(
      state,
      setReviewReply({
        originalReviewId: review.id,
        reply,
      }),
    );

    expect(newState.byId[review.id].body).toEqual('Original review body');
    expect(newState.byId[review.id].reply.body).toEqual('A developer reply');
    expect(newState.byId[review.id].reply).toEqual(denormalizeReview(reply));
  });

  it('cannot store a reply to a non-existant review', () => {
    const reply = { ...fakeReview, body: 'A developer reply' };
    expect(() => {
      reviewsReducer(
        undefined,
        setReviewReply({
          originalReviewId: 3,
          reply,
        }),
      );
    }).toThrow(/review ID 3 .* does not exist/);
  });

  it('preserves existing reviews', () => {
    let state;

    state = reviewsReducer(
      state,
      setFakeReview({
        id: 1,
        versionId: 1,
      }),
    );

    state = reviewsReducer(
      state,
      setFakeReview({
        id: 2,
        versionId: 2,
      }),
    );

    state = reviewsReducer(
      state,
      setFakeReview({
        id: 3,
        versionId: 3,
      }),
    );

    expect(state.byId[1].id).toEqual(1);
    expect(state.byId[2].id).toEqual(2);
    expect(state.byId[3].id).toEqual(3);
  });

  it('preserves unrelated state', () => {
    let state = { ...initialState, somethingUnrelated: 'erp' };
    state = reviewsReducer(state, setFakeReview());
    expect(state.somethingUnrelated).toEqual('erp');
  });

  describe('setAddonReviews', () => {
    it('stores multiple user reviews for an add-on', () => {
      const review1 = fakeReview;
      const review2 = { ...fakeReview, id: 3 };
      const action = setAddonReviews({
        addonSlug: fakeAddon.slug,
        pageSize: DEFAULT_API_PAGE_SIZE,
        reviews: [review1, review2],
        reviewCount: 2,
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
      state = reviewsReducer(
        state,
        setAddonReviews({
          addonSlug: addon1.slug,
          pageSize: DEFAULT_API_PAGE_SIZE,
          reviews: [review1],
          reviewCount: 1,
        }),
      );
      state = reviewsReducer(
        state,
        setAddonReviews({
          addonSlug: addon2.slug,
          pageSize: DEFAULT_API_PAGE_SIZE,
          reviews: [review2, review3],
          reviewCount: 2,
        }),
      );

      expect(state.byAddon[addon1.slug].reviews[0]).toEqual(review1.id);
      expect(state.byAddon[addon2.slug].reviews[0]).toEqual(review2.id);
      expect(state.byAddon[addon2.slug].reviews[1]).toEqual(review3.id);
    });

    it('stores review objects', () => {
      const review1 = fakeReview;
      const review2 = { ...fakeReview, id: 3 };
      const action = setAddonReviews({
        addonSlug: fakeAddon.slug,
        pageSize: DEFAULT_API_PAGE_SIZE,
        reviews: [review1, review2],
        reviewCount: 2,
      });
      const state = reviewsReducer(undefined, action);
      expect(state.byId[review1.id]).toEqual(denormalizeReview(review1));
      expect(state.byId[review2.id]).toEqual(denormalizeReview(review2));
    });

    it('stores review counts', () => {
      const state = reviewsReducer(
        undefined,
        setAddonReviews({
          addonSlug: 'slug1',
          pageSize: DEFAULT_API_PAGE_SIZE,
          reviews: [fakeReview],
          reviewCount: 1,
        }),
      );
      const newState = reviewsReducer(
        state,
        setAddonReviews({
          addonSlug: 'slug2',
          pageSize: DEFAULT_API_PAGE_SIZE,
          reviews: [fakeReview, fakeReview],
          reviewCount: 2,
        }),
      );

      expect(newState.byAddon.slug1.reviewCount).toEqual(1);
      expect(newState.byAddon.slug2.reviewCount).toEqual(2);
    });
  });

  describe('clearAddonReviews', () => {
    it('clears add-on reviews', () => {
      const addonSlug = 'some-slug';

      const action = setAddonReviews({
        addonSlug,
        pageSize: DEFAULT_API_PAGE_SIZE,
        reviews: [fakeReview],
        reviewCount: 1,
      });

      const state = reviewsReducer(undefined, action);
      const newState = reviewsReducer(state, clearAddonReviews({ addonSlug }));

      expect(newState.byAddon[addonSlug]).toBeUndefined();
    });

    it('preserves unrelated add-on reviews', () => {
      const firstSlug = 'first';
      const secondSlug = 'second';

      const review = { ...fakeReview, id: 1 };
      const action = setAddonReviews({
        addonSlug: firstSlug,
        pageSize: DEFAULT_API_PAGE_SIZE,
        reviews: [review],
        reviewCount: 1,
      });

      const state = reviewsReducer(undefined, action);
      const newState = reviewsReducer(
        state,
        clearAddonReviews({ addonSlug: secondSlug }),
      );

      const storedReviews = newState.byAddon[firstSlug].reviews;
      expect(storedReviews[0]).toEqual(review.id);
      expect(storedReviews.length).toEqual(1);
    });
  });

  describe('expandReviewObjects', () => {
    it('expands IDs into objects', () => {
      const review1 = { ...fakeReview, id: 1 };
      const review2 = { ...fakeReview, id: 2 };
      const action = setAddonReviews({
        addonSlug: fakeAddon.slug,
        pageSize: DEFAULT_API_PAGE_SIZE,
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
          state: initialState,
          reviews: nonExistantIds,
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
      expect(storeReviewObjects({ state: initialState, reviews })).toEqual({
        [reviews[0].id]: reviews[0],
        [reviews[1].id]: reviews[1],
      });
    });

    it('preserves existing reviews', () => {
      const review1 = denormalizeReview({ ...fakeReview, id: 1 });
      const review2 = denormalizeReview({ ...fakeReview, id: 2 });

      const state = initialState;
      const byId = storeReviewObjects({ state, reviews: [review1] });

      expect(
        storeReviewObjects({
          state: { ...state, byId },
          reviews: [review2],
        }),
      ).toEqual({
        [review1.id]: review1,
        [review2.id]: review2,
      });
    });

    it('throws an error for falsy IDs', () => {
      const reviews = [denormalizeReview({ ...fakeReview, id: undefined })];
      expect(() => {
        storeReviewObjects({ state: initialState, reviews });
      }).toThrow(/Cannot store review because review.id is falsy/);
    });
  });

  describe('showEditReviewForm', () => {
    it('stores view state about showing an edit review form', () => {
      const review = { ...fakeReview, id: 837 };

      const state = reviewsReducer(
        undefined,
        showEditReviewForm({
          reviewId: review.id,
        }),
      );

      expect(state.view[review.id].editingReview).toEqual(true);
    });
  });

  describe('showReplyToReviewForm', () => {
    it('stores view state about showing a reply form', () => {
      const review = { ...fakeReview, id: 837 };

      const state = reviewsReducer(
        undefined,
        showReplyToReviewForm({
          reviewId: review.id,
        }),
      );

      expect(state.view[review.id].replyingToReview).toEqual(true);
    });
  });

  describe('hideEditReviewForm', () => {
    it('stores view state about hiding an edit review form', () => {
      const review = { ...fakeReview, id: 837 };

      const state = reviewsReducer(
        undefined,
        hideEditReviewForm({
          reviewId: review.id,
        }),
      );

      expect(state.view[review.id].editingReview).toEqual(false);
    });
  });

  describe('hideReplyToReviewForm', () => {
    it('stores view state about hiding a reply', () => {
      const review = { ...fakeReview, id: 837 };

      const state = reviewsReducer(
        undefined,
        hideReplyToReviewForm({
          reviewId: review.id,
        }),
      );

      expect(state.view[review.id].replyingToReview).toEqual(false);
    });

    it('unsets the submittingReply flag', () => {
      const review = { ...fakeReview, id: 837 };

      const state = reviewsReducer(
        undefined,
        sendReplyToReview({
          errorHandlerId: 'some-id',
          originalReviewId: review.id,
          body: 'a reply',
        }),
      );
      const newState = reviewsReducer(
        state,
        hideReplyToReviewForm({
          reviewId: review.id,
        }),
      );

      expect(newState.view[review.id].submittingReply).toEqual(false);
    });
  });

  describe('sendReplyToReview', () => {
    it('stores view state about submitting a reply', () => {
      const review = { ...fakeReview, id: 837 };

      const state = reviewsReducer(
        undefined,
        sendReplyToReview({
          errorHandlerId: 'some-id',
          originalReviewId: review.id,
          body: 'a reply',
        }),
      );

      expect(state.view[review.id].submittingReply).toEqual(true);
    });
  });

  describe('review flagging', () => {
    it('stores view state about flagging a review', () => {
      const review = { ...fakeReview, id: 837 };

      const state = reviewsReducer(
        undefined,
        flagReview({
          errorHandlerId: 'some-id',
          reason: REVIEW_FLAG_REASON_SPAM,
          reviewId: review.id,
        }),
      );

      expect(state.view[review.id].flag).toMatchObject({
        reason: REVIEW_FLAG_REASON_SPAM,
        inProgress: true,
        wasFlagged: false,
      });
    });

    it('stores view state about a flagged review', () => {
      const review = { ...fakeReview, id: 837 };

      const state = reviewsReducer(
        undefined,
        setReviewWasFlagged({
          reason: REVIEW_FLAG_REASON_SPAM,
          reviewId: review.id,
        }),
      );

      expect(state.view[review.id].flag).toMatchObject({
        reason: REVIEW_FLAG_REASON_SPAM,
        inProgress: false,
        wasFlagged: true,
      });
    });
  });

  describe('changeViewState', () => {
    it('preserves view state for other reviews', () => {
      const review1 = { ...fakeReview, id: 1 };
      const review2 = { ...fakeReview, id: 2 };

      const state = changeViewState({
        state: initialState,
        reviewId: review1.id,
        stateChange: {
          someFlag: true,
        },
      });

      const newState = changeViewState({
        state,
        reviewId: review2.id,
        stateChange: {
          someFlag: true,
        },
      });

      expect(newState.view[review1.id].someFlag).toEqual(true);
      expect(newState.view[review2.id].someFlag).toEqual(true);
    });

    it('preserves existing view state for the review', () => {
      const review = { ...fakeReview, id: 987 };

      const state = changeViewState({
        state: initialState,
        reviewId: review.id,
        stateChange: {
          firstFlag: true,
        },
      });

      const newState = changeViewState({
        state,
        reviewId: review.id,
        stateChange: {
          secondFlag: true,
        },
      });

      expect(newState.view[review.id].firstFlag).toEqual(true);
      expect(newState.view[review.id].secondFlag).toEqual(true);
    });

    it('preserves existing flag review values', () => {
      const review = { ...fakeReview, id: 987 };

      const state = changeViewState({
        state: initialState,
        reviewId: review.id,
        stateChange: {
          flag: {
            reason: REVIEW_FLAG_REASON_SPAM,
            inProgress: true,
          },
        },
      });

      const newState = changeViewState({
        state,
        reviewId: review.id,
        stateChange: {
          flag: {
            reason: REVIEW_FLAG_REASON_SPAM,
            wasFlagged: true,
          },
        },
      });

      const newFlag = newState.view[review.id].flag;
      expect(newFlag.inProgress).toEqual(true);
      expect(newFlag.wasFlagged).toEqual(true);
      expect(newFlag.reason).toEqual(REVIEW_FLAG_REASON_SPAM);
    });

    it('sets default view states', () => {
      const review = { ...fakeReview, id: 987 };

      const state = changeViewState({
        state: initialState,
        reviewId: review.id,
        stateChange: {},
      });

      expect(state.view[review.id]).toEqual({
        editingReview: false,
        flag: {},
        replyingToReview: false,
        submittingReply: false,
      });
    });
  });

  describe('setUserReviews', () => {
    const userId = 123;

    it('stores review objects', () => {
      const review1 = fakeReview;
      const review2 = { ...fakeReview, id: 3 };

      const state = reviewsReducer(
        undefined,
        setUserReviews({
          pageSize: DEFAULT_API_PAGE_SIZE,
          reviews: [review1, review2],
          reviewCount: 2,
          userId,
        }),
      );

      expect(state.byId[review1.id]).toEqual(denormalizeReview(review1));
      expect(state.byId[review2.id]).toEqual(denormalizeReview(review2));
    });

    it('stores multiple reviews for a user ID', () => {
      const review1 = fakeReview;
      const review2 = { ...fakeReview, id: 3 };

      const action = setUserReviews({
        pageSize: DEFAULT_API_PAGE_SIZE,
        reviewCount: 2,
        reviews: [review1, review2],
        userId,
      });

      const state = reviewsReducer(undefined, action);
      const storedReviews = state.byUserId[userId].reviews;

      expect(storedReviews.length).toEqual(2);
      expect(storedReviews[0]).toEqual(review1.id);
      expect(storedReviews[1]).toEqual(review2.id);
    });

    it('stores review counts', () => {
      const state = reviewsReducer(
        undefined,
        setUserReviews({
          pageSize: DEFAULT_API_PAGE_SIZE,
          reviewCount: 1,
          reviews: [fakeReview],
          userId,
        }),
      );

      expect(state.byUserId[userId].reviewCount).toEqual(1);
    });
  });

  describe('getReviewsByUserId()', () => {
    it('returns null when userId is not found', () => {
      const reviews = getReviewsByUserId(initialState, 123);

      expect(reviews).toEqual(null);
    });

    it('returns an object with reviews, reviewCount and pageSize', () => {
      const userId = 123;
      const reviews = [fakeReview];
      const pageSize = 10;

      const state = reviewsReducer(
        undefined,
        setUserReviews({
          pageSize,
          userId,
          reviewCount: reviews.length,
          reviews,
        }),
      );

      expect(getReviewsByUserId(state, userId)).toEqual({
        pageSize,
        reviewCount: reviews.length,
        reviews: reviews.map(denormalizeReview),
      });
    });
  });

  describe('latestByAddonVersionKey', () => {
    it('generates a key', () => {
      expect(
        latestByAddonVersionKey({ userId: 1, addonId: 2, versionId: 3 }),
      ).toEqual('user1-addon2-version3');
    });
  });

  describe('setLatestReview()', () => {
    const _setLatestReview = ({
      review = { ...fakeReview, id: 1 },
      ...params
    } = {}) => {
      return setLatestReview({
        addonId: 9,
        addonSlug: 'some-slug',
        versionId: 8,
        userId: 7,
        review,
        ...params,
      });
    };

    it('sets a review object', () => {
      const review = { ...fakeReview, id: 2 };

      const state = reviewsReducer(undefined, _setLatestReview({ review }));

      expect(state.byId[review.id]).toEqual(denormalizeReview(review));
    });

    it('sets the latest review', () => {
      const addonId = 1;
      const versionId = 2;
      const userId = 3;
      const review = { ...fakeReview, id: 2 };

      const state = reviewsReducer(
        undefined,
        _setLatestReview({ addonId, versionId, userId, review }),
      );

      expect(
        state.latestByAddonVersion[
          latestByAddonVersionKey({ addonId, userId, versionId })
        ],
      ).toEqual(review.id);
    });

    it('can set the latest review to null', () => {
      const addonId = 1;
      const versionId = 2;
      const userId = 3;

      const state = reviewsReducer(
        undefined,
        _setLatestReview({ addonId, versionId, userId, review: null }),
      );

      expect(
        state.latestByAddonVersion[
          latestByAddonVersionKey({ addonId, userId, versionId })
        ],
      ).toBeNull();
    });

    it('preserves other latest reviews', () => {
      const userId = 1;
      const addonId = 1;

      let state;
      state = reviewsReducer(
        state,
        _setLatestReview({
          userId,
          addonId,
          versionId: 1,
          review: { ...fakeReview, id: 1 },
        }),
      );
      state = reviewsReducer(
        state,
        _setLatestReview({
          userId,
          addonId,
          versionId: 2,
          review: { ...fakeReview, id: 2 },
        }),
      );

      expect(
        state.latestByAddonVersion[
          latestByAddonVersionKey({ userId, addonId, versionId: 1 })
        ],
      ).toEqual(1);
      expect(
        state.latestByAddonVersion[
          latestByAddonVersionKey({ userId, addonId, versionId: 2 })
        ],
      ).toEqual(2);
    });

    it('resets all related add-on reviews', () => {
      const addonSlug = 'some-slug';

      let state;
      state = reviewsReducer(
        state,
        setAddonReviews({
          addonSlug,
          pageSize: DEFAULT_API_PAGE_SIZE,
          reviews: [{ ...fakeReview, id: 1 }],
          reviewCount: 1,
        }),
      );
      state = reviewsReducer(state, _setLatestReview({ addonSlug }));

      expect(state.byAddon[addonSlug]).toBeUndefined();
    });

    it('resets all related user reviews', () => {
      const userId = 123;

      let state;
      state = reviewsReducer(
        state,
        setUserReviews({
          pageSize: DEFAULT_API_PAGE_SIZE,
          reviews: [fakeReview],
          reviewCount: 1,
          userId,
        }),
      );
      state = reviewsReducer(state, _setLatestReview({ userId }));

      expect(state.byUserId[userId]).toBeUndefined();
    });
  });
});
