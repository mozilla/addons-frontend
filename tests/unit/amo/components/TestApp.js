/* eslint-disable react/no-multi-comp */
import * as React from 'react';
import { findDOMNode } from 'react-dom';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-dom/test-utils';
import NestedStatus from 'react-nested-status';
import { Provider } from 'react-redux';
import Helmet from 'react-helmet';

import App, {
  AppBase,
  mapDispatchToProps,
  mapStateToProps,
} from 'amo/components/App';
import { logOutUser as logOutUserAction } from 'amo/reducers/users';
import createStore from 'amo/store';
import { setUserAgent as setUserAgentAction } from 'core/actions';
import { createApiError } from 'core/api';
import DefaultErrorPage from 'core/components/ErrorPage';
import {
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  INSTALL_STATE,
  maximumSetTimeoutDelay,
} from 'core/constants';
import I18nProvider from 'core/i18n/Provider';
import { loadErrorPage } from 'core/reducers/errorPage';
import {
  fakeCookie,
  fakeI18n,
  fakeRouterLocation,
  shallowUntilTarget,
  userAuthToken,
} from 'tests/unit/helpers';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  class FakeErrorPageComponent extends React.Component {
    render() {
      // eslint-disable-next-line react/prop-types
      return <div>{this.props.children}</div>;
    }
  }

  class FakeFooterComponent extends React.Component {
    render() {
      return <footer />;
    }
  }

  class FakeHeaderComponent extends React.Component {
    render() {
      // eslint-disable-next-line react/prop-types
      return <div>{this.props.children}</div>;
    }
  }

  class FakeSearchFormComponent extends React.Component {
    render() {
      return <form />;
    }
  }

  const FakeInfoDialogComponent = () => <div />;

  function renderProps(customProps = {}) {
    return {
      i18n: fakeI18n(),
      logOutUser: sinon.stub(),
      location: fakeRouterLocation(),
      isAuthenticated: true,
      store: createStore().store,
      ...customProps,
    };
  }

  function render({ children = [], ...customProps } = {}) {
    const props = renderProps(customProps);
    return findRenderedComponentWithType(
      renderIntoDocument(
        <Provider store={props.store}>
          <I18nProvider i18n={props.i18n}>
            <AppBase
              FooterComponent={FakeFooterComponent}
              InfoDialogComponent={FakeInfoDialogComponent}
              HeaderComponent={FakeHeaderComponent}
              SearchFormComponent={FakeSearchFormComponent}
              ErrorPage={FakeErrorPageComponent}
              setUserAgent={sinon.stub()}
              {...props}
            >
              {children}
            </AppBase>
          </I18nProvider>
        </Provider>,
      ),
      AppBase,
    );
  }

  const shallowRender = ({ ...props }) => {
    const allProps = {
      ...renderProps(),
      ...props,
    };

    return shallowUntilTarget(<App {...allProps} />, AppBase);
  };

  it('renders its children', () => {
    const root = shallowRender({
      children: <p className="child">The component</p>,
    });
    expect(root.find('.child').text()).toEqual('The component');
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
    const _cookie = fakeCookie();

    const root = render();
    root.onViewDesktop(fakeEvent, {
      _window: fakeWindow,
      _cookie,
    });
    expect(fakeEvent.preventDefault.called).toBeTruthy();
    sinon.assert.calledWith(_cookie.save, 'mamo', 'off', { path: '/' });
    expect(fakeWindow.location.reload.called).toBeTruthy();
  });

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

    sinon.assert.calledWith(setUserAgent, _navigator.userAgent);
  });

  it('ignores a falsey navigator', () => {
    const setUserAgent = sinon.stub();
    render({ _navigator: null, setUserAgent, userAgent: '' });

    // This simulates a server side scenario where we do not have a user
    // agent and do not have a global navigator.
    sinon.assert.notCalled(setUserAgent);
  });

  it('renders an error component on error', () => {
    const { store } = createStore();
    const apiError = createApiError({
      apiURL: 'https://some-url',
      response: { status: 404 },
    });

    store.dispatch(loadErrorPage({ error: apiError }));

    const root = render({
      ErrorPage: DefaultErrorPage,
      clientApp: 'android',
      lang: 'en-GB',
      location: fakeRouterLocation({ pathname: '/en-GB/android/' }),
      store,
    });
    const rootNode = findDOMNode(root);

    expect(rootNode.textContent).toContain('Page not found');
  });

  it('renders a response with a 200 status', () => {
    const root = shallowRender();
    expect(root.find(NestedStatus)).toHaveProp('code', 200);
  });

  it('configures a default HTML title for Firefox', () => {
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX });
    const root = shallowRender({ store });
    expect(root.find(Helmet)).toHaveProp('defaultTitle', 'Add-ons for Firefox');
  });

  it('configures a default HTML title for Android', () => {
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID });
    const root = shallowRender({ store });
    expect(root.find(Helmet)).toHaveProp('defaultTitle', 'Add-ons for Android');
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

    it('does not set a timer when receiving an empty auth token', () => {
      const authTokenValidFor = 10; // seconds
      const logOutUser = sinon.stub();

      const root = render({ authTokenValidFor, logOutUser });
      root.componentWillReceiveProps({ authToken: null });

      const fuzz = 3; // account for the rounded offset calculation.
      clock.tick((authTokenValidFor + fuzz) * 1000);
      // Make sure log out was not called since the component
      // does not have an auth token.
      sinon.assert.notCalled(logOutUser);
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
      const authToken = userAuthToken(
        {},
        {
          tokenCreatedAt: 'bogus-timestamp',
        },
      );
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
      const authTokenValidFor = maximumSetTimeoutDelay / 1000 + 1;
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
