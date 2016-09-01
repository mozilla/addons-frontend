import cookie from 'react-cookie';
import config from 'config';

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

  describe('LOG_OUT_USER', () => {
    let remove;

    beforeEach(() => {
      remove = sinon.stub(cookie, 'remove');
      sinon.stub(config, 'get').returns('JWT_COOKIE_NAME');
    });

    it('clears the state', () => {
      assert.deepEqual(
        auth({ token: 'hey!', otherThing: 'goes away' }, { type: 'LOG_OUT_USER' }),
        {});
    });

    it('clears the cookie', () => {
      auth({ token: 'hey!', otherThing: 'goes away' }, { type: 'LOG_OUT_USER' });
      assert.ok(remove.calledWith('JWT_COOKIE_NAME'));
    });
  });
});
