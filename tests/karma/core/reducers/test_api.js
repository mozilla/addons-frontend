import ApiClient from 'core/api';
import api from 'core/reducers/api';

describe('api reducer', () => {
  it('defaults to null', () => {
    assert.strictEqual(api(undefined, {type: 'UNRELATED'}), null);
  });

  it('ignore unrelated actions', () => {
    const state = new ApiClient({});
    assert.strictEqual(api(state, {type: 'UNRELATED'}), state);
  });

  it('creates an ApiClient with getState', () => {
    const getState = sinon.stub();
    const apiClient = api(undefined, {type: 'SET_API_CLIENT', payload: {getState}});
    assert(apiClient instanceof ApiClient);
    assert.equal(apiClient.getState, getState);
  });
});
