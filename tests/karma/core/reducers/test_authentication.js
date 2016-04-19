import auth from 'core/reducers/authentication';

describe('authentication reducer', () => {
  it('defaults to an empty object', () => {
    assert.deepEqual(auth(undefined, {type: 'UNRELATED'}), {});
  });

  it('ignore unrelated actions', () => {
    const state = {token: 'the.JWT.payload'};
    assert.strictEqual(auth(state, {type: 'UNRELATED'}), state);
  });

  it('sets the JWT token on SET_JWT', () => {
    const token = 'json.WEB.t0k3n';
    assert.deepEqual(auth(undefined, {type: 'SET_JWT', payload: {token}}), {token});
  });
});
