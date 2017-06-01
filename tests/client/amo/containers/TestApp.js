import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { Provider } from 'react-redux';
import { loadFail } from 'redux-connect/lib/store';

import {
  AppBase,
  mapDispatchToProps,
  mapStateToProps,
} from 'amo/containers/App';
import createStore from 'amo/store';
import {
  logOutUser as logOutUserAction,
  setClientApp,
  setLang,
  setUserAgent as setUserAgentAction,
} from 'core/actions';
import { createApiError } from 'core/api';
import DefaultErrorPage from 'core/components/ErrorPage';
import { INSTALL_STATE, maximumSetTimeoutDelay } from 'core/constants';
import I18nProvider from 'core/i18n/Provider';
import { getFakeI18nInst, userAuthToken } from 'tests/client/helpers';


describe('App', () => {
  class FakeErrorPageComponent extends React.Component {
    render() {
      // eslint-disable-next-line react/prop-types
      return <div>{this.props.children}</div>;
    }
  }

  // eslint-disable-next-line react/no-multi-comp
  class FakeFooterComponent extends React.Component {
    render() {
      return <footer />;
    }
  }

  // eslint-disable-next-line react/no-multi-comp
  class FakeMastHeadComponent extends React.Component {
    render() {
      // eslint-disable-next-line react/prop-types
      return <div>{this.props.children}</div>;
    }
  }

  // eslint-disable-next-line react/no-multi-comp
  class FakeSearchFormComponent extends React.Component {
    render() {
      return <form />;
    }
  }

  const FakeInfoDialogComponent = () => <div />;

  function render({ children = [], ...customProps } = {}) {
    const props = {
      i18n: getFakeI18nInst(),
      logOutUser: sinon.stub(),
      location: sinon.stub(),
      isAuthenticated: true,
      store: createStore().store,
      ...customProps,
    };
    return findRenderedComponentWithType(renderIntoDocument(
      <Provider store={props.store}>
        <I18nProvider i18n={props.i18n}>
          <AppBase
            FooterComponent={FakeFooterComponent}
            InfoDialogComponent={FakeInfoDialogComponent}
            MastHeadComponent={FakeMastHeadComponent}
            SearchFormComponent={FakeSearchFormComponent}
            ErrorPage={FakeErrorPageComponent}
            setUserAgent={sinon.stub()}
            {...props}>
            {children}
          </AppBase>
        </I18nProvider>
      </Provider>
    ), AppBase);
  }

  it('renders its children', () => {
    // eslint-disable-next-line react/no-multi-comp
    class MyComponent extends React.Component {
      render() {
        return <p>The component</p>;
      }
    }
    const root = render({ children: [<MyComponent key="key" />] });
    const rootNode = findDOMNode(root);
    expect(rootNode.tagName.toLowerCase()).toEqual('div');
    expect(rootNode.querySelector('p').textContent).toEqual('The component');
  });

  it('sets the mamo cookie to "off"', () => {
    const fakeEvent = {
      preventDefault: sinon.stub(),
    };
    const fakeWindow = {
      location: {
        reload: sinon.stub(),
      },
    };
    const fakeCookieLib = {
      save: sinon.stub(),
    };

    const root = render();
    root.onViewDesktop(fakeEvent, { _window: fakeWindow, _cookie: fakeCookieLib });
    expect(fakeEvent.preventDefault.called).toBeTruthy();
    expect(fakeCookieLib.save.calledWith('mamo', 'off')).toBeTruthy();
    expect(fakeWindow.location.reload.called).toBeTruthy();
  });

  it('sets isHomePage to true when on the root path', () => {
    const location = { pathname: '/en-GB/android/' };
    const root = render({ clientApp: 'android', lang: 'en-GB', location });

    expect(root.mastHead.props.isHomePage).toBe(true);
  });

  it('sets isHomePage to true when on the root path without a slash', () => {
    const location = { pathname: '/en-GB/android' };
    const root = render({ clientApp: 'android', lang: 'en-GB', location });

    expect(root.mastHead.props.isHomePage).toBe(true);
  });

  it('sets isHomePage to false when not on the root path', () => {
    const location = { pathname: '/en-GB/android/404/' };
    const root = render({
      clientApp: 'android', lang: 'en-GB', location });

    expect(root.mastHead.props.isHomePage).toBe(false);
  });

  it('sets up a callback for setting add-on status', () => {
    const dispatch = sinon.spy();
    const { handleGlobalEvent } = mapDispatchToProps(dispatch);
    const payload = { guid: '@my-addon', status: 'some-status' };
    handleGlobalEvent(payload);
    expect(dispatch.calledWith({ type: INSTALL_STATE, payload })).toBeTruthy();
  });

  it('sets up a callback for setting the userAgentInfo', () => {
    const dispatch = sinon.spy();
    const { setUserAgent } = mapDispatchToProps(dispatch);
    const userAgent = 'tofubrowser';

    setUserAgent(userAgent);
    expect(dispatch.calledWith(setUserAgentAction(userAgent))).toBeTruthy();
  });

  it('sets the clientApp as props', () => {
    const { store } = createStore();
    store.dispatch(setClientApp('android'));
    const { clientApp } = mapStateToProps(store.getState());
    expect(clientApp).toEqual('android');
  });

  it('sets the lang as props', () => {
    const { store } = createStore();
    store.dispatch(setLang('de'));
    const { lang } = mapStateToProps(store.getState());
    expect(lang).toEqual('de');
  });

  it('sets the userAgent as props', () => {
    const { store } = createStore();
    store.dispatch(setUserAgentAction('tofubrowser'));
    const { userAgent } = mapStateToProps(store.getState());
    expect(userAgent).toEqual('tofubrowser');
  });

  it('uses navigator.userAgent if userAgent prop is empty', () => {
    const setUserAgent = sinon.stub();
    const _navigator = { userAgent: 'Firefox 10000000.0' };
    render({ _navigator, setUserAgent, userAgent: '' });

    expect(setUserAgent.firstCall.args[0]).toEqual(_navigator.userAgent);
  });

  it('renders an error component on error', () => {
    const { store } = createStore();
    const apiError = createApiError({
      apiURL: 'https://some-url',
      response: { status: 404 },
    });

    store.dispatch(loadFail('App', apiError));

    const root = render({
      ErrorPage: DefaultErrorPage,
      clientApp: 'android',
      lang: 'en-GB',
      location: { pathname: '/en-GB/android/' },
      store,
    });
    const rootNode = findDOMNode(root);

    expect(rootNode.textContent).toContain('Page not found');
  });

  describe('handling expired auth tokens', () => {
    let clock;

    function renderAppWithAuth(customProps = {}) {
      const props = {
        authToken: userAuthToken(),
        logOutUser: sinon.stub(),
        ...customProps,
      };
      return render(props);
    }

    beforeEach(() => {
      clock = sinon.useFakeTimers(Date.now());
    });

    afterEach(() => {
      clock.restore();
    });

    it('logs out when the token expires', () => {
      const authTokenValidFor = 10; // seconds
      const logOutUser = sinon.stub();

      renderAppWithAuth({ authTokenValidFor, logOutUser });

      const fuzz = 3; // account for the rounded offset calculation.
      clock.tick((authTokenValidFor + fuzz) * 1000);
      expect(logOutUser.called).toBeTruthy();
    });

    it('only sets one timer when receiving new props', () => {
      const authTokenValidFor = 10; // seconds
      const authToken = userAuthToken();
      const logOutUser = sinon.stub();

      const root = render({ authToken, authTokenValidFor, logOutUser });
      // Simulate updating the component with new properties.
      root.componentWillReceiveProps({ authToken });

      const fuzz = 3; // account for the rounded offset calculation.
      clock.tick((authTokenValidFor + fuzz) * 1000);
      expect(logOutUser.called).toBeTruthy();
      expect(logOutUser.calledOnce).toBeTruthy();
    });

    it('does not log out until the token expires', () => {
      const authTokenValidFor = 10; // seconds
      const logOutUser = sinon.stub();

      renderAppWithAuth({ authTokenValidFor, logOutUser });

      clock.tick(5 * 1000); // 5 seconds
      expect(logOutUser.called).toBeFalsy();
    });

    it('only starts a timer when authTokenValidFor is configured', () => {
      const logOutUser = sinon.stub();

      renderAppWithAuth({ authTokenValidFor: null, logOutUser });

      clock.tick(100 * 1000);
      expect(logOutUser.called).toBeFalsy();
    });

    it('ignores malformed timestamps', () => {
      const authTokenValidFor = 10; // seconds
      const authToken = userAuthToken({}, {
        tokenCreatedAt: 'bogus-timestamp',
      });
      const logOutUser = sinon.stub();

      render({ authToken, authTokenValidFor, logOutUser });

      clock.tick(authTokenValidFor * 1000);
      expect(logOutUser.called).toBeFalsy();
    });

    it('ignores empty timestamps', () => {
      const authTokenValidFor = 10; // seconds
      const authToken = 'this-is-a-token-with-an-empty-timestamp';
      const logOutUser = sinon.stub();

      render({ authToken, authTokenValidFor, logOutUser });

      clock.tick(authTokenValidFor * 1000);
      expect(logOutUser.called).toBeFalsy();
    });

    it('ignores malformed tokens', () => {
      const authTokenValidFor = 10; // seconds
      const authToken = 'not-auth-data:^&invalid-characters:not-a-signature';
      const logOutUser = sinon.stub();

      render({ authToken, authTokenValidFor, logOutUser });

      clock.tick(authTokenValidFor * 1000);
      expect(logOutUser.called).toBeFalsy();
    });

    it('does not set a timeout for expirations too far in the future', () => {
      const authTokenValidFor = (maximumSetTimeoutDelay / 1000) + 1;
      const logOutUser = sinon.stub();

      renderAppWithAuth({ authTokenValidFor, logOutUser });

      const fuzz = 3; // account for the rounded offset calculation.
      clock.tick((authTokenValidFor + fuzz) * 1000);
      expect(logOutUser.called).toBeFalsy();
    });

    it('maps a logOutUser action', () => {
      const dispatch = sinon.stub();
      const { logOutUser } = mapDispatchToProps(dispatch);
      logOutUser();
      expect(dispatch.firstCall.args[0]).toEqual(logOutUserAction());
    });
  });
});
