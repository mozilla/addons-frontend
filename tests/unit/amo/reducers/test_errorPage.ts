import { createStore, combineReducers } from 'redux';
import { LOCATION_CHANGE } from 'redux-first-history';

import { createApiError } from 'amo/api';
import errorPage, { initialState, loadErrorPage } from 'amo/reducers/errorPage';

function getErrorPageState(store) {
  return store.getState().errorPage;
}

describe(__filename, () => {
  let store;
  beforeEach(() => {
    store = createStore(combineReducers({
      errorPage,
    }));
  });
  it('defaults to no error and nothing to clear', () => {
    const state = errorPage(initialState, {
      type: 'unrelated',
    });
    expect(state).toEqual(initialState);
  });
  describe('LOCATION_CHANGE', () => {
    it('sets clearOnNext then clears it next time', () => {
      store.dispatch({
        type: 'unrelated',
        payload: {},
      });
      let state = getErrorPageState(store);
      expect(state.clearOnNext).toEqual(false);
      store.dispatch({
        type: LOCATION_CHANGE,
      });
      state = getErrorPageState(store);
      expect(state.clearOnNext).toEqual(true);
      store.dispatch({
        type: LOCATION_CHANGE,
      });
      state = getErrorPageState(store);
      expect(state.statusCode).toEqual(initialState.statusCode);
    });
  });
  describe('loadErrorPage', () => {
    it('sets an error on load fail; is cleared after the next request', () => {
      store.dispatch({
        type: 'unrelated',
        payload: {},
      });
      let state = getErrorPageState(store);
      expect(state.error).toEqual(null);
      const error = createApiError({
        apiURL: 'http://test.com',
        response: {
          status: 404,
        },
      });
      store.dispatch(loadErrorPage({
        error,
      }));
      state = getErrorPageState(store);
      expect(state.hasError).toEqual(true);
      expect(state.statusCode).toEqual(error.response.status);
      expect(state.error).toEqual(error);
      store.dispatch({
        type: LOCATION_CHANGE,
      });
      state = getErrorPageState(store);
      expect(state.clearOnNext).toEqual(true);
      store.dispatch({
        type: LOCATION_CHANGE,
      });
      state = getErrorPageState(store);
      expect(state.clearOnNext).toEqual(false);
      expect(state.hasError).toEqual(false);
    });
    it('sets a 500 statusCode when no response is present', () => {
      store.dispatch({
        type: 'unrelated',
        payload: {},
      });
      let state = getErrorPageState(store);
      const error = {
        invalid: 'yup',
      };
      store.dispatch(loadErrorPage({
        error,
      }));
      state = getErrorPageState(store);
      expect(state.hasError).toEqual(true);
      expect(state.statusCode).toEqual(500);
    });
  });
});