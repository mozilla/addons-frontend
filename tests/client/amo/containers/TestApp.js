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
  setClientApp,
  setLang,
  setUserAgent as setUserAgentAction,
} from 'core/actions';
import { logOutUser as logOutUserAction } from 'core/actions';
import { createApiError } from 'core/api';
import DefaultErrorPage from 'core/components/ErrorPage';
import { INSTALL_STATE } from 'core/constants';
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
      store: createStore(),
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
    const root = render({ children: [<MyComponent />] });
    const rootNode = findDOMNode(root);
    assert.equal(rootNode.tagName.toLowerCase(), 'div');
    assert.equal(rootNode.querySelector('p').textContent, 'The component');
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
    root.onViewDesktop(fakeEvent, { window_: fakeWindow, cookie_: fakeCookieLib });
    assert.ok(fakeEvent.preventDefault.called);
    assert.ok(fakeCookieLib.save.calledWith('mamo', 'off'));
    assert.ok(fakeWindow.location.reload.called);
  });

  it('sets isHomePage to true when on the root path', () => {
    const location = { pathname: '/en-GB/android/' };
    const root = render({ clientApp: 'android', lang: 'en-GB', location });

    assert.isTrue(root.mastHead.props.isHomePage);
  });

  it('sets isHomePage to true when on the root path without a slash', () => {
    const location = { pathname: '/en-GB/android' };
    const root = render({ clientApp: 'android', lang: 'en-GB', location });

    assert.isTrue(root.mastHead.props.isHomePage);
  });

  it('sets isHomePage to false when not on the root path', () => {
    const location = { pathname: '/en-GB/android/404/' };
    const root = render({
      clientApp: 'android', lang: 'en-GB', location });

    assert.isFalse(root.mastHead.props.isHomePage);
  });

  it('sets up a callback for setting add-on status', () => {
    const dispatch = sinon.spy();
    const { handleGlobalEvent } = mapDispatchToProps(dispatch);
    const payload = { guid: '@my-addon', status: 'some-status' };
    handleGlobalEvent(payload);
    assert.ok(dispatch.calledWith({ type: INSTALL_STATE, payload }));
  });

  it('sets up a callback for setting the userAgentInfo', () => {
    const dispatch = sinon.spy();
    const { setUserAgent } = mapDispatchToProps(dispatch);
    const userAgent = 'tofubrowser';

    setUserAgent(userAgent);
    assert.ok(dispatch.calledWith(setUserAgentAction(userAgent)));
  });

  it('sets the clientApp as props', () => {
    const store = createStore();
    store.dispatch(setClientApp('android'));
    const { clientApp } = mapStateToProps(store.getState());
    assert.equal(clientApp, 'android');
  });

  it('sets the lang as props', () => {
    const store = createStore();
    store.dispatch(setLang('de'));
    const { lang } = mapStateToProps(store.getState());
    assert.equal(lang, 'de');
  });

  it('sets the userAgent as props', () => {
    const store = createStore();
    store.dispatch(setUserAgentAction('tofubrowser'));
    const { userAgent } = mapStateToProps(store.getState());
    assert.equal(userAgent, 'tofubrowser');
  });

  it('uses navigator.userAgent if userAgent prop is empty', () => {
    const setUserAgent = sinon.stub();
    const _navigator = { userAgent: 'Firefox 10000000.0' };
    render({ _navigator, setUserAgent, userAgent: '' });

    assert.equal(setUserAgent.firstCall.args[0], _navigator.userAgent);
  });

  it('renders an error component on error', () => {
    const store = createStore();
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

    assert.include(rootNode.textContent, 'Page not found');
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

      const fuzz = 3; // acount for rounding the offset calculation.
      clock.tick((authTokenValidFor + fuzz) * 1000);
      assert.ok(logOutUser.called, 'expected logOutUser() to be called');
    });

    it('only sets one timer when receiving new props', () => {
      const authTokenValidFor = 10; // seconds
      const authToken = userAuthToken();
      const logOutUser = sinon.stub();

      const root = render({ authToken, authTokenValidFor, logOutUser });
      // Simulate updating the component with new properties.
      root.componentWillReceiveProps({ authToken });

      const fuzz = 3; // acount for rounding the offset calculation.
      clock.tick((authTokenValidFor + fuzz) * 1000);
      assert.ok(logOutUser.called, 'expected logOutUser() to be called');
      assert.ok(logOutUser.calledOnce,
        'logOutUser() should only be called once');
    });

    it('does not log out until the token expires', () => {
      const authTokenValidFor = 10; // seconds
      const logOutUser = sinon.stub();

      renderAppWithAuth({ authTokenValidFor, logOutUser });

      clock.tick(5 * 1000); // 5 seconds
      assert.notOk(logOutUser.called,
        'expected logOutUser() to NOT be called');
    });

    it('only starts a timer when authTokenValidFor is configured', () => {
      const logOutUser = sinon.stub();

      renderAppWithAuth({ authTokenValidFor: null, logOutUser });

      clock.tick(100 * 1000);
      assert.notOk(logOutUser.called,
        'expected logOutUser() NOT to be called');
    });

    it('ignores malformed timestamps', () => {
      const authTokenValidFor = 10; // seconds
      const authToken = userAuthToken({}, {
        tokenCreatedAt: 'bogus-timestamp',
      });
      const logOutUser = sinon.stub();

      render({ authToken, authTokenValidFor, logOutUser });

      clock.tick(authTokenValidFor * 1000);
      assert.notOk(logOutUser.called,
        'expected logOutUser() NOT to be called');
    });

    it('ignores empty timestamps', () => {
      const authTokenValidFor = 10; // seconds
      const authToken = 'this-is-a-token-with-an-empty-timestamp';
      const logOutUser = sinon.stub();

      render({ authToken, authTokenValidFor, logOutUser });

      clock.tick(authTokenValidFor * 1000);
      assert.notOk(logOutUser.called,
        'expected logOutUser() NOT to be called');
    });

    it('ignores malformed tokens', () => {
      const authTokenValidFor = 10; // seconds
      const authToken = 'not-auth-data:^&invalid-characters:not-a-signature';
      const logOutUser = sinon.stub();

      render({ authToken, authTokenValidFor, logOutUser });

      clock.tick(authTokenValidFor * 1000);
      assert.notOk(logOutUser.called,
        'expected logOutUser() NOT to be called');
    });

    it('maps a logOutUser action', () => {
      const dispatch = sinon.stub();
      const { logOutUser } = mapDispatchToProps(dispatch);
      logOutUser();
      assert.deepEqual(dispatch.firstCall.args[0], logOutUserAction());
    });
  });
});
