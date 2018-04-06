import {
  denormalizeReview,
  fetchReviews,
  reviewIdAction,
  setDenormalizedReview,
  setReview,
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

  describe('reviewIdAction', () => {
    it('creates an action', () => {
      const type = 'SOME_TYPE';
      const reviewId = 9876;
      expect(reviewIdAction({ type, reviewId })).toEqual({
        type,
        payload: { reviewId },
      });
    });
  });
});
