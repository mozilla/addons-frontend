import UAParser from 'ua-parser-js';
import base64url from 'base64url';

import * as actions from 'core/actions';
import api, { initialApiState } from 'core/reducers/api';
import { signedInApiState, userAgents, userAuthToken }
  from 'tests/unit/helpers';


describe('api reducer', () => {
  it('maintains the old state', () => {
    const state = { some: 'state' };
    expect(api(state, { type: 'UNRELATED' })).toBe(state);
  });

  it('stores the auth token', () => {
    const token = userAuthToken();
    expect(api({ foo: 'bar' }, actions.setAuthToken(token))).toEqual({
      foo: 'bar',
      token,
      userId: 102345,
    });
  });

  it('clears the auth token on log out', () => {
    const state = { ...signedInApiState };
    expect(state.token).toBeTruthy();
    const expectedState = { ...state, token: null, userId: null };
    expect(api(signedInApiState, actions.logOutUser())).toEqual(expectedState);
  });

  it('stores the lang', () => {
    const lang = 'de';
    expect(api({ bar: 'baz' },
      { type: 'SET_LANG', payload: { lang } })).toEqual({ bar: 'baz', lang });
  });

  it('stores the clientApp', () => {
    const existingState = { bar: 'baz' };
    const clientApp = 'firefox';
    expect(api(existingState, actions.setClientApp(clientApp)))
      .toEqual({ ...existingState, clientApp });
  });

  it('stores the userAgent', () => {
    const existingState = { bar: 'baz' };
    const userAgent = userAgents.firefox[1];
    const { browser, os } = UAParser(userAgent);
    expect(api(existingState, actions.setUserAgent(userAgent)))
      .toEqual({ ...existingState, userAgent, userAgentInfo: { browser, os } });
  });

  it('allows garbage userAgent', () => {
    const existingState = { bar: 'baz' };
    const userAgent = '&***$myName Is Garbage b0wser!___**2é';
    const { browser, os } = UAParser(userAgent);
    expect(api(existingState, actions.setUserAgent(userAgent)))
      .toEqual({ ...existingState, userAgent, userAgentInfo: { browser, os } });
  });

  it('allows empty userAgent', () => {
    const existingState = { bar: 'baz' };
    const userAgent = '';
    const { browser, os } = UAParser(userAgent);
    expect(api(existingState, actions.setUserAgent(userAgent)))
      .toEqual({ ...existingState, userAgent, userAgentInfo: { browser, os } });
  });

  it('allows undefined userAgent', () => {
    const existingState = { bar: 'baz' };
    const userAgent = undefined;
    const { browser, os } = UAParser(userAgent);
    expect(api(existingState, actions.setUserAgent(userAgent)))
      .toEqual({ ...existingState, userAgent, userAgentInfo: { browser, os } });
  });

  it('defaults to an empty object', () => {
    expect(api(undefined, { type: 'UNRELATED' })).toEqual({ ...initialApiState });
  });

  describe('set and reduce auth token', () => {
    const setAndReduceToken = (token) => api(undefined, actions.setAuthToken(token));

    it('sets auth state based on the token', () => {
      const token = userAuthToken({ user_id: 91234 });
      expect(setAndReduceToken(token)).toHaveProperty('token', token);
      expect(setAndReduceToken(token)).toHaveProperty('userId', 91234);
    });

    it('throws a parse error for malformed token data', () => {
      const token = userAuthToken({}, {
        tokenData: '{"malformed JSON"}',
      });
      expect(() => setAndReduceToken(token))
        .toThrowError(/Error parsing auth token "{"malformed JSON"}/);
    });

    it('throws an error for a token without a data segment', () => {
      expect(() => setAndReduceToken('fake-token-without-enough-segments'))
        .toThrowError(/Error parsing auth token .* not enough auth token segments/);
    });

    it('throws an error for an incorrectly encoded data segment', () => {
      expect(() => setAndReduceToken('incorrectly-encoded-data-segment:authId:sig'))
        .toThrowError(/Error parsing auth token "incorrectly-encoded-data-segment/);
    });

    it('throws an error for a missing user_id', () => {
      // Simulate a token without any user_id data.
      const encodedData = base64url.encode('{}');
      const tokenData = `${encodedData}:authId:signature`;
      const token = userAuthToken({}, { tokenData });
      expect(() => setAndReduceToken(token))
        .toThrowError(/Error parsing auth token .* user_id is missing/);
    });
  });
});
