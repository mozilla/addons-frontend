import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';

import LoginPage from 'core/components/LoginPage';
import * as api from 'core/api';

describe('<LoginPage />', () => {
  const location = { pathname: '/foo' };

  function render(props) {
    return findDOMNode(renderIntoDocument(<LoginPage {...props} />));
  }

  it('has a header', () => {
    const root = render({ location });
    assert.equal(root.querySelector('h1').textContent, 'Login Required');
  });

  it('has a default message', () => {
    const root = render({ location });
    assert.equal(
      root.querySelector('.login-message').textContent,
      'You must be logged in to access this page.');
  });

  it('can accept a message', () => {
    const root = render({ location, message: 'My custom login message.' });
    assert.equal(
      root.querySelector('.login-message').textContent,
      'My custom login message.');
  });

  it('has a button to the login URL', () => {
    const startLoginUrl = sinon.stub(api, 'startLoginUrl').returns('https://a.m.org/login/start/');
    const root = render({ location });
    const loginLink = root.querySelector('a');
    assert.equal(loginLink.href, 'https://a.m.org/login/start/');
    assert.equal(loginLink.textContent, 'Login');
    assert.ok(startLoginUrl.calledWith({ location }));
  });
});
