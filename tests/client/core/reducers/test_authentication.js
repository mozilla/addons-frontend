import base64url from 'base64url';

import { setAuthToken } from 'core/actions';
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

  describe('set and reduce auth token', () => {
    const setAndReduceToken = (token) => auth(undefined, setAuthToken(token));

    it('sets auth state based on the token', () => {
      const token = userAuthToken({ user_id: 91234 });
      assert.deepEqual(setAndReduceToken(token), { token, userId: 91234 });
    });

    it('throws a parse error for malformed token data', () => {
      const token = userAuthToken({}, {
        tokenData: '{"malformed JSON"}',
      });
      assert.throws(
        () => setAndReduceToken(token),
        Error, /Error parsing auth token .* JSON\.parse: unexpected character/);
    });

    it('throws an error for a token without a data segment', () => {
      assert.throws(
        () => setAndReduceToken('fake-token-without-enough-segments'),
        Error, /Error parsing auth token .* not enough auth token segments/);
    });

    it('throws an error for an incorrectly encoded data segment', () => {
      assert.throws(
        () => setAndReduceToken('incorrectly-encoded-data-segment:authId:sig'),
        Error, /Error parsing auth token .* unexpected character at line 1/);
    });

    it('throws an error for a missing user_id', () => {
      // Simulate a token without any user_id data.
      const encodedData = base64url.encode('{}');
      const tokenData = `${encodedData}:authId:signature`;
      const token = userAuthToken({}, { tokenData });
      assert.throws(
        () => setAndReduceToken(token),
        Error, /Error parsing auth token .* user_id is missing/);
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
