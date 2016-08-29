import React from 'react';

import { AppBase, mapDispatchToProps, mapStateToProps } from 'admin/containers/App';
import { shallowRender } from 'tests/client/helpers';

describe('App', () => {
  it('renders its children', () => {
    class MyComponent extends React.Component {
      render() {
        return <p>The component</p>;
      }
    }
    const root = shallowRender(<AppBase authenticated logOut={() => {}}><MyComponent /></AppBase>);
    assert.equal(root.type, 'div');
    // First child is <Helmet />.
    // Second child is <NavBar />.
    // Third child is the <div className="App"> wrapper.
    const wrapper = root.props.children[2];
    assert.equal(wrapper.props.className, 'App');
    assert.equal(wrapper.props.children.type, MyComponent);
  });

  it('defines logOut to log out the user', () => {
    assert.deepEqual(mapDispatchToProps.logOut(), { type: 'LOG_OUT_USER' });
  });

  it('is authenticated when there is a token', () => {
    assert.deepEqual(mapStateToProps({ auth: { token: 'foo' } }), { authenticated: true });
  });

  it('is not authenticated when there is no token', () => {
    assert.deepEqual(mapStateToProps({ auth: {} }), { authenticated: false });
  });
});
