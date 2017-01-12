import { setReview, setAddonReviews } from 'amo/actions/reviews';
import { fakeAddon, fakeReview } from 'tests/client/amo/helpers';

describe('amo.actions.reviews', () => {
  describe('setReview', () => {
    it('requires a truthy review', () => {
      assert.throws(() => setReview(), /review cannot be empty/);
    });
  });

  describe('setAddonReviews', () => {
    it('requires an addonSlug', () => {
      const reviews = [fakeReview];
      assert.throws(() => setAddonReviews({ reviews }),
                    /addonSlug cannot be empty/);
    });

    it('requires a list of reviews', () => {
      assert.throws(() => setAddonReviews({ addonSlug: fakeAddon.slug }),
                    /reviews must be an Array/);
    });
  });
});
