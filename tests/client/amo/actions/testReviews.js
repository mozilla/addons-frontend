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
      assert.throws(() => setReview(), /review cannot be empty/);
    });

    it('denormalizes a review', () => {
      const action = setReview(fakeReview);
      assert.deepEqual(action.payload,
                       denormalizeReview(fakeReview));
    });

    it('sets an action type', () => {
      const action = setReview(fakeReview);
      assert.equal(action.type, SET_REVIEW);
    });
  });

  describe('setDenormalizedReview', () => {
    it('requires a truthy review', () => {
      assert.throws(() => setDenormalizedReview(), /review cannot be empty/);
    });

    it('creates an action with the exact review object', () => {
      const review = denormalizeReview(fakeReview);
      const action = setDenormalizedReview(review);
      assert.deepEqual(action.payload, review);
    });

    it('sets an action type', () => {
      const action = setDenormalizedReview(denormalizeReview(fakeReview));
      assert.equal(action.type, SET_REVIEW);
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
      assert.throws(() => setAddonReviews(params), /addonSlug cannot be empty/);
    });

    it('requires a list of reviews', () => {
      const params = { ...defaultParams };
      delete params.reviews;
      assert.throws(() => setAddonReviews(params), /reviews must be an Array/);
    });

    it('requires a count of reviews', () => {
      const params = { ...defaultParams };
      delete params.reviewCount;
      assert.throws(() => setAddonReviews(params), /reviewCount must be set/);
    });
  });
});
