import React from 'react';

import { shallowRender } from 'tests/client/helpers';
import { mapStateToProps, LoginRequired } from 'core/containers/LoginRequired';
import LoginPage from 'core/components/LoginPage';

describe('<LoginRequired />', () => {
  class MyComponent extends React.Component {
    render() {
      return <p>Authenticated content.</p>;
    }
  }

  it('renders <LoginPage /> when unauthenticated', () => {
    const root = shallowRender(
      <LoginRequired authenticated={false}>
        <MyComponent />
      </LoginRequired>
    );
    assert.equal(root.type, LoginPage);
  });

  it('renders the children when authenticated', () => {
    const root = shallowRender(
      <LoginRequired authenticated>
        <MyComponent />
      </LoginRequired>
    );
    assert.equal(root.type, MyComponent);
  });

  describe('mapStateToProps', () => {
    it('sets authenticated to true when there is a token', () => {
      assert.deepEqual(
        mapStateToProps({auth: {token: 'foo'}}),
        {authenticated: true});
    });

    it('sets authenticated to false when there is not a token', () => {
      assert.deepEqual(
        mapStateToProps({auth: {}}),
        {authenticated: false});
    });
  });
});
