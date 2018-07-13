import {
  REVIEW_FLAG_REASON_OTHER,
  REVIEW_FLAG_REASON_SPAM,
} from 'amo/constants';
import {
  flagReview,
  getLatestUserReview,
  getReviews,
  replyToReview,
  submitReview,
} from 'amo/api/reviews';
import * as api from 'core/api';
import {
  apiResponsePage,
  createStubErrorHandler,
  unexpectedSuccess,
} from 'tests/unit/helpers';
import { dispatchSignInActions, fakeReview } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  let mockApi;
  let signedInApiState;

  beforeEach(() => {
    mockApi = sinon.mock(api);
    signedInApiState = dispatchSignInActions().state.api;
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
      rating: undefined,
      title: undefined,
      version: undefined,
    };
    const baseParams = {
      apiState: signedInApiState,
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
        rating: 5,
        addonId: 445,
        versionId: 321,
        errorHandler: sinon.stub(),
      };

      const fakeResponse = submitReviewResponse();
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
          endpoint: `reviews/review/${params.reviewId}`,
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
          endpoint: `reviews/review/${params.reviewId}`,
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
        show_grouped_ratings: 1,
      };
      const fakeResponse = getReviewsResponse({ reviews: [fakeReview] });
      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: 'reviews/review',
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
          endpoint: 'reviews/review',
          params,
          apiState: signedInApiState,
        })
        .returns(Promise.resolve(getReviewsResponse()));

      await getReviews({
        ...params,
        apiState: signedInApiState,
      });
      mockApi.verify();
    });

    it('requires a user or addon', async () => {
      mockApi.expects('callApi').returns(Promise.resolve(getReviewsResponse()));

      await getReviews().then(unexpectedSuccess, (error) => {
        expect(error.message).toMatch(/user or addon must be specified/);
      });
    });
  });

  describe('getLatestUserReview', () => {
    it('returns the lone review result since that is the latest', async () => {
      const params = { user: 123, addon: 321, version: 456 };
      const expectedReview = { ...fakeReview, id: 34 };
      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: 'reviews/review',
          // Make sure it filters with the correct params:
          params: {
            addon: params.addon,
            user: params.user,
            version: params.version,
          },
          apiState: undefined,
        })
        .returns(
          Promise.resolve(
            getReviewsResponse({
              reviews: [expectedReview],
            }),
          ),
        );

      const review = await getLatestUserReview(params);
      mockApi.verify();
      expect(review).toEqual(expectedReview);
    });

    it('throws an error if multple reviews are received', async () => {
      mockApi.expects('callApi').returns(
        Promise.resolve(
          getReviewsResponse({
            // In real life, the API should never return multiple reviews like this.
            reviews: [{ ...fakeReview, id: 1 }, { ...fakeReview, id: 2 }],
          }),
        ),
      );

      await getLatestUserReview({
        user: 123,
        addon: fakeReview.addon.id,
        version: fakeReview.version.id,
      }).then(unexpectedSuccess, (error) => {
        expect(error.message).toMatch(/received multiple review objects/);
      });
    });

    it('returns latest review as null when there are no reviews at all', () => {
      mockApi
        .expects('callApi')
        .returns(Promise.resolve(getReviewsResponse({ reviews: [] })));

      return getLatestUserReview({ user: 123, addon: 321, version: 456 }).then(
        (review) => {
          expect(review).toBe(null);
        },
      );
    });

    it('requires user, addon, and version', () => {
      mockApi.expects('callApi').returns(Promise.resolve(getReviewsResponse()));

      return getLatestUserReview().then(unexpectedSuccess, (error) => {
        expect(error.message).toMatch(
          /user, addon, and version must be specified/,
        );
      });
    });

    it('requires addon and version', () => {
      mockApi.expects('callApi').returns(Promise.resolve(getReviewsResponse()));

      return getLatestUserReview({ user: 123 }).then(
        unexpectedSuccess,
        (error) => {
          expect(error.message).toMatch(
            /user, addon, and version must be specified/,
          );
        },
      );
    });

    it('requires a version', () => {
      mockApi.expects('callApi').returns(Promise.resolve(getReviewsResponse()));

      return getLatestUserReview({ addon: 321, user: 123 }).then(
        unexpectedSuccess,
        (error) => {
          expect(error.message).toMatch(
            /user, addon, and version must be specified/,
          );
        },
      );
    });
  });

  describe('replyToReview', () => {
    const replyToReviewResponse = (review = { ...fakeReview }) => {
      return review;
    };

    it('calls the API', async () => {
      const apiState = { ...signedInApiState };
      const originalReview = { ...fakeReview, id: 321 };
      const fakeResponse = replyToReviewResponse();

      const body = 'this is a reply to the review';
      const title = 'title for the reply';
      const errorHandler = createStubErrorHandler();

      mockApi
        .expects('callApi')
        .withArgs({
          endpoint: `reviews/review/${originalReview.id}/reply/`,
          errorHandler,
          body: {
            body,
            title,
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
        title,
      });
      mockApi.verify();
    });
  });

  describe('flagReview', () => {
    const defaultParams = () => {
      return {
        apiState: { ...signedInApiState },
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
          endpoint: `reviews/review/${params.reviewId}/flag`,
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
});
