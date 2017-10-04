import {
  denormalizeReview,
  fetchReviews,
  reviewIdAction,
  sendReplyToReview,
  setDenormalizedReview,
  setReview,
  setReviewReply,
  setAddonReviews,
} from 'amo/actions/reviews';
import { SET_REVIEW } from 'amo/constants';
import { fakeAddon, fakeReview } from 'tests/unit/amo/helpers';

// See reducer tests for more coverage of review actions.
describe(__filename, () => {
  describe('fetchReviews', () => {
    const defaultParams = Object.freeze({
      addonSlug: fakeAddon.slug,
      errorHandlerId: 'some-error-handler-id',
      page: 1,
    });

    it('requires a truthy add-on slug', () => {
      const params = { ...defaultParams };
      delete params.addonSlug;
      expect(() => fetchReviews(params))
        .toThrowError(/addonSlug cannot be empty/);
    });

    it('requires a truthy error handler ID', () => {
      const params = { ...defaultParams };
      delete params.errorHandlerId;
      expect(() => fetchReviews(params))
        .toThrowError(/errorHandlerId cannot be empty/);
    });

    it('defaults to page 1', () => {
      const params = { ...defaultParams };
      delete params.page;
      expect(fetchReviews(params)).toMatchObject({ payload: { page: 1 } });
    });
  });

  describe('setReview', () => {
    it('requires a truthy review', () => {
      expect(() => setReview()).toThrowError(/review cannot be empty/);
    });

    it('denormalizes a review', () => {
      const action = setReview(fakeReview);
      expect(action.payload).toEqual(denormalizeReview(fakeReview));
    });

    it('sets an action type', () => {
      const action = setReview(fakeReview);
      expect(action.type).toEqual(SET_REVIEW);
    });
  });

  describe('setReviewReply', () => {
    const defaultParams = () => {
      return {
        originalReviewId: fakeReview.id,
        reply: { ...fakeReview, id: 321, body: 'Some reply' },
      };
    };

    it('requires an originalReviewId', () => {
      const params = defaultParams();
      delete params.originalReviewId;

      expect(() => setReviewReply(params))
        .toThrow(/originalReviewId parameter is required/);
    });

    it('requires a reply', () => {
      const params = defaultParams();
      delete params.reply;

      expect(() => setReviewReply(params))
        .toThrow(/reply parameter is required/);
    });
  });

  describe('setDenormalizedReview', () => {
    it('requires a truthy review', () => {
      expect(() => setDenormalizedReview()).toThrowError(/review cannot be empty/);
    });

    it('creates an action with the exact review object', () => {
      const review = denormalizeReview(fakeReview);
      const action = setDenormalizedReview(review);
      expect(action.payload).toEqual(review);
    });

    it('sets an action type', () => {
      const action = setDenormalizedReview(denormalizeReview(fakeReview));
      expect(action.type).toEqual(SET_REVIEW);
    });
  });

  describe('setAddonReviews', () => {
    const defaultParams = {
      reviews: [fakeReview],
      reviewCount: 1,
      addonSlug: fakeAddon.slug,
    };

    it('requires an addonSlug', () => {
      const params = { ...defaultParams };
      delete params.addonSlug;
      expect(() => setAddonReviews(params)).toThrowError(/addonSlug cannot be empty/);
    });

    it('requires a list of reviews', () => {
      const params = { ...defaultParams };
      delete params.reviews;
      expect(() => setAddonReviews(params)).toThrowError(/reviews must be an Array/);
    });

    it('requires a count of reviews', () => {
      const params = { ...defaultParams };
      delete params.reviewCount;
      expect(() => setAddonReviews(params)).toThrowError(/reviewCount must be set/);
    });
  });

  describe('sendReplyToReview', () => {
    const defaultParams = () => ({
      errorHandlerId: 'some-error-handler-id',
      originalReviewId: fakeReview.id,
      body: 'This is a review reply',
      title: undefined,
    });

    it('requires an errorHandlerId', () => {
      const params = defaultParams();
      delete params.errorHandlerId;

      expect(() => sendReplyToReview(params))
        .toThrow(/errorHandlerId parameter is required/);
    });

    it('requires an originalReviewId', () => {
      const params = defaultParams();
      delete params.originalReviewId;

      expect(() => sendReplyToReview(params))
        .toThrow(/originalReviewId parameter is required/);
    });

    it('requires a body', () => {
      const params = defaultParams();
      delete params.body;

      expect(() => sendReplyToReview(params))
        .toThrow(/body parameter is required/);
    });
  });

  describe('reviewIdAction', () => {
    it('creates an action', () => {
      const type = 'SOME_TYPE';
      const reviewId = 9876;
      expect(reviewIdAction({ type, reviewId })).toEqual({
        type,
        payload: { reviewId },
      });
    });

    it('requires a reviewId', () => {
      expect(() => reviewIdAction({ type: 'SOME_TYPE' }))
        .toThrow(/reviewId parameter is required/);
    });
  });
});
