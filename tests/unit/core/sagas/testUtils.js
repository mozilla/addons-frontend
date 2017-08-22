// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
/* eslint-disable import/order */
import { takeEvery } from 'redux-saga';
import SagaTester from 'redux-saga-tester';
import { put, select } from 'redux-saga/effects';
/* eslint-enable import/order */

import apiReducer from 'core/reducers/api';
import { createErrorHandler, getState } from 'core/sagas/utils';
import { dispatchSignInActions } from 'tests/unit/amo/helpers';


describe('Saga utils', () => {
  it('does not allow usage of dispatch from a saga', () => {
    const fakeLog = { error: sinon.stub() };
    const errorHandler = createErrorHandler('some-error-handler', {
      log: fakeLog });
    errorHandler.dispatch('ANYTHING');

    sinon.assert.calledWith(fakeLog.error,
      'ErrorHandler cannot dispatch from a saga');
  });

  it('should return entire state', async () => {
    function* testGetApiSaga() {
      yield takeEvery('TEST_GET_API', function* selectGetApiTest() {
        const state = yield select(getState);
        yield put({ type: 'TEST_GOT_API', payload: state });
      });
    }

    const { store } = dispatchSignInActions();
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
      payload: { api: state.api },
    });
  });
});
