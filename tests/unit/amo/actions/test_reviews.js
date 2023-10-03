import {
  SET_INTERNAL_REVIEW,
  createInternalReview,
  fetchReviews,
  flagReview,
  reviewIdAction,
  sendReplyToReview,
  setInternalReview,
  setReviewWasFlagged,
  setReviewReply,
} from 'amo/actions/reviews';
import { REVIEW_FLAG_REASON_SPAM } from 'amo/constants';
import { fakeAddon, fakeReview } from 'tests/unit/helpers';

// See reducer tests for more coverage of review actions.
describe(__filename, () => {
  describe('fetchReviews', () => {
    const defaultParams = Object.freeze({
      addonSlug: fakeAddon.slug,
      errorHandlerId: 'some-error-handler-id',
      page: '1',
    });

    it('requires a truthy add-on slug', () => {
      const params = { ...defaultParams };
      delete params.addonSlug;
      expect(() => fetchReviews(params)).toThrow(/addonSlug cannot be empty/);
    });

    it('requires a truthy error handler ID', () => {
      const params = { ...defaultParams };
      delete params.errorHandlerId;
      expect(() => fetchReviews(params)).toThrow(
        /errorHandlerId cannot be empty/,
      );
    });

    it('defaults to page 1', () => {
      const params = { ...defaultParams };
      delete params.page;
      expect(fetchReviews(params)).toMatchObject({ payload: { page: '1' } });
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

      expect(() => setReviewReply(params)).toThrow(
        /originalReviewId parameter is required/,
      );
    });

    it('requires a reply', () => {
      const params = defaultParams();
      delete params.reply;

      expect(() => setReviewReply(params)).toThrow(
        /reply parameter is required/,
      );
    });
  });

  describe('setInternalReview', () => {
    it('requires a truthy review', () => {
      expect(() => setInternalReview()).toThrow(/review cannot be empty/);
    });

    it('creates an action with the exact review object', () => {
      const review = createInternalReview(fakeReview, 'en-US');
      const action = setInternalReview(review);
      expect(action.payload).toEqual(review);
    });

    it('sets an action type', () => {
      const action = setInternalReview(
        createInternalReview(fakeReview, 'en-US'),
      );
      expect(action.type).toEqual(SET_INTERNAL_REVIEW);
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

      expect(() => sendReplyToReview(params)).toThrow(
        /errorHandlerId parameter is required/,
      );
    });

    it('requires an originalReviewId', () => {
      const params = defaultParams();
      delete params.originalReviewId;

      expect(() => sendReplyToReview(params)).toThrow(
        /originalReviewId parameter is required/,
      );
    });

    it('requires a body', () => {
      const params = defaultParams();
      delete params.body;

      expect(() => sendReplyToReview(params)).toThrow(
        /body parameter is required/,
      );
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
      expect(() => reviewIdAction({ type: 'SOME_TYPE' })).toThrow(
        /reviewId parameter is required/,
      );
    });
  });

  describe('flagReview', () => {
    const defaultParams = () => {
      return {
        errorHandlerId: 'some-id',
        reason: REVIEW_FLAG_REASON_SPAM,
        reviewId: fakeReview.id,
      };
    };

    it('requires an errorHandlerId', () => {
      const params = defaultParams();
      delete params.errorHandlerId;

      expect(() => flagReview(params)).toThrow(
        /errorHandlerId parameter is required/,
      );
    });

    it('requires a reason', () => {
      const params = defaultParams();
      delete params.reason;

      expect(() => flagReview(params)).toThrow(/reason parameter is required/);
    });

    it('requires a reviewId', () => {
      const params = defaultParams();
      delete params.reviewId;

      expect(() => flagReview(params)).toThrow(
        /reviewId parameter is required/,
      );
    });
  });

  describe('setReviewWasFlagged', () => {
    const defaultParams = () => {
      return {
        reason: REVIEW_FLAG_REASON_SPAM,
        reviewId: fakeReview.id,
      };
    };

    it('requires a reason', () => {
      const params = defaultParams();
      delete params.reason;

      expect(() => setReviewWasFlagged(params)).toThrow(
        /reason parameter is required/,
      );
    });

    it('requires a reviewId', () => {
      const params = defaultParams();
      delete params.reviewId;

      expect(() => setReviewWasFlagged(params)).toThrow(
        /reviewId parameter is required/,
      );
    });
  });
});
