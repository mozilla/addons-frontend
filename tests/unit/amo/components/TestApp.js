/* eslint-disable react/no-multi-comp */
import { createMemoryHistory } from 'history';
import * as React from 'react';
import NestedStatus from 'react-nested-status';
import { Helmet } from 'react-helmet';

import App, {
  AppBase,
  getErrorPage,
  mapDispatchToProps,
  mapStateToProps,
} from 'amo/components/App';
import NotAuthorizedPage from 'amo/pages/ErrorPages/NotAuthorizedPage';
import NotFoundPage from 'amo/pages/ErrorPages/NotFoundPage';
import ServerErrorPage from 'amo/pages/ErrorPages/ServerErrorPage';
import { logOutUser as logOutUserAction } from 'amo/reducers/users';
import createStore from 'amo/store';
import {
  setClientApp as setClientAppAction,
  setUserAgent as setUserAgentAction,
} from 'amo/reducers/api';
import {
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  INSTALL_STATE,
  maximumSetTimeoutDelay,
} from 'amo/constants';
import {
  createContextWithFakeRouter,
  createFakeLocation,
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeI18n,
  shallowUntilTarget,
  userAuthToken,
} from 'tests/unit/helpers';

// Skip `withCookies` HOC since Enzyme does not support the React Context API.
// See: https://github.com/mozilla/addons-frontend/issues/6839
jest.mock('react-cookie', () => ({
  withCookies: (component) => component,
}));

