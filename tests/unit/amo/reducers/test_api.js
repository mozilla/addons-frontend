import UAParser from 'ua-parser-js';

import * as actions from 'amo/reducers/api';
import { CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX } from 'amo/constants';
import { logOutUser } from 'amo/reducers/users';
import api, { getEffectiveClientApp, initialApiState } from 'amo/reducers/api';
import { userAgents, userAuthSessionId } from 'tests/unit/helpers';

describe(__filename, () => {
  it('maintains the old state', () => {
    const state = { some: 'state' };
    expect(api(state, { type: 'UNRELATED' })).toBe(state);
  });

  it('stores the auth token', () => {
    const token = userAuthSessionId();
    expect(api({ foo: 'bar' }, actions.setAuthToken(token))).toEqual({
      foo: 'bar',
      token,
    });
  });

  it('clears the auth token on log out', () => {
    const state = api(undefined, actions.setAuthToken(userAuthSessionId));
    expect(state.token).toBeTruthy();

    const expectedState = { ...state, token: null };
    expect(api(state, logOutUser())).toEqual(expectedState);
  });

  it('stores the lang', () => {
    const lang = 'de';
    expect(
      api({ bar: 'baz' }, { type: actions.SET_LANG, payload: { lang } }),
    ).toEqual({ bar: 'baz', lang });
  });

  it('stores the regionCode', () => {
    const regionCode = 'CA';
    expect(
      api(
        { bar: 'baz' },
        { type: actions.SET_REGION_CODE, payload: { regionCode } },
      ),
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
    const { browser, device, os } = UAParser(userAgent);
    expect(api(existingState, actions.setUserAgent(userAgent))).toEqual({
      ...existingState,
      userAgent,
      userAgentInfo: { browser, device, os },
    });
  });

  it('allows garbage userAgent', () => {
    const existingState = { bar: 'baz' };
    const userAgent = '&***$myName Is Garbage b0wser!___**2é';
    const { browser, device, os } = UAParser(userAgent);
    expect(api(existingState, actions.setUserAgent(userAgent))).toEqual({
      ...existingState,
      userAgent,
      userAgentInfo: { browser, device, os },
    });
  });

  it('allows empty userAgent', () => {
    const existingState = { bar: 'baz' };
    const userAgent = '';
    const { browser, device, os } = UAParser(userAgent);
    expect(api(existingState, actions.setUserAgent(userAgent))).toEqual({
      ...existingState,
      userAgent,
      userAgentInfo: { browser, device, os },
    });
  });

  it('allows undefined userAgent', () => {
    const existingState = { bar: 'baz' };
    const userAgent = undefined;
    const { browser, device, os } = UAParser(userAgent);
    expect(api(existingState, actions.setUserAgent(userAgent))).toEqual({
      ...existingState,
      userAgent,
      userAgentInfo: { browser, device, os },
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
      const token = userAuthSessionId();
      expect(setAndReduceToken(token)).toHaveProperty('token', token);
    });
  });

  describe('setRequestId', () => {
    it('stores a request ID', () => {
      const requestId = 'uuid4-set-by-middleware';
      const state = api(undefined, actions.setRequestId(requestId));

      expect(state.requestId).toEqual(requestId);
    });
  });

  describe('setLang', () => {
    it('creates the SET_LANG action', () => {
      expect(actions.setLang('fr')).toEqual({
        type: actions.SET_LANG,
        payload: { lang: 'fr' },
      });
    });
  });

  describe('setRegionCode', () => {
    it('creates the SET_REGION_CODE action', () => {
      const regionCode = 'CA';
      expect(actions.setRegionCode(regionCode)).toEqual({
        type: actions.SET_REGION_CODE,
        payload: { regionCode },
      });
    });
  });

  describe('setClientApp', () => {
    it('creates the SET_CLIENT_APP action', () => {
      expect(actions.setClientApp('firefox')).toEqual({
        type: actions.SET_CLIENT_APP,
        payload: { clientApp: 'firefox' },
      });
    });

    it('requires a clientApp value', () => {
      expect(() => actions.setClientApp('')).toThrow(/cannot be falsey/);
    });
  });

  describe('setUserAgent', () => {
    it('creates the SET_USER_AGENT action', () => {
      const userAgent = userAgents.chrome[0];

      expect(actions.setUserAgent(userAgent)).toEqual({
        type: actions.SET_USER_AGENT,
        payload: { userAgent },
      });
    });
  });

  describe('setAuthToken', () => {
    it('requires a token', () => {
      expect(() => actions.setAuthToken()).toThrow(/token cannot be falsey/);
    });
  });

  describe('getEffectiveClientApp', () => {
    it('returns android when clientApp is firefox and UA is Android', () => {
      expect(
        getEffectiveClientApp(CLIENT_APP_FIREFOX, userAgents.firefoxAndroid[0]),
      ).toEqual(CLIENT_APP_ANDROID);
    });

    it('returns android for a non-Firefox Android UA', () => {
      expect(
        getEffectiveClientApp(CLIENT_APP_FIREFOX, userAgents.chromeAndroid[0]),
      ).toEqual(CLIENT_APP_ANDROID);
    });

    it('keeps firefox when clientApp is firefox and UA is desktop', () => {
      expect(
        getEffectiveClientApp(CLIENT_APP_FIREFOX, userAgents.firefox[5]),
      ).toEqual(CLIENT_APP_FIREFOX);
    });

    it('keeps firefox when clientApp is firefox and UA is Firefox for iOS', () => {
      expect(
        getEffectiveClientApp(CLIENT_APP_FIREFOX, userAgents.firefoxIOS[1]),
      ).toEqual(CLIENT_APP_FIREFOX);
    });

    it('keeps firefox when clientApp is firefox and there is no userAgent', () => {
      expect(getEffectiveClientApp(CLIENT_APP_FIREFOX, null)).toEqual(
        CLIENT_APP_FIREFOX,
      );
    });

    it('keeps android when clientApp is android and UA is desktop', () => {
      // A desktop user who explicitly chose the Android site keeps it.
      expect(
        getEffectiveClientApp(CLIENT_APP_ANDROID, userAgents.firefox[5]),
      ).toEqual(CLIENT_APP_ANDROID);
    });
  });

  describe('deriving clientApp from a mobile user agent', () => {
    it('turns a firefox clientApp into android for a mobile UA', () => {
      const userAgent = userAgents.firefoxAndroid[0];
      let state = api(undefined, actions.setClientApp(CLIENT_APP_FIREFOX));
      state = api(state, actions.setUserAgent(userAgent));

      expect(state.clientApp).toEqual(CLIENT_APP_ANDROID);
    });

    it('derives android regardless of the order of the actions', () => {
      // On the server the userAgent may be set before the clientApp.
      const userAgent = userAgents.firefoxAndroid[0];
      let state = api(undefined, actions.setUserAgent(userAgent));
      state = api(state, actions.setClientApp(CLIENT_APP_FIREFOX));

      expect(state.clientApp).toEqual(CLIENT_APP_ANDROID);
    });

    it('keeps a firefox clientApp for a desktop UA', () => {
      let state = api(undefined, actions.setClientApp(CLIENT_APP_FIREFOX));
      state = api(state, actions.setUserAgent(userAgents.firefox[5]));

      expect(state.clientApp).toEqual(CLIENT_APP_FIREFOX);
    });

    it('keeps a firefox clientApp for a Firefox for iOS UA', () => {
      let state = api(undefined, actions.setClientApp(CLIENT_APP_FIREFOX));
      state = api(state, actions.setUserAgent(userAgents.firefoxIOS[1]));

      expect(state.clientApp).toEqual(CLIENT_APP_FIREFOX);
    });

    it('does not turn android back into firefox for a desktop UA', () => {
      let state = api(undefined, actions.setClientApp(CLIENT_APP_ANDROID));
      state = api(state, actions.setUserAgent(userAgents.firefox[5]));

      expect(state.clientApp).toEqual(CLIENT_APP_ANDROID);
    });
  });
});
