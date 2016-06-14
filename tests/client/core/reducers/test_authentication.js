import auth from 'core/reducers/authentication';

describe('authentication reducer', () => {
  it('defaults to an empty object', () => {
    assert.deepEqual(auth(undefined, { type: 'UNRELATED' }), {});
  });

  it('ignore unrelated actions', () => {
    const state = { token: 'the.JWT.payload' };
    assert.strictEqual(auth(state, { type: 'UNRELATED' }), state);
  });

  it('sets the JWT token on SET_JWT', () => {
    const token = 'json.WEB.t0k3n';
    assert.deepEqual(auth(undefined, { type: 'SET_JWT', payload: { token } }), { token });
  });

  it('sets the user on SET_CURRENT_USER', () => {
    const username = 'my-username';
    assert.deepEqual(auth(undefined,
      { type: 'SET_CURRENT_USER', payload: { username } }), { username });
  });

  it('maintains the token when adding a username', () => {
    const username = 'name-of-user';
    assert.deepEqual(
      auth({ token: 'foo' }, { type: 'SET_CURRENT_USER', payload: { username } }),
      { token: 'foo', username });
  });
});
