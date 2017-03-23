import config from 'config';
import React from 'react';
import {
  Simulate, findRenderedComponentWithType, renderIntoDocument,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { combineReducers, createStore as _createStore } from 'redux';

import { setAuthToken } from 'core/actions';
import * as api from 'core/api';
import {
  AuthenticateButtonBase,
  mapDispatchToProps,
  mapStateToProps,
} from 'core/components/AuthenticateButton';
import apiReducer from 'core/reducers/api';
import { getFakeI18nInst, userAuthToken } from 'tests/client/helpers';
import Icon from 'ui/components/Icon';

function createStore() {
  return _createStore(combineReducers({ api: apiReducer }));
}

describe('<AuthenticateButton />', () => {
  const renderTree = (props) => renderIntoDocument(
    <AuthenticateButtonBase i18n={getFakeI18nInst()} {...props} />);

  const render = (props) => findDOMNode(renderTree(props));

  it('passes along a className', () => {
    const root = render({ className: 'MyComponent-auth-button' });
    assert.ok(root.classList.contains('MyComponent-auth-button'));
  });

  it('renders an Icon by default', () => {
    const root = renderTree();
    const icon = findRenderedComponentWithType(root, Icon);
    assert.ok(icon, 'Icon was not rendered');
  });

  it('lets you hide the Icon', () => {
    const root = renderTree({ noIcon: true });
    assert.throws(
      () => findRenderedComponentWithType(root, Icon),
      /Did not find exactly one match/);
  });

  it('lets you customize the log in text', () => {
    const root = render({ isAuthenticated: false, logInText: 'Maybe log in?' });
    assert.equal(root.textContent, 'Maybe log in?');
  });

  it('lets you customize the log out text', () => {
    const root = render({ isAuthenticated: true, logOutText: 'Maybe log out?' });
    assert.equal(root.textContent, 'Maybe log out?');
  });

  it('shows a log in button when unauthenticated', () => {
    const handleLogIn = sinon.spy();
    const location = sinon.stub();
    const root = render({ isAuthenticated: false, handleLogIn, location });
    assert.equal(root.textContent, 'Log in/Sign up');
    Simulate.click(root);
    assert.ok(handleLogIn.calledWith(location));
  });

  it('shows a log out button when authenticated', () => {
    const handleLogOut = sinon.spy();
    const root = render({ handleLogOut, isAuthenticated: true });
    assert.equal(root.textContent, 'Log out');
    Simulate.click(root);
    assert.ok(handleLogOut.called);
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
    assert.equal(_window.location, 'https://a.m.org/login');
    assert.ok(startLoginUrlStub.calledWith({ location }));
  });

  it('gets the server to clear cookie and auth token in handleLogOut', () => {
    sinon.stub(api, 'logOutFromServer').returns(Promise.resolve());
    const _config = {
      cookieName: 'authcookie',
      apiHost: 'http://localhost:9876',
    };
    sinon.stub(config, 'get', (key) => _config[key]);

    const store = createStore();
    store.dispatch(setAuthToken(userAuthToken({ user_id: 99 })));
    const apiConfig = { token: store.getState().api.token };
    assert.ok(apiConfig.token, 'token was falsey');

    const { handleLogOut } = mapDispatchToProps(store.dispatch);
    return handleLogOut({ api: apiConfig })
      .then(() => {
        assert.notOk(store.getState().api.token);
        assert.deepEqual(
          api.logOutFromServer.firstCall.args[0], { api: apiConfig });
      });
  });

  it('pulls isAuthenticated from state', () => {
    const store = createStore(combineReducers({ api }));
    assert.equal(mapStateToProps(store.getState()).isAuthenticated, false);
    store.dispatch(setAuthToken(userAuthToken({ user_id: 123 })));
    assert.equal(mapStateToProps(store.getState()).isAuthenticated, true);
  });
});
