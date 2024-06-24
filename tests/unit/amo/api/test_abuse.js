import * as api from 'amo/api';
import {
  reportAddon,
  reportUser,
  reportRating,
  reportCollection,
} from 'amo/api/abuse';
import {
  DEFAULT_LANG_IN_TESTS,
  createApiResponse,
  createFakeAddonAbuseReport,
  createFakeUserAbuseReport,
  createUserAccountResponse,
  dispatchClientMetadata,
  fakeAddon,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let mockApi;

  beforeEach(() => {
    mockApi = sinon.mock(api);
  });

  describe('reportAddon', () => {
    function mockResponse({ addon, message }) {
      return createApiResponse({
        jsonData: createFakeAddonAbuseReport({ addon, message }),
      });
    }

    it('calls the report add-on abuse API', async () => {
      const apiState = dispatchClientMetadata().store.getState().api;
      const message = 'I do not like this!';
      const reason = 'does_not_work';
      const reporter_name = 'Foxy';
      const reporter_email = 'fox@moz.co';
      const addonId = 'cool-addon';
      const location = 'both';
      const addon_version = '1.2.3.4';

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: 'abuse/report/addon',
          method: 'POST',
          body: {
            addon: addonId,
            message,
            reason,
            reporter_email,
            reporter_name,
            location,
            addon_version,
            lang: DEFAULT_LANG_IN_TESTS,
            illegal_category: null,
            illegal_subcategory: null,
          },
          apiState,
        })
        .once()
        .returns(
          mockResponse({
            addon: { ...fakeAddon, slug: 'cool-addon' },
            message,
          }),
        );

      await reportAddon({
        addonId,
        api: apiState,
        message,
        reason,
        reporter_email,
        reporter_name,
        location,
        addon_version,
        illegal_category: null,
        illegal_subcategory: null,
        auth: true,
      });

      mockApi.verify();
    });
  });

  describe('reportUser', () => {
    function mockResponse({ message, user }) {
      return createApiResponse({
        jsonData: createFakeUserAbuseReport({ message, user }),
      });
    }

    it('calls the report user abuse API', async () => {
      const apiState = dispatchClientMetadata().store.getState().api;
      const message = 'I do not like this!';
      const userId = 1234;
      const user = createUserAccountResponse({ id: userId });

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: 'abuse/report/user',
          method: 'POST',
          body: {
            user: userId,
            message,
            reason: undefined,
            reporter_email: undefined,
            reporter_name: undefined,
            lang: DEFAULT_LANG_IN_TESTS,
            illegal_category: null,
            illegal_subcategory: null,
          },
          apiState,
        })
        .once()
        .returns(mockResponse({ message, user }));

      await reportUser({
        api: apiState,
        message,
        userId: user.id,
        illegalCategory: null,
        illegalSubcategory: null,
      });

      mockApi.verify();
    });

    it('calls the report user abuse API with more information', async () => {
      const apiState = dispatchClientMetadata().store.getState().api;
      const reason = 'other';
      const reporterEmail = 'some-reporter-email';
      const reporterName = 'some-reporter-name';
      const userId = 1234;
      const user = createUserAccountResponse({ id: userId });

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: 'abuse/report/user',
          method: 'POST',
          body: {
            user: userId,
            message: undefined,
            reason,
            reporter_email: reporterEmail,
            reporter_name: reporterName,
            lang: DEFAULT_LANG_IN_TESTS,
            illegal_category: null,
            illegal_subcategory: null,
          },
          apiState,
        })
        .once()
        .returns(
          mockResponse({
            message: '',
            reason,
            reporter_email: reporterEmail,
            reporter_name: reporterName,
            user,
          }),
        );

      await reportUser({
        api: apiState,
        userId: user.id,
        reason,
        reporterEmail,
        reporterName,
        illegalCategory: null,
        illegalSubcategory: null,
      });

      mockApi.verify();
    });

    it('allows the user abuse report API to be called anonymously', async () => {
      const apiState = dispatchClientMetadata().store.getState().api;
      const message = 'I do not like this!';
      const userId = 1234;
      const user = createUserAccountResponse({ id: userId });

      mockApi
        .expects('callApi')
        .withArgs({
          auth: false,
          endpoint: 'abuse/report/user',
          method: 'POST',
          body: {
            user: userId,
            message,
            reason: undefined,
            reporter_email: undefined,
            reporter_name: undefined,
            lang: DEFAULT_LANG_IN_TESTS,
            illegal_category: null,
            illegal_subcategory: null,
          },
          apiState,
        })
        .once()
        .returns(mockResponse({ message, user }));

      await reportUser({
        api: apiState,
        auth: false,
        message,
        userId: user.id,
        illegalCategory: null,
        illegalSubcategory: null,
      });

      mockApi.verify();
    });

    it.each([undefined, '', null, ' '])(
      'throws when reason is not supplied and message is %s',
      async (message) => {
        const apiState = dispatchClientMetadata().store.getState().api;
        const user = createUserAccountResponse();

        await expect(() =>
          reportUser({ api: apiState, userId: user.id, message }),
        ).toThrow(/message is required when reason isn't specified/);
      },
    );
  });

  describe('reportRating', () => {
    const mockResponse = ({ ratingId = 123, ...otherProps } = {}) => {
      return createApiResponse({
        jsonData: {
          reporter: null,
          reporter_name: 'some reporter name',
          reporter_email: 'some reporter email',
          rating: {
            id: ratingId,
          },
          message: '',
          reason: 'illegal',
          illegal_category: null,
          illegal_subcategory: null,
          ...otherProps,
        },
      });
    };

    it('calls the add-on rating report API', async () => {
      const apiState = dispatchClientMetadata().store.getState().api;
      const reason = 'other';
      const reporterEmail = 'some-reporter-email';
      const reporterName = 'some-reporter-name';
      const ratingId = 1234;

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: 'abuse/report/rating',
          method: 'POST',
          body: {
            rating: ratingId,
            message: undefined,
            reason,
            reporter_email: reporterEmail,
            reporter_name: reporterName,
            lang: DEFAULT_LANG_IN_TESTS,
            illegal_category: null,
            illegal_subcategory: null,
          },
          apiState,
        })
        .once()
        .returns(mockResponse());

      await reportRating({
        api: apiState,
        auth: true,
        ratingId,
        reason,
        reporterEmail,
        reporterName,
        illegalCategory: null,
        illegalSubcategory: null,
      });

      mockApi.verify();
    });

    it('allows the rating abuse report API to be called anonymously', async () => {
      const apiState = dispatchClientMetadata().store.getState().api;
      const ratingId = 1234;
      const message = 'I do not like this!';

      mockApi
        .expects('callApi')
        .withArgs({
          auth: false,
          endpoint: 'abuse/report/rating',
          method: 'POST',
          body: {
            rating: ratingId,
            message,
            reason: undefined,
            reporter_email: undefined,
            reporter_name: undefined,
            lang: DEFAULT_LANG_IN_TESTS,
            illegal_category: null,
            illegal_subcategory: null,
          },
          apiState,
        })
        .once()
        .returns(mockResponse());

      await reportRating({
        api: apiState,
        auth: false,
        message,
        ratingId,
        illegalCategory: null,
        illegalSubcategory: null,
      });

      mockApi.verify();
    });

    it.each([undefined, '', null, ' '])(
      'throws when reason is not supplied and message is %s',
      async (message) => {
        const apiState = dispatchClientMetadata().store.getState().api;

        await expect(() =>
          reportRating({ api: apiState, ratingId: 123, message }),
        ).toThrow(/message is required when reason isn't specified/);
      },
    );
  });

  describe('reportCollection', () => {
    const mockResponse = ({ collectionId = 123, ...otherProps } = {}) => {
      return createApiResponse({
        jsonData: {
          reporter: null,
          reporter_name: 'some reporter name',
          reporter_email: 'some reporter email',
          collection: {
            id: collectionId,
          },
          message: '',
          reason: 'illegal',
          illegal_category: null,
          illegal_subcategory: null,
          ...otherProps,
        },
      });
    };

    it('calls the collection abuse report API', async () => {
      const apiState = dispatchClientMetadata().store.getState().api;
      const reason = 'other';
      const reporterEmail = 'some-reporter-email';
      const reporterName = 'some-reporter-name';
      const collectionId = 1234;

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: 'abuse/report/collection',
          method: 'POST',
          body: {
            collection: collectionId,
            message: undefined,
            reason,
            reporter_email: reporterEmail,
            reporter_name: reporterName,
            lang: DEFAULT_LANG_IN_TESTS,
            illegal_category: null,
            illegal_subcategory: null,
          },
          apiState,
        })
        .once()
        .returns(mockResponse());

      await reportCollection({
        api: apiState,
        auth: true,
        collectionId,
        reason,
        reporterEmail,
        reporterName,
        illegalCategory: null,
        illegalSubcategory: null,
      });

      mockApi.verify();
    });

    it('allows the collection abuse report API to be called anonymously', async () => {
      const apiState = dispatchClientMetadata().store.getState().api;
      const collectionId = 1234;
      const message = 'not a great collection';

      mockApi
        .expects('callApi')
        .withArgs({
          auth: false,
          endpoint: 'abuse/report/collection',
          method: 'POST',
          body: {
            collection: collectionId,
            message,
            reason: undefined,
            reporter_email: undefined,
            reporter_name: undefined,
            lang: DEFAULT_LANG_IN_TESTS,
            illegal_category: null,
            illegal_subcategory: null,
          },
          apiState,
        })
        .once()
        .returns(mockResponse());

      await reportCollection({
        api: apiState,
        auth: false,
        message,
        collectionId,
        illegalCategory: null,
        illegalSubcategory: null,
      });

      mockApi.verify();
    });

    it.each([undefined, '', null, ' '])(
      'throws when reason is not supplied and message is %s',
      async (message) => {
        const apiState = dispatchClientMetadata().store.getState().api;

        await expect(() =>
          reportCollection({ api: apiState, collectionId: 123, message }),
        ).toThrow(/message is required when reason isn't specified/);
      },
    );
  });
});
