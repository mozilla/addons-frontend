import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import config from 'config';
import loginRequired from 'core/containers/LoginRequired';

describe('loginRequired', () => {
  class MyComponent extends React.Component {
    render() {
      return <p>Authenticated content.</p>;
    }
  }
  const LoginRequiredMyComponent = loginRequired(MyComponent);

  describe('when not authenticated', () => {
    const state = {auth: {}};
    const store = createStore((s = {}) => s, state);
    const root = findDOMNode(renderIntoDocument(
      <Provider store={store}>
        <LoginRequiredMyComponent />
      </Provider>
    ));

    it('renders the login page', () => {
      assert.equal(root.querySelector('h1').textContent, 'Login Required');
    });

    it('the login button goes to the start login URL', () => {
      assert.equal(root.querySelector('a').href, config.get('startLoginUrl'));
    });
  });

  describe('when authenticated', () => {
    const state = {auth: {token: 'my.JWT.token'}};
    const store = createStore((s = {}) => s, state);
    const root = findDOMNode(renderIntoDocument(
      <Provider store={store}>
        <LoginRequiredMyComponent />
      </Provider>
    ));

    it('renders the child component', () => {
      assert.equal(root.textContent, 'Authenticated content.');
    });
  });
});
