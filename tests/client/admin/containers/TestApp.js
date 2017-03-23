import config from 'config';
import React from 'react';
import cookie from 'react-cookie';

import { AppBase, mapDispatchToProps, mapStateToProps } from 'admin/containers/App';
import { shallowRender } from 'tests/client/helpers';

describe('App', () => {
  it('renders its children', () => {
    class MyComponent extends React.Component {
      render() {
        return <p>The component</p>;
      }
    }
    const root = shallowRender(
      <AppBase isAuthenticated handleLogOut={() => {}}><MyComponent /></AppBase>
    );
    assert.equal(root.type, 'div');
    // First child is <Helmet />.
    // Second child is <NavBar />.
    // Third child is the <div className="App"> wrapper.
    const wrapper = root.props.children[2];
    assert.equal(wrapper.props.className, 'App');
    assert.equal(wrapper.props.children.type, MyComponent);
  });

  describe('mapDispatchToProps.handleLogOut', () => {
    let remove;

    beforeEach(() => {
      remove = sinon.stub(cookie, 'remove');
      sinon.stub(config, 'get')
        .withArgs('cookieName').returns('pretend-cookie-name');
    });

    it('clears the cookie', () => {
      mapDispatchToProps.handleLogOut();
      assert.ok(remove.called, 'handleLogOut() did not remove the cookie');
      assert.equal(remove.firstCall.args[0], 'pretend-cookie-name');
    });

    it('logs out the user', () => {
      assert.deepEqual(mapDispatchToProps.handleLogOut(), { type: 'LOG_OUT_USER' });
    });
  });

  it('is authenticated when there is a token', () => {
    assert.deepEqual(mapStateToProps({ auth: { token: 'foo' } }), { isAuthenticated: true });
  });

  it('is not authenticated when there is no token', () => {
    assert.deepEqual(mapStateToProps({ auth: {} }), { isAuthenticated: false });
  });
});
