import config from 'config';
import React from 'react';
import {
  Simulate, findRenderedComponentWithType, renderIntoDocument,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';

import { setAuthToken } from 'core/actions';
import * as api from 'core/api';
import {
  AuthenticateButtonBase,
  mapDispatchToProps,
  mapStateToProps,
} from 'core/components/AuthenticateButton';
import {
  dispatchAnonymousActions,
  dispatchSignInActions,
} from 'tests/unit/amo/helpers';
import { getFakeI18nInst, userAuthToken } from 'tests/unit/helpers';
import Icon from 'ui/components/Icon';


describe('<AuthenticateButton />', () => {
  function renderTree(props) {
    const { store } = dispatchSignInActions();

    return findRenderedComponentWithType(renderIntoDocument(
      <Provider store={store}>
        <AuthenticateButtonBase i18n={getFakeI18nInst()} {...props} />
      </Provider>
    ), AuthenticateButtonBase);
  }

  const render = (props) => findDOMNode(renderTree(props));

  it('passes along a className', () => {
    const root = render({ className: 'MyComponent-auth-button' });
    expect(root.classList.contains('MyComponent-auth-button')).toBeTruthy();
  });

  it('renders an Icon by default', () => {
    const root = renderTree();
    const icon = findRenderedComponentWithType(root, Icon);
    expect(icon).toBeTruthy();
  });

  it('lets you hide the Icon', () => {
    const root = renderTree({ noIcon: true });
    expect(() => findRenderedComponentWithType(root, Icon))
      .toThrowError(/Did not find exactly one match/);
  });

  it('lets you customize the log in text', () => {
    const root = render({ isAuthenticated: false, logInText: 'Maybe log in?' });
    expect(root.textContent).toEqual('Maybe log in?');
  });

  it('lets you customize the log out text', () => {
    const root = render({ isAuthenticated: true, logOutText: 'Maybe log out?' });
    expect(root.textContent).toEqual('Maybe log out?');
  });

  it('shows a log in button when unauthenticated', () => {
    const handleLogIn = sinon.spy();
    const location = sinon.stub();
    const root = render({ isAuthenticated: false, handleLogIn, location });
    expect(root.textContent).toEqual('Log in/Sign up');
    Simulate.click(root);
    expect(handleLogIn.calledWith(location)).toBeTruthy();
  });

  it('shows a log out button when authenticated', () => {
    const handleLogOut = sinon.spy();
    const root = render({ handleLogOut, isAuthenticated: true });
    expect(root.textContent).toEqual('Log out');
    Simulate.click(root);
    expect(handleLogOut.called).toBeTruthy();
  });

  it('updates the location on handleLogIn', () => {
    const _window = { location: '/foo' };
    const location = { pathname: '/bar', query: { q: 'wat' } };
    const startLoginUrlStub =
      sinon.stub(api, 'startLoginUrl').returns('https://a.m.org/login');
    const { handleLogIn } = mapStateToProps({
      auth: {},
      api: { lang: 'en-GB' },
    });
    handleLogIn(location, { _window });
    expect(_window.location).toEqual('https://a.m.org/login');
    expect(startLoginUrlStub.calledWith({ location })).toBeTruthy();
  });

  it('gets the server to clear cookie and auth token in handleLogOut', () => {
    sinon.stub(api, 'logOutFromServer').returns(Promise.resolve());
    const _config = {
      cookieName: 'authcookie',
      apiHost: 'http://localhost:9876',
    };
    sinon.stub(config, 'get', (key) => _config[key]);

    const { store } = dispatchSignInActions();
    store.dispatch(setAuthToken(userAuthToken({ user_id: 99 })));
    const apiConfig = { token: store.getState().api.token };
    expect(apiConfig.token).toBeTruthy();

    const { handleLogOut } = mapDispatchToProps(store.dispatch);
    return handleLogOut({ api: apiConfig })
      .then(() => {
        expect(store.getState().api.token).toBeFalsy();
        expect(api.logOutFromServer.firstCall.args[0]).toEqual({ api: apiConfig });
      });
  });

  it('pulls isAuthenticated from state', () => {
    const { store } = dispatchAnonymousActions();
    expect(mapStateToProps(store.getState()).isAuthenticated).toEqual(false);
    store.dispatch(setAuthToken(userAuthToken({ user_id: 123 })));
    expect(mapStateToProps(store.getState()).isAuthenticated).toEqual(true);
  });
});
