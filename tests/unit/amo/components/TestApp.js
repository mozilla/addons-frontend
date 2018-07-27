/* eslint-disable react/no-multi-comp */
import { createMemoryHistory } from 'history';
import * as React from 'react';
import { findDOMNode } from 'react-dom';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-dom/test-utils';
import NestedStatus from 'react-nested-status';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
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
  createContextWithFakeRouter,
  fakeCookie,
  fakeI18n,
  fakeRouterLocation,
  shallowUntilTarget,
  userAuthToken,
} from 'tests/unit/helpers';
import {
  dispatchClientMetadata,
  dispatchSignInActions,
} from 'tests/unit/amo/helpers';

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

  const FakeInfoDialogComponent = () => <div />;

  function renderProps(customProps = {}) {
    return {
      history: createMemoryHistory(),
      i18n: fakeI18n(),
      store: createStore().store,
      ...customProps,
    };
  }

  function render({ ...customProps } = {}) {
    const { history, i18n, store, ...props } = renderProps(customProps);

    return findRenderedComponentWithType(
      renderIntoDocument(
        <Provider store={store}>
          <I18nProvider i18n={i18n}>
            <Router history={history}>
              <App
                FooterComponent={FakeFooterComponent}
                InfoDialogComponent={FakeInfoDialogComponent}
                HeaderComponent={FakeHeaderComponent}
                ErrorPage={FakeErrorPageComponent}
                setUserAgent={sinon.stub()}
                {...props}
              />
            </Router>
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

    return shallowUntilTarget(<App {...allProps} />, AppBase, {
      shallowOptions: createContextWithFakeRouter(),
    });
  };

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
    sinon.assert.called(fakeEvent.preventDefault);
    sinon.assert.calledWith(_cookie.save, 'mamo', 'off', { path: '/' });
    sinon.assert.called(fakeWindow.location.reload);
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
      root.componentWillReceiveProps({});

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
});
