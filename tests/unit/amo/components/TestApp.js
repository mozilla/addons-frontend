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
import createStore from 'amo/store';
import {
  setClientApp as setClientAppAction,
  setUserAgent as setUserAgentAction,
} from 'amo/reducers/api';
import {
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  INSTALL_STATE,
} from 'amo/constants';
import {
  createContextWithFakeRouter,
  createFakeLocation,
  dispatchClientMetadata,
  fakeI18n,
  shallowUntilTarget,
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
