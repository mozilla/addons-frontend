import React from 'react';

import { mapStateToProps, LoginRequiredBase }
  from 'core/containers/LoginRequired';
import LoginPage from 'core/components/LoginPage';
import { shallowRender } from 'tests/unit/helpers';

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
    expect(root.type).toEqual(LoginPage);
  });

  it('renders the children when authenticated', () => {
    const root = shallowRender(
      <LoginRequiredBase authenticated>
        <MyComponent />
      </LoginRequiredBase>
    );
    expect(root.type).toEqual(MyComponent);
  });

  describe('mapStateToProps', () => {
    it('sets authenticated to true when there is a token', () => {
      expect(mapStateToProps({ auth: { token: 'foo' } })).toEqual({ authenticated: true });
    });

    it('sets authenticated to false when there is not a token', () => {
      expect(mapStateToProps({ auth: {} })).toEqual({ authenticated: false });
    });
  });
});
