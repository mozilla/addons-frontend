import base64url from 'base64url';

import auth from 'core/reducers/authentication';
import { userAuthToken } from 'tests/client/helpers';

describe('authentication reducer', () => {
  it('defaults to an empty object', () => {
    assert.deepEqual(auth(undefined, { type: 'UNRELATED' }), {});
  });

  it('ignore unrelated actions', () => {
    const state = { token: userAuthToken() };
    assert.strictEqual(auth(state, { type: 'UNRELATED' }), state);
  });

  it('sets the user on SET_CURRENT_USER', () => {
    const username = 'my-username';
    assert.deepEqual(
      auth(undefined, { type: 'SET_CURRENT_USER', payload: { username } }),
      { username });
  });

  it('maintains the token when adding a username', () => {
    const username = 'name-of-user';
    const token = userAuthToken();
    assert.deepEqual(
      auth({ token }, { type: 'SET_CURRENT_USER', payload: { username } }),
      { token, username });
  });

  describe('SET_JWT', () => {
    const setJwt = (token) => auth(undefined, {
      type: 'SET_JWT', payload: { token },
    });

    it('sets auth state based on the token', () => {
      const token = userAuthToken({ user_id: 91234 });
      assert.deepEqual(setJwt(token), { token, userId: 91234 });
    });

    it('throws a parse error for malformed token data', () => {
      const token = userAuthToken({}, {
        tokenData: '{"malformed JSON"}',
      });
      assert.throws(
        () => setJwt(token),
        Error, /Error parsing token .* JSON\.parse: unexpected character/);
    });

    it('throws an error for a JWT without a data segment', () => {
      assert.throws(
        () => setJwt('fake-JWT-without-enough-segments'),
        Error, /Error parsing token .* not enough JWT segments/);
    });

    it('throws an error for an incorrectly encoded data segment', () => {
      assert.throws(
        () => setJwt('algo.incorrectly-encoded-data-segment.sig'),
        Error, /Error parsing token .* unexpected character at line 1/);
    });

    it('throws an error for a missing user_id', () => {
      const token = userAuthToken({}, {
        // Simulate a JWT without any user_id data.
        tokenData: base64url.encode('{"iss": "some-issuer"}'),
      });
      assert.throws(
        () => setJwt(token),
        Error, /Error parsing token .* user_id is missing/);
    });
  });

  describe('LOG_OUT_USER', () => {
    it('clears the state', () => {
      const token = userAuthToken();
      assert.deepEqual(
        auth({ token, otherThing: 'goes away' }, { type: 'LOG_OUT_USER' }),
        {});
    });
  });
});
