import { LOCATION_CHANGE } from 'connected-react-router';

import {
  SAVED_RATING,
  deleteAddonReview,
  unloadAddonReviews,
  createInternalReview,
  fetchReview,
  fetchReviews,
  flagReview,
  hideEditReviewForm,
  hideFlashedReviewMessage,
  hideReplyToReviewForm,
  sendReplyToReview,
  setAddonReviews,
  setGroupedRatings,
  setInternalReview,
  setLatestReview,
  flashReviewMessage,
  setReview,
  setReviewReply,
  setReviewWasFlagged,
  setUserReviews,
  showEditReviewForm,
  showReplyToReviewForm,
} from 'amo/actions/reviews';
import { REVIEW_FLAG_REASON_SPAM } from 'amo/constants';
import reviewsReducer, {
  addReviewToState,
  changeViewState,
  expandReviewObjects,
  getReviewsByUserId,
  initialState,
  makeLatestUserReviewKey,
  reviewsAreLoading,
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

  function _setAddonReviews({
    reviews = [{ ...fakeReview, id: 1 }],
    ...params
  } = {}) {
    return setAddonReviews({
      addonSlug: fakeAddon.slug,
      pageSize: DEFAULT_API_PAGE_SIZE,
      reviews,
      reviewCount: reviews.length,
      ...params,
    });
  }

  function _setUserReviews({ reviews = [{ ...fakeReview }], ...params } = {}) {
    return setUserReviews({
      pageSize: DEFAULT_API_PAGE_SIZE,
      reviews,
      reviewCount: reviews.length,
      userId: 321,
      ...params,
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
      reviewAddon: {
        iconUrl: fakeReview.addon.icon_url,
        id: fakeReview.addon.id,
        name: fakeReview.addon.name,
        slug: fakeReview.addon.slug,
      },
      body: fakeReview.body,
      created: fakeReview.created,
      id: fakeReview.id,
      isDeveloperReply: fakeReview.is_developer_reply,
      isLatest: fakeReview.is_latest,
      score: fakeReview.score,
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

  describe('FETCH_REVIEW', () => {
    it('sets a loading flag when fetching a review', () => {
      const reviewId = 1;
      const state = reviewsReducer(
        undefined,
        fetchReview({ errorHandlerId: 1, reviewId }),
      );

      expect(state.view[reviewId].loadingReview).toEqual(true);
    });
  });

  describe('SET_REVIEW', () => {
    it('calls _addReviewToState()', () => {
      const _addReviewToState = sinon.stub().returns(initialState);

      const review = fakeReview;
      reviewsReducer(undefined, setReview(review), {
        _addReviewToState,
      });

      sinon.assert.calledWith(_addReviewToState, {
        state: initialState,
        review: createInternalReview(review),
      });
    });

    it('sets the loading flag to false', () => {
      const review = fakeReview;
      const state = reviewsReducer(undefined, setReview(fakeReview));

      expect(state.view[review.id].loadingReview).toEqual(false);
    });
  });

  describe('SET_INTERNAL_REVIEW', () => {
    it('calls _addReviewToState()', () => {
      const _addReviewToState = sinon.spy();

      const review = createInternalReview(fakeReview);
      reviewsReducer(undefined, setInternalReview(review), {
        _addReviewToState,
      });

      sinon.assert.calledWith(_addReviewToState, {
        state: initialState,
        review,
      });
    });
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
    expect(newState.byId[review.id].reply).toEqual(createInternalReview(reply));
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
      const action = _setAddonReviews({
        addonSlug: fakeAddon.slug,
        reviews: [review1, review2],
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
        _setAddonReviews({
          addonSlug: addon1.slug,
          reviews: [review1],
        }),
      );
      state = reviewsReducer(
        state,
        _setAddonReviews({
          addonSlug: addon2.slug,
          reviews: [review2, review3],
        }),
      );

      expect(state.byAddon[addon1.slug].reviews[0]).toEqual(review1.id);
      expect(state.byAddon[addon2.slug].reviews[0]).toEqual(review2.id);
      expect(state.byAddon[addon2.slug].reviews[1]).toEqual(review3.id);
    });

    it('stores review objects', () => {
      const review1 = fakeReview;
      const review2 = { ...fakeReview, id: 3 };
      const action = _setAddonReviews({
        addonSlug: fakeAddon.slug,
        reviews: [review1, review2],
      });
      const state = reviewsReducer(undefined, action);
      expect(state.byId[review1.id]).toEqual(createInternalReview(review1));
      expect(state.byId[review2.id]).toEqual(createInternalReview(review2));
    });

    it('stores review counts', () => {
      const state = reviewsReducer(
        undefined,
        _setAddonReviews({
          addonSlug: 'slug1',
          reviews: [fakeReview],
        }),
      );
      const newState = reviewsReducer(
        state,
        _setAddonReviews({
          addonSlug: 'slug2',
          reviews: [fakeReview, fakeReview],
        }),
      );

      expect(newState.byAddon.slug1.reviewCount).toEqual(1);
      expect(newState.byAddon.slug2.reviewCount).toEqual(2);
    });
  });

  describe('unloadAddonReviews', () => {
    const loadReviewDataIntoState = ({
      addonId,
      addonSlug,
      grouping,
      startState,
      reviewId,
      userId,
    }) => {
      const review = {
        ...fakeReview,
        id: reviewId,
        addon: {
          id: addonId,
          slug: addonSlug,
        },
        user: { id: userId },
      };

      let state;

      // Initialize values into the byId, byAddon, byUserId, groupedRatings and view buckets.
      state = reviewsReducer(startState, setReview(review));

      state = reviewsReducer(
        state,
        _setAddonReviews({
          addonSlug,
          reviews: [review],
        }),
      );

      state = reviewsReducer(
        state,
        _setUserReviews({
          reviews: [review],
          userId,
        }),
      );

      state = reviewsReducer(
        state,
        setGroupedRatings({
          addonId,
          grouping,
        }),
      );

      state = changeViewState({
        state,
        reviewId: review.id,
        stateChange: {
          someFlag: true,
        },
      });

      return state;
    };

    it('unloads cached review data', () => {
      const reviewId = 111;
      const addonId = 222;
      const addonSlug = 'some-slug';
      const userId = 333;
      const grouping = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      let state = loadReviewDataIntoState({
        addonId,
        addonSlug,
        grouping,
        reviewId,
        userId,
      });

      // Verify that data has been loaded for the reviewId.
      expect(state.byId[reviewId].reviewAddon.id).toEqual(addonId);
      expect(state.byAddon[addonSlug].reviews).toEqual([reviewId]);
      expect(state.byUserId[userId].reviews).toEqual([reviewId]);
      expect(state.groupedRatings[addonId]).toEqual(grouping);
      expect(state.view[reviewId].someFlag).toEqual(true);

      // Clear all data based on a reviewId.
      state = reviewsReducer(state, unloadAddonReviews({ addonId, reviewId }));

      expect(state.byId[reviewId]).toEqual(undefined);
      expect(state.byAddon[addonSlug]).toEqual(undefined);
      expect(state.byUserId[userId]).toEqual(undefined);
      expect(state.groupedRatings[addonId]).toEqual(undefined);
      expect(state.view[reviewId]).toEqual(undefined);
    });

    it('it unloads cached view data even for deleted reviews', () => {
      // This covers the case where a reply is deleted and then another reply is added
      // and we expect the view state for the reply to be cleared out.
      const addonId = 1;
      const reviewId = 111;

      let state = reviewsReducer(
        undefined,
        deleteAddonReview({
          addonId,
          errorHandlerId: 1,
          reviewId,
        }),
      );

      expect(state.view[reviewId].deletingReview).toEqual(true);

      state = reviewsReducer(state, unloadAddonReviews({ addonId, reviewId }));

      expect(state.view[reviewId]).toEqual(undefined);
    });

    it('preserves unrelated reviews data', () => {
      const reviewId = 111;
      const addonId = 222;
      const addonSlug = 'some-slug';
      const userId = 333;
      const grouping = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      let state = loadReviewDataIntoState({
        addonId,
        addonSlug,
        grouping,
        reviewId,
        userId,
      });

      // Load some unrelated data.
      const reviewId2 = 555;
      const addonId2 = 666;
      const addonSlug2 = 'some-slug-2';
      const userId2 = 777;

      state = loadReviewDataIntoState({
        startState: state,
        addonId: addonId2,
        addonSlug: addonSlug2,
        grouping,
        reviewId: reviewId2,
        userId: userId2,
      });

      // Verify that the unrelated data has been loaded for the reviewId.
      expect(state.byId[reviewId2].reviewAddon.id).toEqual(addonId2);
      expect(state.byAddon[addonSlug2].reviews).toEqual([reviewId2]);
      expect(state.byUserId[userId2].reviews).toEqual([reviewId2]);
      expect(state.groupedRatings[addonId2]).toEqual(grouping);
      expect(state.view[reviewId2].someFlag).toEqual(true);

      state = reviewsReducer(state, unloadAddonReviews({ addonId, reviewId }));

      // Verify that the unrelated data has not been unloaded.
      expect(state.byId[reviewId2].reviewAddon.id).toEqual(addonId2);
      expect(state.byAddon[addonSlug2].reviews).toEqual([reviewId2]);
      expect(state.byUserId[userId2].reviews).toEqual([reviewId2]);
      expect(state.groupedRatings[addonId2]).toEqual(grouping);
      expect(state.view[reviewId2].someFlag).toEqual(true);
    });
  });

  describe('expandReviewObjects', () => {
    it('expands IDs into objects', () => {
      const review1 = { ...fakeReview, id: 1 };
      const review2 = { ...fakeReview, id: 2 };
      const action = _setAddonReviews({
        addonSlug: fakeAddon.slug,
        reviews: [review1, review2],
      });
      const state = reviewsReducer(undefined, action);

      const expanded = expandReviewObjects({
        state,
        reviews: state.byAddon[fakeAddon.slug].reviews,
      });

      expect(expanded[0]).toEqual(createInternalReview(review1));
      expect(expanded[1]).toEqual(createInternalReview(review2));
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
        createInternalReview({ ...fakeReview, id: 1 }),
        createInternalReview({ ...fakeReview, id: 2 }),
      ];
      expect(storeReviewObjects({ state: initialState, reviews })).toEqual({
        [reviews[0].id]: reviews[0],
        [reviews[1].id]: reviews[1],
      });
    });

    it('preserves existing reviews', () => {
      const review1 = createInternalReview({ ...fakeReview, id: 1 });
      const review2 = createInternalReview({ ...fakeReview, id: 2 });

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
      const reviews = [createInternalReview({ ...fakeReview, id: undefined })];
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
        deletingReview: false,
        editingReview: false,
        flag: {},
        replyingToReview: false,
        loadingReview: false,
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
        _setUserReviews({
          reviews: [review1, review2],
          userId,
        }),
      );

      expect(state.byId[review1.id]).toEqual(createInternalReview(review1));
      expect(state.byId[review2.id]).toEqual(createInternalReview(review2));
    });

    it('stores multiple reviews for a user ID', () => {
      const review1 = fakeReview;
      const review2 = { ...fakeReview, id: 3 };

      const action = _setUserReviews({
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
        _setUserReviews({
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
        _setUserReviews({
          pageSize,
          userId,
          reviews,
        }),
      );

      expect(getReviewsByUserId(state, userId)).toEqual({
        pageSize,
        reviewCount: reviews.length,
        reviews: reviews.map(createInternalReview),
      });
    });
  });

  describe('makeLatestUserReviewKey', () => {
    it('makes a key', () => {
      expect(
        makeLatestUserReviewKey({ userId: 1, addonId: 2, versionId: 3 }),
      ).toEqual('user-1/addon-2/version-3');
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

    it('requires setReview()', () => {
      expect(() => {
        reviewsReducer(
          undefined,
          _setLatestReview({ review: { ...fakeReview, id: 2 } }),
        );
      }).toThrow(/review 2 has not been set/);
    });

    it('sets the latest review', () => {
      const addonId = 1;
      const versionId = 2;
      const userId = 3;
      const review = { ...fakeReview, id: 2 };

      let state;
      state = reviewsReducer(state, setReview(review));
      state = reviewsReducer(
        state,
        _setLatestReview({ addonId, versionId, userId, review }),
      );

      expect(
        state.latestUserReview[
          makeLatestUserReviewKey({ addonId, userId, versionId })
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
        state.latestUserReview[
          makeLatestUserReviewKey({ addonId, userId, versionId })
        ],
      ).toBeNull();
    });

    it('preserves other latest reviews', () => {
      const userId = 1;
      const addonId = 1;
      const review1 = { ...fakeReview, id: 1 };
      const review2 = { ...fakeReview, id: 2 };

      let state;
      state = reviewsReducer(state, setReview(review1));
      state = reviewsReducer(
        state,
        _setLatestReview({
          userId,
          addonId,
          versionId: 1,
          review: review1,
        }),
      );
      state = reviewsReducer(state, setReview(review2));
      state = reviewsReducer(
        state,
        _setLatestReview({
          userId,
          addonId,
          versionId: 2,
          review: review2,
        }),
      );

      expect(
        state.latestUserReview[
          makeLatestUserReviewKey({ userId, addonId, versionId: 1 })
        ],
      ).toEqual(1);
      expect(
        state.latestUserReview[
          makeLatestUserReviewKey({ userId, addonId, versionId: 2 })
        ],
      ).toEqual(2);
    });
  });

  describe('addReviewToState', () => {
    function _addReviewToState(params = {}) {
      return addReviewToState({
        state: initialState,
        ...params,
      });
    }

    it('stores an internal review object', () => {
      const review = createInternalReview({ ...fakeReview, id: 1 });
      const state = _addReviewToState({ review });

      expect(state.byId[review.id]).toEqual(review);
    });

    it('resets byUserId data when adding a new review', () => {
      const reviewId1 = 1;
      const reviewId2 = 2;
      const userId = 123;

      const prevState = reviewsReducer(
        undefined,
        _setUserReviews({
          reviews: [{ ...fakeReview, id: reviewId1 }],
          userId,
        }),
      );

      const review = createInternalReview({
        ...fakeReview,
        id: reviewId2,
        body: 'This add-on is fantastic',
        score: 5,
        user: {
          ...fakeReview.user,
          id: userId,
        },
      });

      const state = _addReviewToState({
        state: prevState,
        review,
      });
      expect(state.byUserId[userId]).toBeUndefined();
    });

    it('resets byUserId data when adding a new rating', () => {
      const reviewId1 = 1;
      const reviewId2 = 2;
      const userId = 123;

      const prevState = reviewsReducer(
        undefined,
        _setUserReviews({
          reviews: [{ ...fakeReview, id: reviewId1 }],
          userId,
        }),
      );

      const review = createInternalReview({
        ...fakeReview,
        id: reviewId2,
        body: undefined,
        score: 5,
        user: {
          ...fakeReview.user,
          id: userId,
        },
      });

      const state = _addReviewToState({
        state: prevState,
        review,
      });
      expect(state.byUserId[userId]).toBeUndefined();
    });

    it('does not reset byUserId data when updating a review', () => {
      const userId = 123;

      const prevState = reviewsReducer(
        undefined,
        _setUserReviews({
          reviews: [fakeReview],
          userId,
        }),
      );
      expect(prevState.byUserId[userId]).toBeDefined();

      const review = createInternalReview({
        ...fakeReview,
        user: {
          ...fakeReview.user,
          id: userId,
        },
      });
      const state = _addReviewToState({
        state: prevState,
        review,
      });
      expect(state.byUserId[userId]).toBeDefined();
    });

    it('does not reset byUserId data when updating a rating', () => {
      const userId = 123;
      const externalReviewUser = {
        ...fakeReview.user,
        id: userId,
      };

      const ratingOnlyReview = {
        ...fakeReview,
        body: undefined,
        score: 4,
        user: externalReviewUser,
      };

      const prevState = reviewsReducer(
        undefined,
        _setUserReviews({
          reviews: [ratingOnlyReview],
          userId,
        }),
      );

      // Upgrade the rating to a review.
      const review = createInternalReview({
        ...fakeReview,
        body: 'This add-on is pretty good',
        user: externalReviewUser,
      });

      const state = _addReviewToState({
        state: prevState,
        review,
      });

      expect(state.byUserId[userId]).toBeDefined();
    });

    it('resets all related add-on reviews for new reviews', () => {
      const addonSlug = 'some-slug';

      let state;
      state = reviewsReducer(
        state,
        _setAddonReviews({
          addonSlug,
          reviews: [{ ...fakeReview, id: 1 }],
        }),
      );
      state = _addReviewToState({
        state,
        review: createInternalReview({
          ...fakeReview,
          addon: {
            ...fakeReview.addon,
            slug: addonSlug,
          },
          id: 2,
        }),
      });

      expect(state.byAddon[addonSlug]).toBeUndefined();
    });

    it('resets add-on reviews when upgrading a rating to a review', () => {
      const reviewId = 1;
      const addonSlug = 'some-slug';

      let state;
      state = reviewsReducer(
        state,
        _setAddonReviews({
          addonSlug,
          reviews: [{ ...fakeReview, body: undefined, score: 5, id: reviewId }],
        }),
      );
      state = _addReviewToState({
        state,
        review: createInternalReview({
          ...fakeReview,
          addon: {
            ...fakeReview.addon,
            slug: addonSlug,
          },
          body: 'This add-on is pretty good',
          score: 4,
          id: reviewId,
        }),
      });

      expect(state.byAddon[addonSlug]).toBeUndefined();
    });

    it('does not reset all related add-on reviews for updates', () => {
      const reviewId = 1;
      const addonSlug = 'some-slug';

      let state;
      state = reviewsReducer(
        state,
        _setAddonReviews({
          addonSlug,
          reviews: [
            {
              ...fakeReview,
              body: 'This is a great add-on',
              score: 5,
              id: reviewId,
            },
          ],
        }),
      );
      state = _addReviewToState({
        state,
        review: createInternalReview({
          ...fakeReview,
          addon: {
            ...fakeReview.addon,
            slug: addonSlug,
          },
          body: 'This add-on is OK',
          score: 3,
          id: reviewId,
        }),
      });

      expect(state.byAddon[addonSlug]).toBeDefined();
    });

    it('resets groupedRatings when adding a new rating', () => {
      const addonId = 44231;
      let state;

      state = reviewsReducer(
        state,
        setGroupedRatings({
          addonId,
          grouping: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        }),
      );

      state = _addReviewToState({
        state,
        review: createInternalReview({
          ...fakeReview,
          addon: {
            ...fakeReview.addon,
            id: addonId,
          },
        }),
      });

      expect(state.groupedRatings[addonId]).toBeUndefined();
    });
  });

  describe('setGroupedRatings', () => {
    it('stores grouped ratings', () => {
      const addonId = 432;
      const grouping = {
        1: 64,
        2: 122,
        3: 456,
        4: 1243,
        5: 922,
      };

      const state = reviewsReducer(
        undefined,
        setGroupedRatings({
          addonId,
          grouping,
        }),
      );

      expect(state.groupedRatings[addonId]).toEqual(grouping);
    });

    it('preserves existing groupings', () => {
      let state;

      const firstAddonId = 1;
      const firstGrouping = { 1: 0, 2: 0, 3: 0, 4: 2, 5: 6 };

      const secondAddonId = 2;
      const secondGrouping = { 1: 0, 2: 0, 3: 3, 4: 4, 5: 4 };

      state = reviewsReducer(
        state,
        setGroupedRatings({
          addonId: firstAddonId,
          grouping: firstGrouping,
        }),
      );
      state = reviewsReducer(
        state,
        setGroupedRatings({
          addonId: secondAddonId,
          grouping: secondGrouping,
        }),
      );

      expect(state.groupedRatings[firstAddonId]).toEqual(firstGrouping);
    });

    it('updates groupedRatings', () => {
      const addonId = 44231;
      let state;

      const grouping1 = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const grouping2 = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 };

      state = reviewsReducer(
        state,
        setGroupedRatings({ addonId, grouping: grouping1 }),
      );
      state = reviewsReducer(
        state,
        setGroupedRatings({ addonId, grouping: grouping2 }),
      );

      expect(state.groupedRatings[addonId]).toEqual(grouping2);
    });
  });

  describe('flashReviewMessage', () => {
    it('flashes a message', () => {
      const state = reviewsReducer(undefined, flashReviewMessage(SAVED_RATING));
      expect(state.flashMessage).toEqual(SAVED_RATING);
    });
  });

  describe('hideFlashedReviewMessage', () => {
    it('unsets a message', () => {
      let state;

      state = reviewsReducer(state, flashReviewMessage(SAVED_RATING));
      state = reviewsReducer(state, hideFlashedReviewMessage());

      expect(state.flashMessage).toEqual(undefined);
    });
  });

  describe('deleteAddonReview', () => {
    it('stores view state about deleting a review', () => {
      const review = { ...fakeReview, id: 837 };

      const state = reviewsReducer(
        undefined,
        deleteAddonReview({
          addonId: fakeAddon.id,
          errorHandlerId: 'some-id',
          reviewId: review.id,
        }),
      );

      expect(state.view[review.id].deletingReview).toEqual(true);
    });
  });

  describe('reviewsAreLoading', () => {
    it('returns false for an add-on for which reviews have never been fetched or loaded', () => {
      const fetchedSlug = 'some-slug';
      const nonfetchedSlug = 'another-slug';
      const state = reviewsReducer(
        undefined,
        fetchReviews({ addonSlug: fetchedSlug, errorHandlerId: 1 }),
      );
      expect(reviewsAreLoading({ reviews: state }, nonfetchedSlug)).toBe(false);
    });

    it('returns true for an add-on for which reviews are loading', () => {
      const slug = 'some-slug';
      const state = reviewsReducer(
        undefined,
        fetchReviews({ addonSlug: slug, errorHandlerId: 1 }),
      );
      expect(reviewsAreLoading({ reviews: state }, slug)).toBe(true);
    });

    it('returns false for an add-on for which reviews have finished loading', () => {
      const slug = 'some-slug';
      let state = reviewsReducer(
        undefined,
        fetchReviews({ addonSlug: slug, errorHandlerId: 1 }),
      );
      state = reviewsReducer(
        state,
        _setAddonReviews({
          addonSlug: slug,
          reviews: [fakeReview],
        }),
      );
      expect(reviewsAreLoading({ reviews: state }, slug)).toBe(false);
    });
  });

  describe('LOCATION_CHANGE', () => {
    it('resets the view state', () => {
      let state;

      state = reviewsReducer(
        undefined,
        showEditReviewForm({
          reviewId: 1,
        }),
      );

      state = reviewsReducer(state, { type: LOCATION_CHANGE });

      expect(state.view).toEqual({});
    });
  });
});
