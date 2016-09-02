import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';

import LoginPage from 'core/components/LoginPage';

describe('<LoginPage />', () => {
  function render(props = {}) {
    return findDOMNode(renderIntoDocument(<LoginPage {...props} />));
  }

  it('has a header', () => {
    const root = render();
    assert.equal(root.querySelector('h1').textContent, 'Login Required');
  });

  it('has a default message', () => {
    const root = render();
    assert.equal(
      root.querySelector('.login-message').textContent,
      'You must be logged in to access this page.');
  });

  it('can accept a message', () => {
    const root = render({ message: 'My custom login message.' });
    assert.equal(
      root.querySelector('.login-message').textContent,
      'My custom login message.');
  });

  it('has a button to the login URL', () => {
    const root = render();
    const loginLink = root.querySelector('a');
    assert.equal(loginLink.pathname, '/api/v3/accounts/login/start/');
    assert.equal(loginLink.textContent, 'Login');
  });
});
