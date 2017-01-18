import { loadFail as reduxConnectLoadFail } from 'redux-connect/lib/store';

import createStore from 'amo/store';
import { createApiError } from 'core/api';
import { getReduxConnectError } from 'core/reduxConnectErrors';

describe('core/reduxConnectErrors', () => {
  describe('getReduxConnectError', () => {
    let store;

    function errorWithStatus(status) {
      return createApiError({
        apiURL: 'https://some-url',
        response: { status },
      });
    }

    function _getReduxConnectError() {
      const loadState = store.getState().reduxAsyncConnect.loadState;
      return getReduxConnectError(loadState);
    }

    beforeEach(() => {
      store = createStore();
    });

    it('returns null when there are no redux-connect errors', () => {
      assert.deepEqual(_getReduxConnectError(),
                       { status: undefined, error: undefined });
    });

    it('returns 404 status info', () => {
      store.dispatch(reduxConnectLoadFail('someKey', errorWithStatus(404)));

      assert.deepEqual(_getReduxConnectError(),
                       { status: 404, error: 'Not Found' });
    });

    it('returns 500 for multiple errors', () => {
      store.dispatch(reduxConnectLoadFail('someKey', errorWithStatus(404)));
      store.dispatch(reduxConnectLoadFail('anotherKey', errorWithStatus(404)));

      assert.deepEqual(_getReduxConnectError(),
                       { status: 500, error: 'Internal Server Error' });
    });

    it('preserves status for unexpected errors', () => {
      store.dispatch(reduxConnectLoadFail('someKey', errorWithStatus(419)));

      assert.deepEqual(_getReduxConnectError(),
                       { status: 419, error: 'Unexpected Error' });
    });
  });
});
