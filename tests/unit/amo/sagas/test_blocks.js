import SagaTester from 'redux-saga-tester';

import * as blocksApi from 'amo/api/blocks';
import blocksReducer, {
  abortFetchBlock,
  fetchBlock,
  loadBlock,
} from 'amo/reducers/blocks';
import blocksSaga from 'amo/sagas/blocks';
import { createApiError } from 'amo/api';
import apiReducer from 'amo/reducers/api';
import {
  createFakeBlockResult,
  createStubErrorHandler,
  dispatchClientMetadata,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let errorHandler;
  let mockBlocksApi;
  let sagaTester;

  beforeEach(() => {
    errorHandler = createStubErrorHandler();
    mockBlocksApi = sinon.mock(blocksApi);
    sagaTester = new SagaTester({
      initialState: dispatchClientMetadata().state,
      reducers: {
        api: apiReducer,
        blocks: blocksReducer,
      },
    });
    sagaTester.start(blocksSaga);
  });

  describe('fetchBlock', () => {
    function _fetchBlock(params) {
      sagaTester.dispatch(
        fetchBlock({
          errorHandlerId: errorHandler.id,
          guid: 'some-guid',
          ...params,
        }),
      );
    }

    it('calls the API to fetch a block by GUID', async () => {
      const state = sagaTester.getState();
      const guid = 'some-guid';
      const block = createFakeBlockResult({ guid });
      mockBlocksApi
        .expects('getBlock')
        .withArgs({ apiState: state.api, guid })
        .resolves(block);

      _fetchBlock({ guid });

      const loadAction = loadBlock({ block });

      const receivedAction = await sagaTester.waitFor(loadAction.type);
      mockBlocksApi.verify();

      expect(receivedAction).toEqual(loadAction);
    });

    it('clears the error handler', async () => {
      _fetchBlock();

      const errorAction = errorHandler.createClearingAction();

      const receivedAction = await sagaTester.waitFor(errorAction.type);
      expect(receivedAction).toEqual(errorAction);
    });

    it('dispatches an error for a failed block fetch', async () => {
      const guid = 'some-guid';
      const error = createApiError({ response: { status: 500 } });
      mockBlocksApi.expects('getBlock').rejects(error);

      _fetchBlock({ guid });

      const errorAction = errorHandler.createErrorAction(error);
      const receivedAction = await sagaTester.waitFor(errorAction.type);

      expect(receivedAction).toEqual(errorAction);
    });

    it('aborts fetching for a failed block fetch', async () => {
      const guid = 'some-guid';
      const error = createApiError({ response: { status: 500 } });
      mockBlocksApi.expects('getBlock').rejects(error);

      _fetchBlock({ guid });

      const abortAction = abortFetchBlock({ guid });

      const receivedAction = await sagaTester.waitFor(abortAction.type);
      expect(receivedAction).toEqual(abortAction);
    });
  });
});
