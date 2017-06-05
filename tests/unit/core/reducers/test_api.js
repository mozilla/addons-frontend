import UAParser from 'ua-parser-js';

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
    expect(api({ foo: 'bar' }, actions.setAuthToken(token))).toEqual({ foo: 'bar', token });
  });

  it('clears the auth token on log out', () => {
    const state = { ...signedInApiState };
    expect(state.token).toBeTruthy();
    const expectedState = { ...state, token: null };
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
});
