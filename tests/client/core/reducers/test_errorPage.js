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
    expect(state).toEqual(initialState);
  });

  describe('REDUX_CONNECT_END_GLOBAL_LOAD', () => {
    it('sets clearOnNext then clears it next time', () => {
      store.dispatch({ type: 'unrelated', payload: {} });
      let state = getErrorPageState(store);
      expect(state.clearOnNext).toEqual(false);

      store.dispatch(endGlobalLoad());
      state = getErrorPageState(store);
      expect(state.clearOnNext).toEqual(true);

      store.dispatch(endGlobalLoad());
      state = getErrorPageState(store);
      expect(state.statusCode).toEqual(initialState.statusCode);
    });
  });

  describe('REDUX_CONNECT_LOAD_FAIL', () => {
    it('sets an error on load fail; is cleared after the next request', () => {
      store.dispatch({ type: 'unrelated', payload: {} });
      let state = getErrorPageState(store);
      expect(state.error).toEqual(null);

      const error = createApiError({
        apiURL: 'http://test.com',
        response: { status: 404 },
      });
      store.dispatch(loadFail('ReduxKey', error));
      state = getErrorPageState(store);

      expect(state.hasError).toEqual(true);
      expect(state.statusCode).toEqual(error.response.status);
      expect(state.error).toEqual(error);

      store.dispatch(endGlobalLoad());
      state = getErrorPageState(store);

      expect(state.clearOnNext).toEqual(true);

      store.dispatch(endGlobalLoad());
      state = getErrorPageState(store);

      expect(state.clearOnNext).toEqual(false);
      expect(state.hasError).toEqual(false);
    });

    it('sets a 500 statusCode when no response is present', () => {
      store.dispatch({ type: 'unrelated', payload: {} });
      let state = getErrorPageState(store);

      const error = { invalid: 'yup' };
      store.dispatch(loadFail('ReduxKey', error));
      state = getErrorPageState(store);

      expect(state.hasError).toEqual(true);
      expect(state.statusCode).toEqual(500);
    });
  });
});
