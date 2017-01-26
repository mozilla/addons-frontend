import config from 'config';
import React from 'react';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';
import cookie from 'react-cookie';
import { findDOMNode } from 'react-dom';

import createStore from 'amo/store';
import { setJwt } from 'core/actions';
import * as api from 'core/api';
import {
  AuthenticateButtonBase,
  mapDispatchToProps,
  mapStateToProps,
} from 'core/components/AuthenticateButton';
import { getFakeI18nInst, userAuthToken } from 'tests/client/helpers';

describe('<AuthenticateButton />', () => {
  function render(props) {
    return findDOMNode(
        renderIntoDocument(<AuthenticateButtonBase i18n={getFakeI18nInst()} {...props} />));
  }

  it('passes along a className', () => {
    const root = render({ className: 'MyComponent-auth-button' });
    assert.ok(root.classList.contains('MyComponent-auth-button'));
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
    const startLoginUrlStub = sinon.stub(api, 'startLoginUrl').returns('https://a.m.org/login');
    const { handleLogIn } = mapStateToProps({
      auth: {},
      api: { lang: 'en-GB' },
    });
    handleLogIn(location, { _window });
    assert.equal(_window.location, 'https://a.m.org/login');
    assert.ok(startLoginUrlStub.calledWith({ location }));
  });

  it('clears the cookie and JWT on handleLogOut', () => {
    sinon.stub(cookie, 'remove');
    sinon.stub(config, 'get').withArgs('cookieName').returns('authcookie');
    const store = createStore();
    store.dispatch(setJwt(userAuthToken({ user_id: 99 })));
    const { handleLogOut } = mapDispatchToProps(store.dispatch);
    assert.ok(store.getState().api.token);
    handleLogOut();
    assert.notOk(store.getState().api.token);
    assert.ok(cookie.remove.calledWith('authcookie', { path: '/' }));
  });
});
