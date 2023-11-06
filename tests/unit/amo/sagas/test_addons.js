import SagaTester from 'redux-saga-tester';

import { ADDON_TYPE_EXTENSION } from 'amo/constants';
import * as addonInfoApi from 'amo/api/addonInfo';
import * as api from 'amo/api';
import addonsReducer, {
  fetchAddon,
  fetchAddonInfo,
  loadAddonInfo,
  loadAddon,
} from 'amo/reducers/addons';
import apiReducer from 'amo/reducers/api';
import addonsSaga from 'amo/sagas/addons';
import {
  createStubErrorHandler,
  dispatchSignInActions,
  fakeAddon,
  createFakeAddonInfo,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let apiState;
  let errorHandler;
  let mockApi;
  let sagaTester;

  beforeEach(() => {
    errorHandler = createStubErrorHandler();
    const initialState = dispatchSignInActions().state;
    apiState = initialState.api;
    sagaTester = new SagaTester({
      initialState,
      reducers: { addons: addonsReducer, api: apiReducer },
    });
    sagaTester.start(addonsSaga);
  });

  describe('fetchAddon', () => {
    beforeEach(() => {
      mockApi = sinon.mock(api);
    });

    function _fetchAddon(params = {}) {
      sagaTester.dispatch(
        fetchAddon({
          errorHandler,
          slug: fakeAddon.slug,
          ...params,
        }),
      );
    }

    it('fetches an addon from the API', async () => {
      mockApi
        .expects('fetchAddon')
        .once()
        .withArgs({
          showGroupedRatings: true,
          slug: fakeAddon.slug,
          api: { ...apiState },
        })
        .returns(Promise.resolve(fakeAddon));

      _fetchAddon({ showGroupedRatings: true, slug: fakeAddon.slug });

      const expectedAction = loadAddon({
        addon: fakeAddon,
        slug: fakeAddon.slug,
      });
      await sagaTester.waitFor(expectedAction.type);

      mockApi.verify();
    });

    it.each([401, 403])(
      'kinda fetches a non-public addon from the API (status=%d)',
      async (status) => {
        const guid = 'some-guid';
        mockApi
          .expects('fetchAddon')
          .once()
          .withArgs({
            slug: guid,
            api: { ...apiState },
            showGroupedRatings: false,
          })
          .returns(
            Promise.reject(
              api.createApiError({ url: '', response: { status } }),
            ),
          );

        _fetchAddon({
          assumeNonPublic: true,
          slug: guid,
          showGroupedRatings: false,
        });

        const expectedAction = loadAddon({
          addon: {
            slug: guid,
            // This isn't going to be a numeric ID but that should still be fine.
            id: guid,
            guid,
            name: {
              'en-US': guid,
            },
            default_locale: 'en-US',
            homepage: null,
            contributions_url: null,
            url: '',
            average_daily_users: 0,
            weekly_downloads: 0,
            tags: [],
            support_url: null,
            ratings: {
              average: 0,
              bayesian_average: 0,
              count: 0,
              grouped_counts: {
                '1': 0,
                '2': 0,
                '3': 0,
                '4': 0,
                '5': 0,
              },
              text_count: 0,
            },
            // Assume extension.
            type: ADDON_TYPE_EXTENSION,
            promoted: null,
            created: new Date(0),
            last_updated: null,
          },
          slug: guid,
        });
        const action = await sagaTester.waitFor(expectedAction.type);
        expect(action).toEqual(expectedAction);

        mockApi.verify();
      },
    );

    it('clears the error handler', async () => {
      mockApi.expects('fetchAddon').returns(Promise.resolve(fakeAddon));

      _fetchAddon();

      const expectedAction = loadAddon({
        addon: fakeAddon,
        slug: fakeAddon.slug,
      });
      await sagaTester.waitFor(expectedAction.type);

      expect(sagaTester.getCalledActions()[1]).toEqual(
        errorHandler.createClearingAction(),
      );
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');
      mockApi.expects('fetchAddon').returns(Promise.reject(error));

      _fetchAddon();

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);
      expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
    });
  });

  describe('fetchAddonInfo', () => {
    beforeEach(() => {
      mockApi = sinon.mock(addonInfoApi);
    });

    function _fetchAddonInfo(slug = 'some-slug') {
      sagaTester.dispatch(
        fetchAddonInfo({
          errorHandlerId: errorHandler.id,
          slug,
        }),
      );
    }

    it('calls the API to fetch info', async () => {
      const state = sagaTester.getState();
      const slug = 'some-slug';

      mockApi
        .expects('getAddonInfo')
        .withArgs({
          api: state.api,
          slug,
        })
        .once()
        .resolves(createFakeAddonInfo());

      _fetchAddonInfo(slug);

      const expectedAction = loadAddonInfo({
        info: createFakeAddonInfo(),
        slug,
      });

      const loadAction = await sagaTester.waitFor(expectedAction.type);
      expect(loadAction).toEqual(expectedAction);
      mockApi.verify();
    });

    it('clears the error handler', async () => {
      _fetchAddonInfo();

      const expectedAction = errorHandler.createClearingAction();

      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');

      mockApi.expects('getAddonInfo').once().rejects(error);

      _fetchAddonInfo();

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });
  });
});
