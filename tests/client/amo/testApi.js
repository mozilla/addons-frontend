import { postRating } from 'amo/api';
import * as api from 'core/api';
import { signedInApiState } from 'tests/client/amo/helpers';

describe('amo.api', () => {
  let mockApi;

  beforeEach(() => {
    mockApi = sinon.mock(api);
  });

  describe('postRatings', () => {
    // These are all the default values for fields that can be posted to the
    // endpoint.
    const defaultParams = {
      rating: undefined,
      version: undefined,
      body: undefined,
    };
    const baseParams = {
      apiState: { ...signedInApiState, token: 'new-token' },
    };
    // This is just a generic API response that does not
    // look like an error to callApi().
    const genericApiResponse = { field: 'value' };

    it('requires an addonId', () => {
      const params = {
        ...baseParams,
        addonId: null,
      };

      return postRating(params)
        .then(() => {
          throw new Error('unexpected success');
        })
        .catch((error) => {
          assert.match(error.message, /addonId is required/);
        });
    });

    it('posts a new add-on review', () => {
      const params = {
        ...baseParams,
        rating: 5,
        addonId: 123456,
        versionId: 321,
      };

      mockApi
        .expects('callApi')
        .withArgs({
          endpoint: `addons/addon/${params.addonId}/reviews`,
          body: {
            ...defaultParams, rating: params.rating, version: params.versionId,
          },
          method: 'POST',
          auth: true,
          state: params.apiState,
        })
        .returns(Promise.resolve(genericApiResponse));

      return postRating(params).then((apiResponse) => {
        assert.deepEqual(apiResponse, genericApiResponse);
        mockApi.verify();
      });
    });

    it('patches an existing add-on review', () => {
      const params = {
        ...baseParams,
        body: 'some new body',
        reviewId: 987,
        addonId: 123456,
      };

      mockApi
        .expects('callApi')
        .withArgs({
          endpoint: `addons/addon/${params.addonId}/reviews/${params.reviewId}`,
          body: {
            ...defaultParams, body: params.body,
          },
          method: 'PATCH',
          auth: true,
          state: params.apiState,
        })
        .returns(Promise.resolve(genericApiResponse));

      return postRating(params).then((apiResponse) => {
        assert.deepEqual(apiResponse, genericApiResponse);
        mockApi.verify();
      });
    });
  });
});