describe(__filename, () => {
  function renderProps(customProps = {}) {
    return {
      history: createMemoryHistory(),
      i18n: fakeI18n(),
      store: createStore().store,
      ...customProps,
    };
  }

  const render = (props = {}) => {
    const allProps = {
      ...renderProps(),
      ...props,
    };

    return shallowUntilTarget(<App {...allProps} />, AppBase, {
      shallowOptions: createContextWithFakeRouter(),
    });
  };

  it('sets up a callback for setting add-on status', () => {
    const dispatch = sinon.spy();
    const { handleGlobalEvent } = mapDispatchToProps(dispatch);
    const payload = { guid: '@my-addon', status: 'some-status' };

    handleGlobalEvent(payload);

    sinon.assert.calledWith(dispatch, { type: INSTALL_STATE, payload });
  });

  it('sets up a callback for setting the userAgentInfo', () => {
    const dispatch = sinon.spy();
    const { setUserAgent } = mapDispatchToProps(dispatch);
    const userAgent = 'tofubrowser';

    setUserAgent(userAgent);

    sinon.assert.calledWith(dispatch, setUserAgentAction(userAgent));
  });

  it('sets up a callback for setting the clientApp', () => {
    const dispatch = sinon.spy();
    const { setClientApp } = mapDispatchToProps(dispatch);
    const clientApp = CLIENT_APP_FIREFOX;

    setClientApp(clientApp);

    sinon.assert.calledWith(dispatch, setClientAppAction(clientApp));
  });

  it('sets the userAgent as props', () => {
    const { store } = createStore();
    store.dispatch(setUserAgentAction('tofubrowser'));
    const { userAgent } = mapStateToProps(store.getState());
    expect(userAgent).toEqual('tofubrowser');
  });

  it('uses navigator.userAgent if userAgent prop is empty', () => {
    const { store } = dispatchClientMetadata({
      userAgent: '',
    });
    const _navigator = { userAgent: 'Firefox 10000000.0' };

    const dispatchSpy = sinon.spy(store, 'dispatch');

    render({ _navigator, store });

    sinon.assert.calledWith(
      dispatchSpy,
      setUserAgentAction(_navigator.userAgent),
    );
  });

  it('resets the clientApp if it does not match the URL', () => {
    const currentClientApp = CLIENT_APP_FIREFOX;
    const clientAppInURL = CLIENT_APP_ANDROID;
    const { store } = dispatchClientMetadata({
      clientApp: currentClientApp,
    });

    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = render({ store });

    const location = createFakeLocation({
      pathname: `/en-US/${clientAppInURL}/`,
    });
    root.setProps({ location });

    sinon.assert.calledWith(dispatchSpy, setClientAppAction(clientAppInURL));
  });

  it('does not reset the clientApp if matches the URL', () => {
    const clientApp = CLIENT_APP_FIREFOX;
    const { store } = dispatchClientMetadata({ clientApp });

    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = render({ store });

    const location = createFakeLocation({
      pathname: `/en-US/${clientApp}/`,
    });
    root.setProps({ location });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('does not reset the clientApp if the one on the URL is invalid', () => {
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX });

    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = render({ store });

    const location = createFakeLocation({
      pathname: `/en-US/invalid-app/`,
    });
    root.setProps({ location });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('ignores a falsey navigator', () => {
    const { store } = dispatchClientMetadata({
      userAgent: '',
    });
    const _navigator = null;

    const dispatchSpy = sinon.spy(store, 'dispatch');

    render({ _navigator, store });

    // This simulates a server side scenario where we do not have a user
    // agent and do not have a global navigator.
    sinon.assert.neverCalledWithMatch(dispatchSpy, {
      type: 'SET_USER_AGENT',
    });
  });

  it('renders a response with a 200 status', () => {
    const root = render();
    expect(root.find(NestedStatus)).toHaveProp('code', 200);
  });

  it('configures a default HTML title for Firefox', () => {
    const lang = 'fr';
    const { store } = dispatchClientMetadata({
      clientApp: CLIENT_APP_FIREFOX,
      lang,
    });
    const root = render({ store });
    expect(root.find(Helmet)).toHaveProp(
      'defaultTitle',
      `Add-ons for Firefox (${lang})`,
    );
  });

  it('configures a default HTML title for Android', () => {
    const lang = 'fr';
    const { store } = dispatchClientMetadata({
      clientApp: CLIENT_APP_ANDROID,
      lang,
    });
    const root = render({ store });
    expect(root.find(Helmet)).toHaveProp(
      'defaultTitle',
      `Add-ons for Firefox Android (${lang})`,
    );
  });

  it('defines a HTML title template for Firefox', () => {
    const lang = 'fr';
    const { store } = dispatchClientMetadata({
      clientApp: CLIENT_APP_FIREFOX,
      lang,
    });
    const root = render({ store });
    expect(root.find(Helmet)).toHaveProp(
      'titleTemplate',
      `%s – Add-ons for Firefox (${lang})`,
    );
  });

  it('defines a HTML title template for Android', () => {
    const lang = 'fr';
    const { store } = dispatchClientMetadata({
      clientApp: CLIENT_APP_ANDROID,
      lang,
    });
    const root = render({ store });
    expect(root.find(Helmet)).toHaveProp(
      'titleTemplate',
      `%s – Add-ons for Firefox Android (${lang})`,
    );
  });

  describe('handling expired auth tokens', () => {
    let clock;
    let store;

    function renderAppWithAuth({ ...customProps } = {}) {
      const props = {
        store,
        ...customProps,
      };

      return render(props);
    }

    beforeEach(() => {
      store = dispatchSignInActions().store;
      clock = sinon.useFakeTimers(Date.now());
    });

    afterEach(() => {
      clock.restore();
    });

    it('logs out when the token expires', () => {
      const authTokenValidFor = 10; // seconds
      const dispatchSpy = sinon.spy(store, 'dispatch');

      renderAppWithAuth({ authTokenValidFor });

      const fuzz = 3; // account for the rounded offset calculation.
      clock.tick((authTokenValidFor + fuzz) * 1000);

      sinon.assert.calledWith(dispatchSpy, logOutUserAction());
    });

    it('only sets one timer when receiving new props', () => {
      const authTokenValidFor = 10; // seconds
      const dispatchSpy = sinon.spy(store, 'dispatch');

      const root = renderAppWithAuth({ authTokenValidFor });
      // Simulate updating the component with new properties.
      root.setProps();

      const fuzz = 3; // account for the rounded offset calculation.
      clock.tick((authTokenValidFor + fuzz) * 1000);

      sinon.assert.calledWith(dispatchSpy, logOutUserAction());
    });

    it('does not set a timer when receiving an empty auth token', () => {
      const authTokenValidFor = 10; // seconds
      store = dispatchClientMetadata().store;

      const dispatchSpy = sinon.spy(store, 'dispatch');

      render({ authTokenValidFor, store });
      dispatchSpy.resetHistory();

      const fuzz = 3; // account for the rounded offset calculation.
      clock.tick((authTokenValidFor + fuzz) * 1000);
      // Make sure log out was not called since the component does not have an
      // auth token.
      sinon.assert.notCalled(dispatchSpy);
    });

    it('does not log out until the token expires', () => {
      const authTokenValidFor = 10; // seconds
      const dispatchSpy = sinon.spy(store, 'dispatch');

      renderAppWithAuth({ authTokenValidFor });
      dispatchSpy.resetHistory();

      clock.tick(5 * 1000); // 5 seconds

      sinon.assert.notCalled(dispatchSpy);
    });

    it('only starts a timer when authTokenValidFor is configured', () => {
      const dispatchSpy = sinon.spy(store, 'dispatch');

      renderAppWithAuth({ authTokenValidFor: null });
      dispatchSpy.resetHistory();

      clock.tick(100 * 1000);

      sinon.assert.notCalled(dispatchSpy);
    });

    it('ignores malformed timestamps', () => {
      const authTokenValidFor = 10; // seconds
      const authToken = userAuthToken(
        {},
        {
          tokenCreatedAt: 'bogus-timestamp',
        },
      );

      store = dispatchSignInActions({ authToken }).store;
      const dispatchSpy = sinon.spy(store, 'dispatch');

      render({ authTokenValidFor, store });
      dispatchSpy.resetHistory();

      clock.tick(authTokenValidFor * 1000);

      sinon.assert.notCalled(dispatchSpy);
    });

    it('ignores empty timestamps', () => {
      const authTokenValidFor = 10; // seconds
      const authToken = 'this-is-a-token-with-an-empty-timestamp';

      store = dispatchSignInActions({ authToken }).store;
      const dispatchSpy = sinon.spy(store, 'dispatch');

      render({ authTokenValidFor, store });
      dispatchSpy.resetHistory();

      clock.tick(authTokenValidFor * 1000);

      sinon.assert.notCalled(dispatchSpy);
    });

    it('ignores malformed tokens', () => {
      const authTokenValidFor = 10; // seconds
      const authToken = 'not-auth-data:^&invalid-characters:not-a-signature';

      store = dispatchSignInActions({ authToken }).store;
      const dispatchSpy = sinon.spy(store, 'dispatch');

      render({ authTokenValidFor, store });
      dispatchSpy.resetHistory();

      clock.tick(authTokenValidFor * 1000);

      sinon.assert.notCalled(dispatchSpy);
    });

    it('does not set a timeout for expirations too far in the future', () => {
      const authTokenValidFor = maximumSetTimeoutDelay / 1000 + 1;
      const dispatchSpy = sinon.spy(store, 'dispatch');

      renderAppWithAuth({ authTokenValidFor });
      dispatchSpy.resetHistory();

      const fuzz = 3; // account for the rounded offset calculation.
      clock.tick((authTokenValidFor + fuzz) * 1000);

      sinon.assert.notCalled(dispatchSpy);
    });
  });

  describe('getErrorPage', () => {
    it('returns a NotAuthorizedPage component for 401 errors', () => {
      expect(getErrorPage(401)).toEqual(NotAuthorizedPage);
    });

    it('returns a NotFoundPage component for 404 errors', () => {
      expect(getErrorPage(404)).toEqual(NotFoundPage);
    });

    it('returns a ServerErrorPage component for 500 errors', () => {
      expect(getErrorPage(500)).toEqual(ServerErrorPage);
    });

    it('returns a ServerErrorPage component by default', () => {
      expect(getErrorPage(501)).toEqual(ServerErrorPage);
    });
  });
});
