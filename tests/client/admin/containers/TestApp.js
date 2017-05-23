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
    expect(root.type).toEqual('div');
    // First child is <Helmet />.
    // Second child is <NavBar />.
    // Third child is the <div className="App"> wrapper.
    const wrapper = root.props.children[2];
    expect(wrapper.props.className).toEqual('App');
    expect(wrapper.props.children.type).toEqual(MyComponent);
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
      expect(remove.called).toBeTruthy();
      expect(remove.firstCall.args[0]).toEqual('pretend-cookie-name');
    });

    it('logs out the user', () => {
      expect(mapDispatchToProps.handleLogOut()).toEqual({ type: 'LOG_OUT_USER' });
    });
  });

  it('is authenticated when there is a token', () => {
    expect(mapStateToProps({ auth: { token: 'foo' } })).toEqual({ isAuthenticated: true });
  });

  it('is not authenticated when there is no token', () => {
    expect(mapStateToProps({ auth: {} })).toEqual({ isAuthenticated: false });
  });
});
