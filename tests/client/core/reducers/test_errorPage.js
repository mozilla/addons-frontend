import { createStore, combineReducers } from 'redux';
import { endGlobalLoad, loadFail } from 'redux-connect/lib/store';

import { createApiError } from 'core/api';
import errorPage, { initialState } from 'core/reducers/errorPage';


function getErrorPageState(store) {
  return store.getState().errorPage;
}

describe('errorPage reducer', () => {
  let store;

  beforeEach(() => {
    store = createStore(combineReducers({ errorPage }));
  });

  it('defaults to no error and nothing to clear', () => {
    const state = errorPage(initialState, { type: 'unrelated' });
    assert.deepEqual(state, initialState);
  });

  describe('REDUX_CONNECT_END_GLOBAL_LOAD', () => {
    it('sets clearOnNext then clears it next time', () => {
      store.dispatch({ type: 'unrelated', payload: {} });
      let state = getErrorPageState(store);
      assert.equal(state.clearOnNext, false);

      store.dispatch(endGlobalLoad());
      state = getErrorPageState(store);
      assert.equal(state.clearOnNext, true);

      store.dispatch(endGlobalLoad());
      state = getErrorPageState(store);
      assert.deepEqual(state.statusCode, initialState.statusCode);
    });
  });

  describe('REDUX_CONNECT_LOAD_FAIL', () => {
    it('sets an error on load fail; is cleared after the next request', () => {
      store.dispatch({ type: 'unrelated', payload: {} });
      let state = getErrorPageState(store);
      assert.equal(state.error, null);

      const error = createApiError({
        apiURL: 'http://test.com',
        response: { status: 404 },
      });
      store.dispatch(loadFail('ReduxKey', error));
      state = getErrorPageState(store);

      assert.equal(state.hasError, true);
      assert.equal(state.statusCode, error.response.status);
      assert.deepEqual(state.error, error);

      store.dispatch(endGlobalLoad());
      state = getErrorPageState(store);

      assert.equal(state.clearOnNext, true);

      store.dispatch(endGlobalLoad());
      state = getErrorPageState(store);

      assert.equal(state.clearOnNext, false);
      assert.equal(state.hasError, false);
    });

    it('sets a 500 statusCode when no response is present', () => {
      store.dispatch({ type: 'unrelated', payload: {} });
      let state = getErrorPageState(store);

      const error = { invalid: 'yup' };
      store.dispatch(loadFail('ReduxKey', error));
      state = getErrorPageState(store);

      assert.equal(state.hasError, true);
      assert.equal(state.statusCode, 500);
    });
  });
});
