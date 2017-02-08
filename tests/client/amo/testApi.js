/* eslint-disable arrow-body-style */
import {
  getAddonReviews,
  getLatestUserReview,
  getUserReviews,
  submitReview,
} from 'amo/api';
import * as api from 'core/api';
import { fakeReview, signedInApiState } from 'tests/client/amo/helpers';

describe('amo.api', () => {
  let mockApi;

  beforeEach(() => {
    mockApi = sinon.mock(api);
  });

  describe('submitReview', () => {
    // These are all the default values for fields that can be posted to the
    // endpoint.
    const defaultParams = {
      rating: undefined,
      version: undefined,
      body: undefined,
      title: undefined,
    };
    const baseParams = {
      apiState: { ...signedInApiState, token: 'new-token' },
    };
    // This is just a generic API response that does not
    // look like an error to callApi().
    const genericApiResponse = { field: 'value' };

    it('requires an addonSlug', () => {
      const params = {
        ...baseParams,
        addonSlug: null,
      };

      return submitReview(params)
        .then(() => assert(false, 'unexpected success'), (error) => {
          assert.match(error.message, /addonSlug is required/);
        });
    });

    it('posts a new add-on review', () => {
      const params = {
        ...baseParams,
        rating: 5,
        addonSlug: 'chill-out',
        versionId: 321,
        errorHandler: sinon.stub(),
      };

      mockApi
        .expects('callApi')
        .withArgs({
          endpoint: `addons/addon/${params.addonSlug}/reviews`,
          body: {
            ...defaultParams, rating: params.rating, version: params.versionId,
          },
          method: 'POST',
          auth: true,
          state: params.apiState,
          errorHandler: params.errorHandler,
        })
        .returns(Promise.resolve(genericApiResponse));

      return submitReview(params).then((apiResponse) => {
        assert.deepEqual(apiResponse, genericApiResponse);
        mockApi.verify();
      });
    });

    it('patches an existing add-on review', () => {
      const params = {
        ...baseParams,
        body: 'some new body',
        reviewId: 987,
        addonSlug: 'chill-out',
      };

      mockApi
        .expects('callApi')
        .withArgs({
          endpoint: `addons/addon/${params.addonSlug}/reviews/${params.reviewId}`,
          body: {
            ...defaultParams, body: params.body,
          },
          method: 'PATCH',
          auth: true,
          state: params.apiState,
        })
        .returns(Promise.resolve(genericApiResponse));

      return submitReview(params).then((apiResponse) => {
        assert.deepEqual(apiResponse, genericApiResponse);
        mockApi.verify();
      });
    });

    it('does not patch the version for existing reviews', () => {
      const params = {
        ...baseParams,
        reviewId: 987,
        body: 'some new body',
        versionId: 99876,
        addonSlug: 'chill-out',
      };

      mockApi
        .expects('callApi')
        .withArgs({
          endpoint: `addons/addon/${params.addonSlug}/reviews/${params.reviewId}`,
          body: {
            // Make sure that version is not passed in.
            ...defaultParams, body: params.body, version: undefined,
          },
          method: 'PATCH',
          auth: true,
          state: params.apiState,
        })
        .returns(Promise.resolve(genericApiResponse));

      return submitReview(params).then(() => {
        mockApi.verify();
      });
    });
  });

  describe('getUserReviews', () => {
    it('gets all user reviews', () => {
      const userId = 8877;
      const reviewList = [fakeReview];
      const response = { results: reviewList };
      mockApi
        .expects('callApi')
        .withArgs({
          endpoint: `accounts/account/${userId}/reviews`,
        })
        .returns(Promise.resolve(response));

      return getUserReviews({ userId })
        .then((reviews) => {
          mockApi.verify();
          assert.deepEqual(reviews, reviewList);
        });
    });

    it('requires a user ID', () => {
      mockApi.expects('callApi').never();
      return getUserReviews()
        .then(() => assert(false, 'unexpected success'), (error) => {
          assert.equal(error.message, 'userId cannot be falsey');
          mockApi.verify();
        });
    });

    it('does not support paging yet', () => {
      mockApi
        .expects('callApi')
        .returns(Promise.resolve({
          results: [],
          next: '/reviews/next-page/',
        }));

      // This will log a warning so just make sure it doesn't throw.
      return getUserReviews({ userId: 123 });
    });

    it('allows you to fetch reviews for a specific add-on', () => {
      mockApi
        .expects('callApi')
        .returns(Promise.resolve({
          results: [
            fakeReview,
            // This review should be ignored.
            { ...fakeReview, addon: { ...fakeReview.addon, id: 33998 } },
          ],
        }));

      return getUserReviews({ userId: 123, addonId: fakeReview.addon.id })
        .then((reviews) => {
          assert.deepEqual(reviews, [fakeReview]);
        });
    });
  });

  describe('getAddonReviews', () => {
    it('gets all add-on reviews', () => {
      const addonSlug = 'ublock';
      const reviewList = [fakeReview];
      const response = { results: reviewList };
      mockApi
        .expects('callApi')
        .once()
        .withArgs({
          method: 'GET',
          endpoint: `addons/addon/${addonSlug}/reviews`,
        })
        .returns(Promise.resolve(response));

      return getAddonReviews({ addonSlug })
        .then((reviews) => {
          mockApi.verify();
          assert.deepEqual(reviews, reviewList);
        });
    });

    it('requires a truthy addonSlug', () => {
      return getAddonReviews()
        .then(() => assert(false, 'Unexpected success'), (error) => {
          assert.match(error.message, /addonSlug cannot be falsey/);
        });
    });

    it('does not support paging yet', () => {
      mockApi
        .expects('callApi')
        .returns(Promise.resolve({
          results: [],
          next: '/reviews/next-page/',
        }));

      // This will log a warning so just make sure it doesn't throw.
      return getAddonReviews({ addonSlug: 'ublock' });
    });
  });

  describe('getLatestUserReview', () => {
    it('allows you to fetch only the latest review', () => {
      const latestReview = { ...fakeReview, is_latest: true };
      mockApi
        .expects('callApi')
        .returns(Promise.resolve({
          results: [
            fakeReview,
            latestReview,
          ],
        }));

      return getLatestUserReview({
        userId: 123,
        addonId: fakeReview.addon.id,
      })
        .then((review) => {
          assert.deepEqual(review, latestReview);
        });
    });

    it('returns latest review as null when there are no reviews at all', () => {
      mockApi
        .expects('callApi')
        .returns(Promise.resolve({ results: [] }));

      return getLatestUserReview({
        userId: 123,
      })
        .then((review) => {
          assert.strictEqual(review, null);
        });
    });
  });
});
