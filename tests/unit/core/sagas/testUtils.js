// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
/* eslint-disable import/order */
import { takeEvery } from 'redux-saga';
import SagaTester from 'redux-saga-tester';
import { put, select } from 'redux-saga/effects';
/* eslint-enable import/order */

import createStore from 'amo/store';
import { setClientApp, setLang } from 'core/actions';
import apiReducer from 'core/reducers/api';
import { getApi } from 'core/sagas/utils';


describe('Saga utils', () => {
  it('should return API state', async () => {
    function* testGetApiSaga() {
      yield takeEvery('TEST_GET_API', function* selectGetApiTest() {
        const apiState = yield select(getApi);
        yield put({ type: 'TEST_GOT_API', payload: apiState });
      });
    }

    const store = createStore().store;
    store.dispatch(setClientApp('firefox'));
    store.dispatch(setLang('en-US'));

    const state = store.getState();

    const sagaTester = new SagaTester({
      initialState: { api: state.api },
      reducers: { api: apiReducer },
    });
    sagaTester.start(testGetApiSaga);

    sagaTester.dispatch({ type: 'TEST_GET_API' });

    await sagaTester.waitFor('TEST_GOT_API');

    expect(sagaTester.getLatestCalledAction()).toEqual({
      type: 'TEST_GOT_API',
      payload: state.api,
    });
  });
});
