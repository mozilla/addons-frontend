import {
  REVIEW_FLAG_REASON_OTHER,
  REVIEW_FLAG_REASON_SPAM,
} from 'amo/constants';
import {
  deleteReview,
  flagReview,
  getLatestUserReview,
  getReview,
  getReviews,
  replyToReview,
  submitReview,
} from 'amo/api/reviews';
import * as api from 'amo/api';
import {
  apiResponsePage,
  createStubErrorHandler,
  dispatchSignInActions,
  fakeReview,
  unexpectedSuccess,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let mockApi;
  let apiState;

  beforeEach(() => {
    mockApi = sinon.mock(api);
    apiState = dispatchSignInActions().state.api;
  });

  const getReviewsResponse = ({ reviews = [{ ...fakeReview }] } = {}) => {
    return apiResponsePage({ results: reviews });
  };

  describe('submitReview', () => {
    // These are all the default values for fields that can be posted to the
    // endpoint.
    const defaultParams = {
      addon: undefined,
      body: undefined,
      score: undefined,
      version: undefined,
    };
    const baseParams = {
      apiState,
    };
    const submitReviewResponse = (review = { ...fakeReview }) => {
      return review;
    };

    it('requires an addonId when posting', async () => {
      const params = {
        ...baseParams,
        addonId: null,
      };

      // This needs to be a promise chain because of
      // https://github.com/facebook/jest/issues/3601
      await submitReview(params).then(unexpectedSuccess, (error) => {
        expect(error.message).toMatch(/addonId is required/);
      });
    });

    it('posts a new add-on review', async () => {
      const params = {
        ...baseParams,
        score: 5,
        addonId: 445,
        versionId: 321,
        errorHandler: sinon.stub(),
      };

      const fakeResponse = submitReviewResponse();
      mockApi
        .expects('callApi')
        .withArgs({
          endpoint: 'ratings/rating',
          body: {
            ...defaultParams,
            addon: params.addonId,
            score: params.score,
            version: params.versionId,
          },
          method: 'POST',
          auth: true,
          apiState: params.apiState,
          errorHandler: params.errorHandler,
        })
        .returns(Promise.resolve(fakeResponse));

      const apiResponse = await submitReview(params);
      expect(apiResponse).toEqual(fakeResponse);
      mockApi.verify();
    });

    it('patches an existing add-on review', async () => {
      const params = {
        ...baseParams,
        body: 'some new body',
        reviewId: 987,
      };

      const fakeResponse = submitReviewResponse();
      mockApi
        .expects('callApi')
        .withArgs({
          endpoint: `ratings/rating/${params.reviewId}`,
          body: {
            ...defaultParams,
            body: params.body,
          },
          method: 'PATCH',
          auth: true,
          apiState: params.apiState,
        })
        .returns(Promise.resolve(fakeResponse));

      const apiResponse = await submitReview(params);
      expect(apiResponse).toEqual(fakeResponse);
      mockApi.verify();
    });

    it('does not patch the version for existing reviews', async () => {
      const params = {
        ...baseParams,
        reviewId: 987,
        body: 'some new body',
        versionId: 99876,
      };

      mockApi
        .expects('callApi')
        .withArgs({
          endpoint: `ratings/rating/${params.reviewId}`,
          body: {
            // Make sure that version is not passed in.
            ...defaultParams,
            body: params.body,
            version: undefined,
          },
          method: 'PATCH',
          auth: true,
          apiState: params.apiState,
        })
        .returns(Promise.resolve(submitReviewResponse()));

      await submitReview(params);
      mockApi.verify();
    });
  });

  describe('getReviews', () => {
    it('allows you to fetch reviews with filters', async () => {
      const params = {
        user: 123,
        addon: 321,
        score: 5,
      };
      const fakeResponse = getReviewsResponse({ reviews: [fakeReview] });
      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: 'ratings/rating',
          params,
          apiState: undefined,
        })
        .returns(Promise.resolve(fakeResponse));

      const response = await getReviews(params);
      expect(response).toEqual(fakeResponse);
      mockApi.verify();
    });

    it('passes api state to callApi', async () => {
      const params = { addon: 321, user: 123 };
      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: 'ratings/rating',
          params,
          apiState,
        })
        .returns(Promise.resolve(getReviewsResponse()));

      await getReviews({
        ...params,
        apiState,
      });
      mockApi.verify();
    });
  });

  describe('getLatestUserReview', () => {
    it('returns the lone review result since that is the latest', async () => {
      const params = { user: 123, addon: 321 };
      const expectedReview = { ...fakeReview, id: 34 };
      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: 'ratings/rating',
          // Make sure it filters with the correct params:
          params: {
            addon: params.addon,
            user: params.user,
          },
          apiState: undefined,
        })
        .resolves(
          getReviewsResponse({
            reviews: [expectedReview],
          }),
        );

      const review = await getLatestUserReview(params);
      mockApi.verify();
      expect(review).toEqual(expectedReview);
    });

    it('throws an error if multple reviews are received', async () => {
      mockApi.expects('callApi').resolves(
        getReviewsResponse({
          // In real life, the API should never return multiple reviews like this.
          reviews: [
            { ...fakeReview, id: 1 },
            { ...fakeReview, id: 2 },
          ],
        }),
      );

      await getLatestUserReview({
        user: 123,
        addon: fakeReview.addon.id,
      }).then(unexpectedSuccess, (error) => {
        expect(error.message).toMatch(/received multiple review objects/);
      });
    });

    it('returns latest review as null when there are no reviews at all', async () => {
      mockApi.expects('callApi').resolves(getReviewsResponse({ reviews: [] }));

      const review = await getLatestUserReview({
        user: 123,
        addon: 321,
      });
      expect(review).toBe(null);
    });
  });

  describe('replyToReview', () => {
    const replyToReviewResponse = (review = { ...fakeReview }) => {
      return review;
    };

    it('calls the API', async () => {
      const originalReview = { ...fakeReview, id: 321 };
      const fakeResponse = replyToReviewResponse();

      const body = 'this is a reply to the review';
      const errorHandler = createStubErrorHandler();

      mockApi
        .expects('callApi')
        .withArgs({
          endpoint: `ratings/rating/${originalReview.id}/reply/`,
          errorHandler,
          body: {
            body,
          },
          method: 'POST',
          auth: true,
          apiState,
        })
        .returns(Promise.resolve(fakeResponse));

      await replyToReview({
        apiState,
        body,
        errorHandler,
        originalReviewId: originalReview.id,
      });
      mockApi.verify();
    });
  });

  describe('flagReview', () => {
    const defaultParams = () => {
      return {
        apiState,
        reason: REVIEW_FLAG_REASON_SPAM,
        reviewId: fakeReview.id,
      };
    };

    it('calls the API', async () => {
      const params = {
        ...defaultParams(),
        errorHandler: createStubErrorHandler(),
      };

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: `ratings/rating/${params.reviewId}/flag`,
          errorHandler: params.errorHandler,
          body: {
            flag: params.reason,
            note: undefined,
          },
          method: 'POST',
          apiState: params.apiState,
        })
        .returns(Promise.resolve());

      await flagReview(params);
      mockApi.verify();
    });

    it('requires a reviewId', async () => {
      const params = defaultParams();
      delete params.reviewId;

      mockApi.expects('callApi').returns(Promise.resolve());

      await flagReview(params).then(unexpectedSuccess, (error) => {
        expect(error.message).toMatch(/reviewId parameter is required/);
      });
    });

    it('requires a reason', async () => {
      const params = defaultParams();
      delete params.reason;

      mockApi.expects('callApi').returns(Promise.resolve());

      await flagReview(params).then(unexpectedSuccess, (error) => {
        expect(error.message).toMatch(/reason parameter is required/);
      });
    });

    it('requires a note when the reason is other', async () => {
      const params = {
        ...defaultParams(),
        reason: REVIEW_FLAG_REASON_OTHER,
        note: undefined,
      };

      mockApi.expects('callApi').returns(Promise.resolve());

      await flagReview(params).then(unexpectedSuccess, (error) => {
        expect(error.message).toMatch(/note parameter is required/);
      });
    });
  });

  describe('deleteReview', () => {
    it('calls the API', async () => {
      const params = {
        apiState,
        errorHandler: createStubErrorHandler(),
        reviewId: fakeReview.id,
      };

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: `ratings/rating/${params.reviewId}/`,
          errorHandler: params.errorHandler,
          method: 'DELETE',
          apiState: params.apiState,
        })
        .returns(Promise.resolve());

      await deleteReview(params);
      mockApi.verify();
    });
  });

  describe('getReview', () => {
    it('calls the API', async () => {
      const params = {
        apiState,
        reviewId: fakeReview.id,
      };
      const fakeResponse = getReviewsResponse({ reviews: [fakeReview] });

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: `ratings/rating/${params.reviewId}/`,
          method: 'GET',
          apiState: params.apiState,
        })
        .resolves(fakeResponse);

      const response = await getReview(params);
      mockApi.verify();
      expect(response).toEqual(fakeResponse);
    });
  });
});
