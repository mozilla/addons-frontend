import {
  getLatestUserReview,
  getReviews,
  submitReview,
} from 'amo/api';
import * as api from 'core/api';
import { unexpectedSuccess } from 'tests/client/helpers';
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
      addon: undefined,
      body: undefined,
      rating: undefined,
      title: undefined,
      version: undefined,
    };
    const baseParams = {
      apiState: { ...signedInApiState, token: 'new-token' },
    };
    // This is just a generic API response that does not
    // look like an error to callApi().
    const genericApiResponse = { field: 'value' };

    it('requires an addonId when posting', () => {
      const params = {
        ...baseParams,
        addonId: null,
      };

      return submitReview(params)
        .then(unexpectedSuccess, (error) => {
          assert.match(error.message, /addonId is required/);
        });
    });

    it('posts a new add-on review', () => {
      const params = {
        ...baseParams,
        rating: 5,
        addonId: 445,
        versionId: 321,
        errorHandler: sinon.stub(),
      };

      mockApi
        .expects('callApi')
        .withArgs({
          endpoint: 'reviews/review',
          body: {
            ...defaultParams,
            addon: params.addonId,
            rating: params.rating,
            version: params.versionId,
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
      };

      mockApi
        .expects('callApi')
        .withArgs({
          endpoint: `reviews/review/${params.reviewId}`,
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
      };

      mockApi
        .expects('callApi')
        .withArgs({
          endpoint: `reviews/review/${params.reviewId}`,
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

  describe('getReviews', () => {
    it('allows you to fetch reviews by any param', () => {
      const params = {
        user: 123, addon: 321, show_grouped_ratings: 1,
      };
      mockApi
        .expects('callApi')
        .withArgs({ endpoint: 'reviews/review', params })
        .returns(Promise.resolve({ results: [fakeReview] }));

      return getReviews(params)
        .then((response) => {
          assert.deepEqual(response.results, [fakeReview]);
          mockApi.verify();
        });
    });

    it('requires a user or addon', () => {
      mockApi
        .expects('callApi')
        .returns(Promise.resolve({ results: [fakeReview] }));

      return getReviews()
        .then(unexpectedSuccess, (error) => {
          assert.match(error.message, /user or addon must be specified/);
        });
    });
  });

  describe('getLatestUserReview', () => {
    it('returns the lone review result since that is the latest', () => {
      const params = { user: 123, addon: 321, version: 456 };
      mockApi
        .expects('callApi')
        .withArgs({
          endpoint: 'reviews/review',
          // Make sure it filters with the correct params:
          params: {
            addon: params.addon,
            user: params.user,
            version: params.version,
          },
        })
        .returns(Promise.resolve({ results: [fakeReview] }));

      return getLatestUserReview(params)
        .then((review) => {
          assert.deepEqual(review, fakeReview);
        });
    });

    it('throws an error if multple reviews are received', () => {
      mockApi
        .expects('callApi')
        .returns(Promise.resolve({
          // In real life, the API should never return multiple reviews like this.
          results: [
            fakeReview,
            { id: 456, ...fakeReview },
          ],
        }));

      return getLatestUserReview({
        user: 123, addon: fakeReview.addon.id, version: fakeReview.version.id,
      })
        .then(unexpectedSuccess, (error) => {
          assert.match(error.message, /received multiple review objects/);
        });
    });

    it('returns latest review as null when there are no reviews at all', () => {
      mockApi
        .expects('callApi')
        .returns(Promise.resolve({ results: [] }));

      return getLatestUserReview({ user: 123, addon: 321, version: 456 })
        .then((review) => {
          assert.strictEqual(review, null);
        });
    });

    it('requires user, addon, and version', () => {
      mockApi
        .expects('callApi')
        .returns(Promise.resolve({ results: [] }));

      return getLatestUserReview()
        .then(unexpectedSuccess, (error) => {
          assert.match(
            error.message, /user, addon, and version must be specified/);
        });
    });

    it('requires addon and version', () => {
      mockApi
        .expects('callApi')
        .returns(Promise.resolve({ results: [] }));

      return getLatestUserReview({ user: 123 })
        .then(unexpectedSuccess, (error) => {
          assert.match(
            error.message, /user, addon, and version must be specified/);
        });
    });

    it('requires a version', () => {
      mockApi
        .expects('callApi')
        .returns(Promise.resolve({ results: [] }));

      return getLatestUserReview({ addon: 321, user: 123 })
        .then(unexpectedSuccess, (error) => {
          assert.match(
            error.message, /user, addon, and version must be specified/);
        });
    });
  });
});
