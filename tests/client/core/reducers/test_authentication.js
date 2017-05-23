import base64url from 'base64url';

import { setAuthToken } from 'core/actions';
import auth from 'core/reducers/authentication';
import { userAuthToken } from 'tests/client/helpers';

describe('authentication reducer', () => {
  it('defaults to an empty object', () => {
    expect(auth(undefined, { type: 'UNRELATED' })).toEqual({});
  });

  it('ignore unrelated actions', () => {
    const state = { token: userAuthToken() };
    expect(auth(state, { type: 'UNRELATED' })).toBe(state);
  });

  it('sets the user on SET_CURRENT_USER', () => {
    const username = 'my-username';
    expect(auth(undefined, { type: 'SET_CURRENT_USER', payload: { username } })).toEqual({ username });
  });

  it('maintains the token when adding a username', () => {
    const username = 'name-of-user';
    const token = userAuthToken();
    expect(auth({ token }, { type: 'SET_CURRENT_USER', payload: { username } })).toEqual({ token, username });
  });

  describe('set and reduce auth token', () => {
    const setAndReduceToken = (token) => auth(undefined, setAuthToken(token));

    it('sets auth state based on the token', () => {
      const token = userAuthToken({ user_id: 91234 });
      expect(setAndReduceToken(token)).toEqual({ token, userId: 91234 });
    });

    it('throws a parse error for malformed token data', () => {
      const token = userAuthToken({}, {
        tokenData: '{"malformed JSON"}',
      });
      expect(() => setAndReduceToken(token)).toThrow();
    });

    it('throws an error for a token without a data segment', () => {
      expect(() => setAndReduceToken('fake-token-without-enough-segments')).toThrow();
    });

    it('throws an error for an incorrectly encoded data segment', () => {
      expect(() => setAndReduceToken('incorrectly-encoded-data-segment:authId:sig')).toThrow();
    });

    it('throws an error for a missing user_id', () => {
      // Simulate a token without any user_id data.
      const encodedData = base64url.encode('{}');
      const tokenData = `${encodedData}:authId:signature`;
      const token = userAuthToken({}, { tokenData });
      expect(() => setAndReduceToken(token)).toThrow();
    });
  });

  describe('LOG_OUT_USER', () => {
    it('clears the state', () => {
      const token = userAuthToken();
      expect(auth({ token, otherThing: 'goes away' }, { type: 'LOG_OUT_USER' })).toEqual({});
    });
  });
});
