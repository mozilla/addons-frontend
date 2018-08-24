import UAParser from 'ua-parser-js';

import * as actions from 'core/actions';
import { logOutUser } from 'amo/reducers/users';
import api, { initialApiState } from 'core/reducers/api';
import { userAgents, userAuthToken } from 'tests/unit/helpers';

describe(__filename, () => {
  it('maintains the old state', () => {
    const state = { some: 'state' };
    expect(api(state, { type: 'UNRELATED' })).toBe(state);
  });

  it('stores the auth token', () => {
    const token = userAuthToken();
    expect(api({ foo: 'bar' }, actions.setAuthToken(token))).toEqual({
      foo: 'bar',
      token,
    });
  });

  it('clears the auth token on log out', () => {
    const state = api(undefined, actions.setAuthToken(userAuthToken));
    expect(state.token).toBeTruthy();

    const expectedState = { ...state, token: null };
    expect(api(state, logOutUser())).toEqual(expectedState);
  });

  it('stores the lang', () => {
    const lang = 'de';
    expect(
      api({ bar: 'baz' }, { type: 'SET_LANG', payload: { lang } }),
    ).toEqual({ bar: 'baz', lang });
  });

  it('stores the clientApp', () => {
    const existingState = { bar: 'baz' };
    const clientApp = 'firefox';
    expect(api(existingState, actions.setClientApp(clientApp))).toEqual({
      ...existingState,
      clientApp,
    });
  });

  it('stores the userAgent', () => {
    const existingState = { bar: 'baz' };
    const userAgent = userAgents.firefox[1];
    const { browser, os } = UAParser(userAgent);
    expect(api(existingState, actions.setUserAgent(userAgent))).toEqual({
      ...existingState,
      userAgent,
      userAgentInfo: { browser, os },
    });
  });

  it('allows garbage userAgent', () => {
    const existingState = { bar: 'baz' };
    const userAgent = '&***$myName Is Garbage b0wser!___**2é';
    const { browser, os } = UAParser(userAgent);
    expect(api(existingState, actions.setUserAgent(userAgent))).toEqual({
      ...existingState,
      userAgent,
      userAgentInfo: { browser, os },
    });
  });

  it('allows empty userAgent', () => {
    const existingState = { bar: 'baz' };
    const userAgent = '';
    const { browser, os } = UAParser(userAgent);
    expect(api(existingState, actions.setUserAgent(userAgent))).toEqual({
      ...existingState,
      userAgent,
      userAgentInfo: { browser, os },
    });
  });

  it('allows undefined userAgent', () => {
    const existingState = { bar: 'baz' };
    const userAgent = undefined;
    const { browser, os } = UAParser(userAgent);
    expect(api(existingState, actions.setUserAgent(userAgent))).toEqual({
      ...existingState,
      userAgent,
      userAgentInfo: { browser, os },
    });
  });

  it('defaults to an empty object', () => {
    expect(api(undefined, { type: 'UNRELATED' })).toEqual({
      ...initialApiState,
    });
  });

  describe('set and reduce auth token', () => {
    const setAndReduceToken = (token) =>
      api(undefined, actions.setAuthToken(token));

    it('sets auth state based on the token', () => {
      const token = userAuthToken({ user_id: 91234 });
      expect(setAndReduceToken(token)).toHaveProperty('token', token);
    });
  });
});
