import SagaTester from 'redux-saga-tester';

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
        .withArgs({ slug: fakeAddon.slug, api: { ...apiState } })
        .returns(Promise.resolve(fakeAddon));

      _fetchAddon({ slug: fakeAddon.slug });

      const expectedAction = loadAddon({
        addon: fakeAddon,
        slug: fakeAddon.slug,
      });
      await sagaTester.waitFor(expectedAction.type);

      mockApi.verify();
    });

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
