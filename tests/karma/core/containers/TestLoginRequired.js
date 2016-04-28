import React from 'react';

import { shallowRender } from '../../../utils';
import { mapStateToProps, LoginRequired } from 'core/containers/LoginRequired';
import LoginPage from 'core/components/LoginPage';

describe('LoginRequired helpers', () => {
  class MyComponent extends React.Component {
    render() {
      return <p>Authenticated content.</p>;
    }
  }

  describe('rendered component when not authenticated', () => {
    it('renders <LoginPage />', () => {
      const root = shallowRender(<LoginRequired Component={MyComponent} authenticated={false} />);
      assert.equal(root.type, LoginPage);
    });
  });

  describe('rendered component when authenticated', () => {
    it('renders the child component', () => {
      const root = shallowRender(<LoginRequired Component={MyComponent} authenticated />);
      assert.equal(root.type, MyComponent);
    });

    it('passes along its props', () => {
      const root = shallowRender(
        <LoginRequired Component={MyComponent} authenticated foo="bar" />);
      assert.deepEqual(root.props, {foo: 'bar'});
    });
  });

  describe('mapStateToProps', () => {
    it('sets authenticated and Component when authenticated', () => {
      assert.deepEqual(
        mapStateToProps(MyComponent)({auth: {token: 'foo'}}),
        {authenticated: true, Component: MyComponent});
    });

    it('sets authenticated and Component when unauthenticated', () => {
      assert.deepEqual(
        mapStateToProps(MyComponent)({auth: {}}),
        {authenticated: false, Component: MyComponent});
    });
  });
});
