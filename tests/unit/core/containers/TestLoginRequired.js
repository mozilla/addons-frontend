import { shallow } from 'enzyme';
import * as React from 'react';

import { logOutUser } from 'amo/reducers/users';
import {
  LoginRequiredBase,
  mapStateToProps,
} from 'core/containers/LoginRequired';
import LoginPage from 'core/components/LoginPage';
import { dispatchSignInActions } from 'tests/unit/amo/helpers';


describe(__filename, () => {
  class MyComponent extends React.Component {
    render() {
      return <p>Authenticated content.</p>;
    }
  }

  it('renders <LoginPage /> when unauthenticated', () => {
    const root = shallow(
      <LoginRequiredBase authenticated={false}>
        <MyComponent />
      </LoginRequiredBase>
    );
    expect(root.type()).toEqual(LoginPage);
  });

  it('renders the children when authenticated', () => {
    const root = shallow(
      <LoginRequiredBase authenticated>
        <MyComponent />
      </LoginRequiredBase>
    );
    expect(root.type()).toEqual(MyComponent);
  });

  describe('mapStateToProps', () => {
    let store;

    beforeEach(() => {
      store = dispatchSignInActions().store;
    });

    it('sets authenticated to true', () => {
      expect(mapStateToProps(store.getState())).toEqual({ authenticated: true });
    });

    it('sets authenticated to false', () => {
      store.dispatch(logOutUser());
      expect(mapStateToProps(store.getState())).toEqual({ authenticated: false });
    });
  });
});
