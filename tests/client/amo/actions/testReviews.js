import {
  denormalizeReview,
  setDenormalizedReview,
  setReview,
  setAddonReviews,
} from 'amo/actions/reviews';
import { SET_REVIEW } from 'amo/constants';
import { fakeAddon, fakeReview } from 'tests/client/amo/helpers';

// See reducer tests for more coverage of review actions.
describe('amo.actions.reviews', () => {
  describe('setReview', () => {
    it('requires a truthy review', () => {
      expect(() => setReview()).toThrow();
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
      expect(() => setDenormalizedReview()).toThrow();
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
      expect(() => setAddonReviews(params)).toThrow();
    });

    it('requires a list of reviews', () => {
      const params = { ...defaultParams };
      delete params.reviews;
      expect(() => setAddonReviews(params)).toThrow();
    });

    it('requires a count of reviews', () => {
      const params = { ...defaultParams };
      delete params.reviewCount;
      expect(() => setAddonReviews(params)).toThrow();
    });
  });
});
