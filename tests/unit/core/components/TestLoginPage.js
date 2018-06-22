import * as React from 'react';
import { renderIntoDocument } from 'react-dom/test-utils';
import { findDOMNode } from 'react-dom';

import LoginPage from 'core/components/LoginPage';
import * as api from 'core/api';
import { fakeRouterLocation } from 'tests/unit/helpers';

describe('<LoginPage />', () => {
  const location = fakeRouterLocation();

  function render(props) {
    return findDOMNode(renderIntoDocument(<LoginPage {...props} />));
  }

  it('has a header', () => {
    const root = render({ location });
    expect(root.querySelector('h1').textContent).toEqual('Login Required');
  });

  it('has a default message', () => {
    const root = render({ location });
    expect(root.querySelector('.login-message').textContent).toEqual(
      'You must be logged in to access this page.',
    );
  });

  it('can accept a message', () => {
    const root = render({ location, message: 'My custom login message.' });
    expect(root.querySelector('.login-message').textContent).toEqual(
      'My custom login message.',
    );
  });

  it('has a button to the login URL', () => {
    const startLoginUrl = sinon
      .stub(api, 'startLoginUrl')
      .returns('https://a.m.org/login/start/');
    const root = render({ location });
    const loginLink = root.querySelector('a');
    expect(loginLink.href).toEqual('https://a.m.org/login/start/');
    expect(loginLink.textContent).toEqual('Login');
    expect(startLoginUrl.calledWith({ location })).toBeTruthy();
  });
});
