import SagaTester from 'redux-saga-tester';

import homeReducer, { fetchHomeData } from 'amo/reducers/home';
import homeSaga from 'amo/sagas/home';
import apiReducer from 'amo/reducers/api';
import {
  createStubErrorHandler,
  dispatchClientMetadata,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let errorHandler;
  let sagaTester;

  beforeEach(() => {
    errorHandler = createStubErrorHandler();
    sagaTester = new SagaTester({
      initialState: dispatchClientMetadata().state,
      reducers: {
        api: apiReducer,
        home: homeReducer,
      },
    });
    sagaTester.start(homeSaga);
  });

  describe('fetchHomeData', () => {
    function _fetchHomeData(params) {
      sagaTester.dispatch(
        fetchHomeData({
          errorHandlerId: errorHandler.id,
          ...params,
        }),
      );
    }

    it('clears the error handler', async () => {
      _fetchHomeData();

      const errorAction = errorHandler.createClearingAction();

      const expectedAction = await sagaTester.waitFor(errorAction.type);
      expect(expectedAction).toEqual(errorAction);
    });
  });
});
