import React from 'react';
import {
  Simulate, findRenderedComponentWithType, renderIntoDocument,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';

import { logOutUser, setAuthToken } from 'core/actions';
import { loadUserProfile } from 'core/reducers/user';
import * as api from 'core/api';
import AuthenticateButton, {
  AuthenticateButtonBase,
  createHandleLogOutFunction,
  mapStateToProps,
} from 'core/components/AuthenticateButton';
import {
  dispatchClientMetadata,
  dispatchSignInActions,
} from 'tests/unit/amo/helpers';
import {
  createFakeEvent,
  createUserProfileResponse,
  getFakeI18nInst,
  shallowUntilTarget,
  userAuthToken,
} from 'tests/unit/helpers';
import Icon from 'ui/components/Icon';


describe(__filename, () => {
  function renderTree(props) {
    const { store } = dispatchSignInActions();

    return findRenderedComponentWithType(renderIntoDocument(
      <Provider store={store}>
        <AuthenticateButtonBase i18n={getFakeI18nInst()} {...props} />
      </Provider>
    ), AuthenticateButtonBase);
  }

  const render = (props) => findDOMNode(renderTree(props));

  it('passes along a className', () => {
    const root = render({ className: 'MyComponent-auth-button' });
    expect(root.classList.contains('MyComponent-auth-button')).toBeTruthy();
  });

  it('renders an Icon by default', () => {
    const root = renderTree();
    const icon = findRenderedComponentWithType(root, Icon);
    expect(icon).toBeTruthy();
  });

  it('lets you hide the Icon', () => {
    const root = renderTree({ noIcon: true });
    expect(() => findRenderedComponentWithType(root, Icon))
      .toThrowError(/Did not find exactly one match/);
  });

  it('lets you customize the log in text', () => {
    const root = render({ isAuthenticated: false, logInText: 'Maybe log in?' });
    expect(root.textContent).toEqual('Maybe log in?');
    expect(root.href).toContain('#login');
  });

  it('lets you customize the log out text', () => {
    const root = render({ isAuthenticated: true, logOutText: 'Maybe log out?' });
    expect(root.textContent).toEqual('Maybe log out?');
    expect(root.href).toContain('#logout');
  });

  it('shows a log in button when unauthenticated', () => {
    const handleLogIn = sinon.spy();
    const location = sinon.stub();
    const root = render({ isAuthenticated: false, handleLogIn, location });

    expect(root.textContent).toEqual('Register or Log in');
    Simulate.click(root);
    sinon.assert.calledWith(handleLogIn, location);
  });

  it('shows a log out button when authenticated', () => {
    const handleLogOut = sinon.spy();
    const root = render({ handleLogOut, isAuthenticated: true });

    expect(root.textContent).toEqual('Log out');
    Simulate.click(root);
    sinon.assert.called(handleLogOut);
  });

  it('updates the location on handleLogIn', () => {
    const { store } = dispatchSignInActions();
    const _window = { location: '/foo' };
    const location = { pathname: '/bar', query: { q: 'wat' } };
    const startLoginUrlStub = sinon.stub(api, 'startLoginUrl').returns('https://a.m.org/login');

    const { handleLogIn } = mapStateToProps(store.getState());
    handleLogIn(location, { _window });

    expect(_window.location).toEqual('https://a.m.org/login');
    sinon.assert.calledWith(startLoginUrlStub, { location });
  });

  it('retrieves `isAuthenticated` from state', () => {
    const { store } = dispatchClientMetadata();

    expect(mapStateToProps(store.getState()).isAuthenticated).toEqual(false);
    store.dispatch(setAuthToken(userAuthToken()));
    store.dispatch(loadUserProfile({
      profile: createUserProfileResponse(),
    }));
    expect(mapStateToProps(store.getState()).isAuthenticated).toEqual(true);
  });

  it('allows a signed-in user to log out', () => {
    const { store } = dispatchSignInActions();
    const handleLogOut = sinon.stub();
    const allProps = {
      handleLogOut,
      i18n: getFakeI18nInst(),
    };

    const wrapper = shallowUntilTarget(
      <AuthenticateButton store={store} {...allProps} />,
      AuthenticateButtonBase,
    );

    wrapper.simulate('click', createFakeEvent());

    sinon.assert.calledWith(handleLogOut, {
      api: store.getState().api,
    });
  });

  describe('createHandleLogOutFunction()', () => {
    it('logs out a signed-in user on the server and client sides', () => {
      sinon.stub(api, 'logOutFromServer').returns(Promise.resolve());

      const { store, state } = dispatchSignInActions();
      const dispatchSpy = sinon.spy(store, 'dispatch');

      const handleLogOut = createHandleLogOutFunction(dispatchSpy);
      const apiState = state.api;
      // This makes sure the state contains a token because user is logged in.
      expect(apiState.token).toBeTruthy();

      return handleLogOut({ api: apiState })
        .then(() => {
          sinon.assert.calledWith(api.logOutFromServer, { api: apiState });
          sinon.assert.calledWith(dispatchSpy, logOutUser());
        });
    });
  });
});
