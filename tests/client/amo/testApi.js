import { submitReview } from 'amo/api';
import * as api from 'core/api';
import { signedInApiState } from 'tests/client/amo/helpers';

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
        .then(() => {
          throw new Error('unexpected success');
        })
        .catch((error) => {
          assert.match(error.message, /addonSlug is required/);
        });
    });

    it('posts a new add-on review', () => {
      const params = {
        ...baseParams,
        rating: 5,
        addonSlug: 'chill-out',
        versionId: 321,
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
  });
});
