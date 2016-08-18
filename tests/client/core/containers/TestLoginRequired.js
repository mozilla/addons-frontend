import React from 'react';

import { mapStateToProps, LoginRequiredBase }
  from 'core/containers/LoginRequired';
import LoginPage from 'core/components/LoginPage';

import { shallowRender } from '../../helpers';

describe('<LoginRequired />', () => {
  class MyComponent extends React.Component {
    render() {
      return <p>Authenticated content.</p>;
    }
  }

  it('renders <LoginPage /> when unauthenticated', () => {
    const root = shallowRender(
      <LoginRequiredBase authenticated={false}>
        <MyComponent />
      </LoginRequiredBase>
    );
    assert.equal(root.type, LoginPage);
  });

  it('renders the children when authenticated', () => {
    const root = shallowRender(
      <LoginRequiredBase authenticated>
        <MyComponent />
      </LoginRequiredBase>
    );
    assert.equal(root.type, MyComponent);
  });

  describe('mapStateToProps', () => {
    it('sets authenticated to true when there is a token', () => {
      assert.deepEqual(
        mapStateToProps({ auth: { token: 'foo' } }),
        { authenticated: true });
    });

    it('sets authenticated to false when there is not a token', () => {
      assert.deepEqual(
        mapStateToProps({ auth: {} }),
        { authenticated: false });
    });
  });
});
