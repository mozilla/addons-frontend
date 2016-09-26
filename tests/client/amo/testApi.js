import { postRating } from 'amo/api';
import * as api from 'core/api';

// TODO: move to fixture
const signedInApiState = {
  lang: 'en-US',
  token: 'secret-token',
};

describe('amo.api', () => {
  let mockApi;

  beforeEach(() => {
    mockApi = sinon.mock(api);
  });

  describe('postRatings', () => {
    it('posts a add-on rating', () => {
      const params = {
        rating: 5,
        apiState: { ...signedInApiState, token: 'new-token' },
        addonID: 123456,
        versionID: 321,
      };
      const genericApiResponse = { field: 'value' };

      mockApi
        .expects('callApi')
        .withArgs({
          endpoint: `addons/addon/${params.addonID}/reviews`,
          body: { rating: params.rating, version: params.versionID },
          method: 'post',
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
