import { LOCATION_CHANGE } from 'connected-react-router';

import {
  SAVED_RATING,
  beginDeleteAddonReview,
  cancelDeleteAddonReview,
  createInternalReview,
  deleteAddonReview,
  fetchReview,
  fetchReviewPermissions,
  fetchReviews,
  flagReview,
  flashReviewMessage,
  hideEditReviewForm,
  hideFlashedReviewMessage,
  hideReplyToReviewForm,
  sendReplyToReview,
  setAddonReviews,
  setGroupedRatings,
  setInternalReview,
  setLatestReview,
  setReviewPermissions,
  setReview,
  setReviewReply,
  setReviewWasFlagged,
  setUserReviews,
  showEditReviewForm,
  showReplyToReviewForm,
  unloadAddonReviews,
  updateRatingCounts,
} from 'amo/actions/reviews';
import { REVIEW_FLAG_REASON_SPAM } from 'amo/constants';
import reviewsReducer, {
  addReviewToState,
  changeViewState,
  createGroupedRatings,
  expandReviewObjects,
  getReviewsByUserId,
  initialState,
  makeLatestUserReviewKey,
  reviewListURL,
  reviewsAreLoading,
  selectReviewPermissions,
  selectReviews,
  storeReviewObjects,
} from 'amo/reducers/reviews';
import { DEFAULT_API_PAGE_SIZE } from 'core/api';
import { fakeAddon, fakeReview } from 'tests/unit/helpers';

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
      page: '1',
      pageSize: DEFAULT_API_PAGE_SIZE,
      reviews,
      reviewCount: reviews.length,
      score: null,
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

  function _selectReviews(params = {}) {
    return selectReviews({
      page: '1',
      score: null,
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
      const storedReviews = _selectReviews({
        reviewsState: state,
        addonSlug: fakeAddon.slug,
      }).reviews;
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

      const reviewsState = state;
      expect(
        _selectReviews({ reviewsState, addonSlug: addon1.slug }).reviews[0],
      ).toEqual(review1.id);
      expect(
        _selectReviews({ reviewsState, addonSlug: addon2.slug }).reviews[0],
      ).toEqual(review2.id);
      expect(
        _selectReviews({ reviewsState, addonSlug: addon2.slug }).reviews[1],
      ).toEqual(review3.id);
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

      const reviewsState = newState;
      expect(
        _selectReviews({ reviewsState, addonSlug: 'slug1' }).reviewCount,
      ).toEqual(1);
      expect(
        _selectReviews({ reviewsState, addonSlug: 'slug2' }).reviewCount,
      ).toEqual(2);
    });

    it('stores the score when set', () => {
      const score = '4';
      const action = _setAddonReviews({
        addonSlug: fakeAddon.slug,
        reviews: [{ ...fakeReview, id: 1 }],
        score,
      });
      const state = reviewsReducer(undefined, action);

      expect(state.byAddon[fakeAddon.slug].score).toEqual(score);
    });

    it('stores the score when empty', () => {
      const action = _setAddonReviews({
        addonSlug: fakeAddon.slug,
        reviews: [{ ...fakeReview, id: 1 }],
        score: null,
      });
      const state = reviewsReducer(undefined, action);

      expect(state.byAddon[fakeAddon.slug].score).toEqual(null);
    });

    it('stores the page', () => {
      const page = '4';
      const action = _setAddonReviews({
        addonSlug: fakeAddon.slug,
        page,
        reviews: [{ ...fakeReview, id: 1 }],
      });
      const state = reviewsReducer(undefined, action);

      expect(state.byAddon[fakeAddon.slug].page).toEqual(page);
    });
  });

  describe('unloadAddonReviews', () => {
    const loadReviewDataIntoState = ({
      addonId,
      addonSlug = 'some-slug',
      grouping = createGroupedRatings(),
      permissionsToSet = { canReplyToReviews: true },
      startState,
      reviewId,
      userId,
    }) => {
      const review = {
        ...fakeReview,
        id: reviewId,
        addon: {
          ...fakeReview.addon,
          id: addonId,
          slug: addonSlug,
        },
        user: { id: userId },
      };

      let state = startState;

      // Initialize values into the byId, byAddon, byUserId, groupedRatings and view buckets.
      state = reviewsReducer(state, setReview(review));

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

      state = reviewsReducer(
        state,
        setReviewPermissions({
          addonId,
          userId,
          ...permissionsToSet,
        }),
      );

      return state;
    };

    it('unloads cached review data', () => {
      const reviewId = 111;
      const addonId = 222;
      const addonSlug = 'some-slug';
      const userId = 333;
      const grouping = createGroupedRatings();

      let state = loadReviewDataIntoState({
        addonId,
        addonSlug,
        grouping,
        reviewId,
        userId,
      });

      // Verify that data has been loaded for the reviewId.
      expect(state.byId[reviewId].reviewAddon.id).toEqual(addonId);
      expect(
        _selectReviews({ reviewsState: state, addonSlug }).reviews,
      ).toEqual([reviewId]);
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

    it('unloads cached view data even for deleted reviews', () => {
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

    it('unloads review permissions', () => {
      const addonId = 145;
      const reviewId = 321;
      const userId = 9643;

      let state = loadReviewDataIntoState({
        addonId,
        reviewId,
        permissionsToSet: { canReplyToReviews: true },
        userId,
      });

      expect(
        selectReviewPermissions({ reviewsState: state, addonId, userId }),
      ).toBeDefined();

      state = reviewsReducer(state, unloadAddonReviews({ addonId, reviewId }));

      expect(
        selectReviewPermissions({ reviewsState: state, addonId, userId }),
      ).not.toBeDefined();
    });

    it('preserves unrelated reviews data', () => {
      const reviewId = 111;
      const addonId = 222;
      const addonSlug = 'some-slug';
      const userId = 333;
      const grouping = createGroupedRatings();

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
      expect(
        _selectReviews({ reviewsState: state, addonSlug: addonSlug2 }).reviews,
      ).toEqual([reviewId2]);
      expect(state.byUserId[userId2].reviews).toEqual([reviewId2]);
      expect(state.groupedRatings[addonId2]).toEqual(grouping);
      expect(state.view[reviewId2].someFlag).toEqual(true);

      state = reviewsReducer(state, unloadAddonReviews({ addonId, reviewId }));

      // Verify that the unrelated data has not been unloaded.
      expect(state.byId[reviewId2].reviewAddon.id).toEqual(addonId2);
      expect(
        _selectReviews({ reviewsState: state, addonSlug: addonSlug2 }).reviews,
      ).toEqual([reviewId2]);
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

      const reviewsData = _selectReviews({
        reviewsState: state,
        addonSlug: fakeAddon.slug,
      });
      const expanded = expandReviewObjects({
        state,
        reviews: reviewsData.reviews,
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

  describe('selectReviews', () => {
    it('selects reviews by slug', () => {
      const review1 = { ...fakeReview, id: 1 };
      const review2 = { ...fakeReview, id: 2 };
      const page = '1';
      const pageSize = 13;
      const reviewCount = 2;
      const action = _setAddonReviews({
        addonSlug: fakeAddon.slug,
        page,
        pageSize,
        reviews: [review1, review2],
        reviewCount,
      });
      const reviewsState = reviewsReducer(undefined, action);

      const data = _selectReviews({
        reviewsState,
        addonSlug: fakeAddon.slug,
        page,
      });
      expect(data.reviews).toEqual([review1.id, review2.id]);
      expect(data.pageSize).toEqual(pageSize);
      expect(data.reviewCount).toEqual(reviewCount);
    });

    it('only selects reviews with a matching addonSlug', () => {
      const action = _setAddonReviews({
        addonSlug: 'slug1',
        reviews: [{ ...fakeReview, id: 1 }],
      });
      const reviewsState = reviewsReducer(undefined, action);

      const data = _selectReviews({
        reviewsState,
        addonSlug: 'slug2',
      });
      expect(data).toEqual(null);
    });

    it('only selects reviews with a matching score', () => {
      const score = '5';
      const action = _setAddonReviews({
        addonSlug: fakeAddon.slug,
        reviews: [{ ...fakeReview, id: 1 }],
        score,
      });
      const reviewsState = reviewsReducer(undefined, action);

      const data = _selectReviews({
        reviewsState,
        addonSlug: fakeAddon.slug,
        score: '3',
      });
      expect(data).toEqual(null);
    });

    it('only selects reviews with a matching page', () => {
      const action = _setAddonReviews({
        addonSlug: fakeAddon.slug,
        page: '2',
        reviews: [{ ...fakeReview, id: 1 }],
      });
      const reviewsState = reviewsReducer(undefined, action);

      const data = _selectReviews({
        addonSlug: fakeAddon.slug,
        page: '6',
        reviewsState,
      });
      expect(data).toEqual(null);
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
        showEditReviewForm({ reviewId: review.id }),
      );

      expect(state.view[review.id].editingReview).toEqual(true);
    });

    it('exits beginDeleteAddonReview state', () => {
      const review = { ...fakeReview, id: 837 };

      let state;
      state = reviewsReducer(
        state,
        beginDeleteAddonReview({ reviewId: review.id }),
      );
      state = reviewsReducer(
        state,
        showEditReviewForm({ reviewId: review.id }),
      );

      expect(state.view[review.id].beginningToDeleteReview).toEqual(false);
    });
  });

  describe('showReplyToReviewForm', () => {
    it('stores view state about showing a reply form', () => {
      const review = { ...fakeReview, id: 837 };

      const state = reviewsReducer(
        undefined,
        showReplyToReviewForm({ reviewId: review.id }),
      );

      expect(state.view[review.id].replyingToReview).toEqual(true);
    });

    it('exits beginDeleteAddonReview state', () => {
      const review = { ...fakeReview, id: 837 };

      let state;
      state = reviewsReducer(
        state,
        beginDeleteAddonReview({ reviewId: review.id }),
      );
      state = reviewsReducer(
        state,
        showReplyToReviewForm({ reviewId: review.id }),
      );

      expect(state.view[review.id].beginningToDeleteReview).toEqual(false);
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

  describe('beginDeleteAddonReview', () => {
    it('stores view state about beginning to delete a review', () => {
      const review = { ...fakeReview, id: 837 };

      const state = reviewsReducer(
        undefined,
        beginDeleteAddonReview({ reviewId: review.id }),
      );

      expect(state.view[review.id].beginningToDeleteReview).toEqual(true);
    });
  });

  describe('cancelDeleteAddonReview', () => {
    it('stores view state about cancelling deleting a review', () => {
      const review = { ...fakeReview, id: 837 };

      let state;
      state = reviewsReducer(
        state,
        beginDeleteAddonReview({ reviewId: review.id }),
      );
      state = reviewsReducer(
        state,
        cancelDeleteAddonReview({ reviewId: review.id }),
      );

      expect(state.view[review.id].beginningToDeleteReview).toEqual(false);
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
        beginningToDeleteReview: false,
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
      expect(makeLatestUserReviewKey({ userId: 1, addonId: 2 })).toEqual(
        'user-1/addon-2',
      );
    });
  });

  describe('setLatestReview()', () => {
    const _setLatestReview = ({
      review = { ...fakeReview, id: 1 },
      ...params
    } = {}) => {
      return setLatestReview({
        addonId: 9,
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
      const userId = 3;
      const review = { ...fakeReview, id: 2 };

      let state;
      state = reviewsReducer(state, setReview(review));
      state = reviewsReducer(
        state,
        _setLatestReview({ addonId, userId, review }),
      );

      expect(
        state.latestUserReview[makeLatestUserReviewKey({ addonId, userId })],
      ).toEqual(review.id);
    });

    it('can set the latest review to null', () => {
      const addonId = 1;
      const userId = 3;

      const state = reviewsReducer(
        undefined,
        _setLatestReview({ addonId, userId, review: null }),
      );

      expect(
        state.latestUserReview[makeLatestUserReviewKey({ addonId, userId })],
      ).toBeNull();
    });

    it('preserves other latest reviews', () => {
      const userId = 1;
      const review1 = { ...fakeReview, id: 1 };
      const review2 = { ...fakeReview, id: 2 };

      let state;
      state = reviewsReducer(state, setReview(review1));
      state = reviewsReducer(
        state,
        _setLatestReview({
          userId,
          addonId: 1,
          review: review1,
        }),
      );
      state = reviewsReducer(state, setReview(review2));
      state = reviewsReducer(
        state,
        _setLatestReview({
          userId,
          addonId: 2,
          review: review2,
        }),
      );

      expect(
        state.latestUserReview[makeLatestUserReviewKey({ userId, addonId: 1 })],
      ).toEqual(1);
      expect(
        state.latestUserReview[makeLatestUserReviewKey({ userId, addonId: 2 })],
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

    it('does not reset groupedRatings when adding a new rating', () => {
      const addonId = 44231;
      let state;

      const grouping = createGroupedRatings();
      state = reviewsReducer(
        state,
        setGroupedRatings({
          addonId,
          grouping,
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

      expect(state.groupedRatings[addonId]).toEqual(grouping);
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
      const firstGrouping = createGroupedRatings({ 4: 2, 5: 6 });

      const secondAddonId = 2;
      const secondGrouping = createGroupedRatings({ 3: 3, 4: 4, 5: 4 });

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

      const grouping1 = createGroupedRatings();
      const grouping2 = createGroupedRatings({ 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 });

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

    it('exits beginDeleteAddonReview state', () => {
      const review = { ...fakeReview, id: 837 };

      let state;
      state = reviewsReducer(
        state,
        beginDeleteAddonReview({ reviewId: review.id }),
      );
      state = reviewsReducer(
        state,
        deleteAddonReview({
          addonId: fakeAddon.id,
          errorHandlerId: 'some-id',
          reviewId: review.id,
        }),
      );

      expect(state.view[review.id].beginningToDeleteReview).toEqual(false);
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

  describe('fetchReviewPermissions', () => {
    it('prepares to fetch permissions', () => {
      const addonId = 123;
      const userId = 321;

      const state = reviewsReducer(
        undefined,
        fetchReviewPermissions({
          addonId,
          errorHandlerId: 'some-error-handler',
          userId,
        }),
      );

      const permissions = selectReviewPermissions({
        reviewsState: state,
        addonId,
        userId,
      });
      expect(permissions.loading).toEqual(true);
      expect(permissions.canReplyToReviews).toEqual(null);
    });
  });

  describe('setReviewPermissions', () => {
    it('sets permissions', () => {
      const addonId = 123;
      const userId = 321;

      let state;

      state = reviewsReducer(
        state,
        fetchReviewPermissions({
          addonId,
          errorHandlerId: 'some-error-handler',
          userId,
        }),
      );
      state = reviewsReducer(
        state,
        setReviewPermissions({
          addonId,
          canReplyToReviews: false,
          userId,
        }),
      );

      const permissions = selectReviewPermissions({
        reviewsState: state,
        addonId,
        userId,
      });
      expect(permissions.loading).toEqual(false);
      expect(permissions.canReplyToReviews).toEqual(false);
    });
  });

  describe('selectReviewPermissions', () => {
    it('returns existing results', () => {
      const addonId = 123;
      const userId = 321;

      const state = reviewsReducer(
        undefined,
        fetchReviewPermissions({
          addonId,
          errorHandlerId: 'some-error-handler',
          userId,
        }),
      );

      const permissions = selectReviewPermissions({
        reviewsState: state,
        addonId,
        userId,
      });
      expect(permissions).toEqual({
        loading: true,
        canReplyToReviews: null,
      });
    });

    it('returns undefined for non-existent results', () => {
      const permissions = selectReviewPermissions({
        reviewsState: initialState,
        addonId: 1,
        userId: 2,
      });

      expect(permissions).toEqual(undefined);
    });
  });

  describe('updateRatingCounts', () => {
    const addonId = 1234;

    function initStateWithGrouping(grouping = {}) {
      return reviewsReducer(
        undefined,
        setGroupedRatings({
          addonId,
          grouping: createGroupedRatings(grouping),
        }),
      );
    }

    function reviewWithScore(score) {
      return createInternalReview({ ...fakeReview, score });
    }

    it('increment counts for a new rating', () => {
      const fiveStarCount = 0;

      let state = initStateWithGrouping({ 5: fiveStarCount });

      state = reviewsReducer(
        state,
        updateRatingCounts({
          addonId,
          oldReview: null,
          newReview: reviewWithScore(5),
        }),
      );

      expect(state.groupedRatings[addonId][5]).toEqual(fiveStarCount + 1);
    });

    it('shifts rating counts', () => {
      const oneStarCount = 5;
      const fiveStarCount = 30;

      let state = initStateWithGrouping({
        1: oneStarCount,
        5: fiveStarCount,
      });

      state = reviewsReducer(
        state,
        updateRatingCounts({
          addonId,
          oldReview: reviewWithScore(1),
          newReview: reviewWithScore(5),
        }),
      );

      const grouping = state.groupedRatings[addonId];
      expect(grouping[1]).toEqual(oneStarCount - 1);
      expect(grouping[5]).toEqual(fiveStarCount + 1);
    });

    it('handles no score change', () => {
      const fiveStarCount = 30;

      let state = initStateWithGrouping({ 5: fiveStarCount });

      state = reviewsReducer(
        state,
        updateRatingCounts({
          addonId,
          oldReview: reviewWithScore(5),
          newReview: reviewWithScore(5),
        }),
      );

      expect(state.groupedRatings[addonId][5]).toEqual(fiveStarCount);
    });

    it('automatically initializes grouped ratings', () => {
      const state = reviewsReducer(
        undefined,
        updateRatingCounts({
          addonId,
          oldReview: null,
          newReview: reviewWithScore(3),
        }),
      );

      expect(state.groupedRatings[addonId]).toEqual(
        createGroupedRatings({ 3: 1 }),
      );
    });

    it('does not decrement 0 counts', () => {
      let state = initStateWithGrouping({ 5: 0 });

      state = reviewsReducer(
        state,
        updateRatingCounts({
          addonId,
          oldReview: reviewWithScore(5),
          newReview: reviewWithScore(4),
        }),
      );

      expect(state.groupedRatings[addonId][5]).toEqual(0);
    });

    it('handles a new review without a score', () => {
      const fiveStarCount = 10;
      let state = initStateWithGrouping({ 5: fiveStarCount });

      state = reviewsReducer(
        state,
        updateRatingCounts({
          addonId,
          oldReview: null,
          newReview: reviewWithScore(null),
        }),
      );

      expect(state.groupedRatings[addonId][5]).toEqual(fiveStarCount);
    });
  });

  describe('reviewListURL', () => {
    it('returns a URL using the addon slug', () => {
      const addonSlug = 'adblock-plus';
      expect(reviewListURL({ addonSlug })).toEqual(
        `/addon/${addonSlug}/reviews/`,
      );
    });

    it('returns a URL using the ID', () => {
      const addonSlug = 'adblock-plus';
      const id = 3215;
      expect(reviewListURL({ addonSlug, id })).toEqual(
        `/addon/${addonSlug}/reviews/${id}/`,
      );
    });

    it('returns a URL using the score', () => {
      const addonSlug = 'adblock-plus';
      const score = 5;
      expect(reviewListURL({ addonSlug, score })).toEqual(
        `/addon/${addonSlug}/reviews/?score=${score}`,
      );
    });

    it('returns a URL using the ID and score', () => {
      const addonSlug = 'adblock-plus';
      const id = 4321;
      const score = 5;
      expect(reviewListURL({ addonSlug, id, score })).toEqual(
        `/addon/${addonSlug}/reviews/${id}/?score=${score}`,
      );
    });

    it('returns a URL with a src query parameter', () => {
      const addonSlug = 'adblock-plus';
      const src = 'some-src';
      expect(reviewListURL({ addonSlug, src })).toEqual(
        `/addon/${addonSlug}/reviews/?src=${src}`,
      );
    });

    it('returns a URL with score and src in the query string', () => {
      const addonSlug = 'adblock-plus';
      const score = 5;
      const src = 'some-src';
      expect(reviewListURL({ addonSlug, score, src })).toEqual(
        `/addon/${addonSlug}/reviews/?src=${src}&score=${score}`,
      );
    });
  });
});
