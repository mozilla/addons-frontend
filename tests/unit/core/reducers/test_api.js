import UAParser from 'ua-parser-js';

import * as actions from 'core/reducers/api';
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

  it('stores the regionCode', () => {
    const regionCode = 'CA';
    expect(
      api({ bar: 'baz' }, { type: 'SET_REGION_CODE', payload: { regionCode } }),
    ).toEqual({ bar: 'baz', regionCode });
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

  describe('setRequestId', () => {
    const requestId = 'uuid4-set-by-middleware';
    const state = api(undefined, actions.setRequestId(requestId));

    expect(state.requestId).toEqual(requestId);
  });

  describe('setLang', () => {
    it('creates the SET_LANG action', () => {
      expect(actions.setLang('fr')).toEqual({
        type: 'SET_LANG',
        payload: { lang: 'fr' },
      });
    });
  });

  describe('setRegionCode', () => {
    it('creates the SET_REGION_CODE action', () => {
      const regionCode = 'CA';
      expect(actions.setRegionCode(regionCode)).toEqual({
        type: 'SET_REGION_CODE',
        payload: { regionCode },
      });
    });
  });

  describe('setClientApp', () => {
    it('creates the SET_CLIENT_APP action', () => {
      expect(actions.setClientApp('firefox')).toEqual({
        type: 'SET_CLIENT_APP',
        payload: { clientApp: 'firefox' },
      });
    });

    it('requires a clientApp value', () => {
      expect(() => actions.setClientApp('')).toThrowError(/cannot be falsey/);
    });
  });

  describe('setUserAgent', () => {
    it('creates the SET_USER_AGENT action', () => {
      const userAgent = userAgents.chrome[0];

      expect(actions.setUserAgent(userAgent)).toEqual({
        type: 'SET_USER_AGENT',
        payload: { userAgent },
      });
    });
  });
});
