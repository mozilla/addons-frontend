import { takeEvery } from 'redux-saga';
import { put, select } from 'redux-saga/effects';
import SagaTester from 'redux-saga-tester';

import { getApi } from 'amo/sagas/utils';
import createStore from 'amo/store';
import { setClientApp, setLang } from 'core/actions';
import apiReducer from 'core/reducers/api';


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
